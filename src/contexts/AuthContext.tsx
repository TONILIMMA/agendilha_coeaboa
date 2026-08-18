import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User, Session } from "@supabase/supabase-js";
import { toAuthEmail, toLegacyAuthEmail, toE164Digits, validateWhatsappForAccount } from "@/lib/phone";
import { handleError } from "@/lib/error-handler";
import { logger } from "@/lib/logger";

export type SignUpAdditionalData = {
  profile?: Record<string, unknown>;
  artist?: Record<string, unknown> & { name?: string };
};

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  isAdmin: boolean;
  mustChangePassword: boolean;
  refreshMustChangePassword: () => Promise<void>;
  signUp: (
    phone: string,
    password: string,
    name?: string,
    additionalData?: SignUpAdditionalData,
    role?: string,
    pin?: string,
  ) => Promise<{ error: Error | null }>;
  signIn: (phone: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [mustChangePassword, setMustChangePassword] = useState(false);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "TOKEN_REFRESHED") {
        // Session token refreshed
      }
      if (event === "SIGNED_OUT" || (!session && event === "TOKEN_REFRESHED")) {
        setSession(null);
        setUser(null);
        setIsAdmin(false);
        setMustChangePassword(false);
        setLoading(false);
        return;
      }
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        setTimeout(() => checkAdmin(session.user.id), 0);
        setTimeout(() => checkMustChangePassword(session.user.id), 0);
      } else {
        setIsAdmin(false);
        setMustChangePassword(false);
      }
      setLoading(false);
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        checkAdmin(session.user.id);
        checkMustChangePassword(session.user.id);
      }
      setLoading(false);
    });

    // Periodic session check removed in favor of onAuthStateChange and autoRefreshToken
    // This reduces redundant network requests and improves performance


    return () => {
      subscription.unsubscribe();
      // Interval removed
    };
  }, []);

  async function checkAdmin(userId: string) {
    const { data: roles, error } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId);

    if (error) {
      handleError(error, { 
        silent: true, 
        context: "AuthContext:checkAdmin" 
      });
    }

    setIsAdmin(!!roles?.some(({ role }) => role === 'admin' || role === 'master'));
  }

  async function checkMustChangePassword(userId: string) {
    const { data, error } = await supabase
      .from("profiles")
      .select("must_change_password")
      .eq("user_id", userId)
      .maybeSingle();

    if (error) {
      handleError(error, { 
        silent: true, 
        context: "AuthContext:checkMustChangePassword" 
      });
    }
    setMustChangePassword(!!data?.must_change_password);
  }

  async function refreshMustChangePassword() {
    if (user?.id) await checkMustChangePassword(user.id);
  }

  /**
   * Garante que a pessoa tenha linha em `profiles`. O trigger de signup cria,
   * mas contas antigas (ou signup interrompido) podem ter ficado sem — e sem
   * perfil o app trava em vários gates.
   */
  async function ensureProfile(userId: string) {
    const { data, error: readError } = await supabase.from("profiles").select("user_id").eq("user_id", userId).maybeSingle();
    if (readError) {
      handleError(readError, { silent: true, context: "AuthContext:ensureProfile:read" });
    }
    if (data) return;
    const { error } = await supabase.from("profiles").insert({ user_id: userId });
    if (error) handleError(error, { silent: true, context: "AuthContext:ensureProfile:insert" });
  }

  const signUp = async (
    phone: string,
    password: string,
    name?: string,
    additionalData: SignUpAdditionalData = {},
    role: string = 'publico',
    pin?: string,
  ) => {
    const cleanName = name?.trim();

    const phoneProblem = validateWhatsappForAccount(phone);
    if (phoneProblem) return { error: new Error(phoneProblem) };

    const fullPhone = `+${toE164Digits(phone)}`;
    const fakeEmail = toAuthEmail(phone)!;

    const { data, error } = await supabase.auth.signUp({
      email: fakeEmail,
      password,
      options: {
        data: {
          name: cleanName ?? null,
          full_name: cleanName ?? null,
          phone: fullPhone,
        },
      },
    });

    if (error) {
      const raw = (error.message || "").toLowerCase();
      if (raw.includes("already registered") || raw.includes("already exists") || raw.includes("user_already")) {
        return {
          error: new Error(
            "Esse WhatsApp já tem conta no AgendIlha. Entra pelo login ou usa “Esqueci minha senha”.",
          ),
        };
      }
      return { error: error as Error };
    }
    if (!data.user) return { error: new Error("Não deu pra criar a conta agora. Tenta de novo em instantes.") };

    await ensureProfile(data.user.id);

    // PIN de recuperação: sem ele a pessoa não consegue redefinir a senha sozinha depois.
    if (pin && /^\d{4}$/.test(pin)) {
      const { error: pinError } = await supabase.rpc("set_user_pin", { new_pin: pin, current_password: password });
      if (pinError) logger.warn("[Auth] não deu pra salvar o PIN no cadastro", pinError);
    }

    if (!cleanName) return { error: null };

    // Prepare profile data
    const profilePayload = {
      responsible_name: cleanName,
      phone: fullPhone,
      role: role === 'divulgador' ? 'divulgador' : 'public',
      user_type: role,
      onboarding_completed: true,
      ...additionalData.profile
    };

    const { error: profileError } = await supabase
      .from("profiles")
      .upsert({ 
        user_id: data.user.id, 
        ...profilePayload 
      }, { onConflict: 'user_id' });

    if (profileError) return { error: profileError as Error };

    // If it's an artist, also create artist_profile
    if ((role === 'artista' || role === 'artist') && additionalData.artist) {
      const { error: artistError } = await supabase
        .from("artist_profiles")
        .upsert({
          user_id: data.user.id,
          name: additionalData.artist.name || cleanName,
          ...additionalData.artist
        }, { onConflict: 'user_id' });
      
      if (artistError) return { error: artistError as Error };
    }

    return { error: null };
  };

  const signIn = async (phone: string, password: string) => {
    const email = toAuthEmail(phone);
    if (!email) {
      return { error: new Error("Informe o WhatsApp com DDD. Ex: (21) 98765-4321") };
    }

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (!error && data.user) {
      await ensureProfile(data.user.id);
      return { error: null };
    }

    // Contas criadas antes da correção de normalização usam outro e-mail sintético.
    const legacyEmail = toLegacyAuthEmail(phone);
    if (legacyEmail && legacyEmail !== email) {
      const legacy = await supabase.auth.signInWithPassword({ email: legacyEmail, password });
      if (!legacy.error && legacy.data.user) {
        await ensureProfile(legacy.data.user.id);
        return { error: null };
      }
    }

    const raw = (error?.message || "").toLowerCase();
    if (raw.includes("invalid login")) {
      return {
        error: new Error("WhatsApp ou senha não batem. Se esqueceu a senha, usa “Esqueci minha senha”."),
      };
    }
    return { error: (error as Error) ?? new Error("Não deu pra entrar agora. Tenta de novo.") };
  };

  const signOut = async () => {
    sessionStorage.removeItem("admin_pin_token");
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, isAdmin, mustChangePassword, refreshMustChangePassword, signUp, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

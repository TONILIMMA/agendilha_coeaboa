import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User, Session } from "@supabase/supabase-js";

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
    const { data: roles } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId);

    setIsAdmin(!!roles?.some(({ role }) => role === 'admin' || role === 'master'));
  }

  async function checkMustChangePassword(userId: string) {
    const { data } = await supabase
      .from("profiles")
      .select("must_change_password")
      .eq("user_id", userId)
      .maybeSingle();
    setMustChangePassword(!!data?.must_change_password);
  }

  async function refreshMustChangePassword() {
    if (user?.id) await checkMustChangePassword(user.id);
  }

  const formatPhoneToEmail = (phone: string): string => {
    const digits = phone.replace(/\D/g, "");
    const fullNumber = digits.startsWith("55") ? digits : `55${digits}`;
    return `${fullNumber}@phone.agendilha.app`;
  };

  const signUp = async (
    phone: string,
    password: string,
    name?: string,
    additionalData: SignUpAdditionalData = {},
    role: string = 'public',
  ) => {
    const cleanName = name?.trim();
    const digits = phone.replace(/\D/g, "");
    const fullPhone = digits.startsWith("55") ? `+${digits}` : `+55${digits}`;
    const fakeEmail = formatPhoneToEmail(phone);

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

    if (error || !data.user || !cleanName) {
      return { error: error as Error | null };
    }

    // Prepare profile data
    const profilePayload = {
      responsible_name: cleanName,
      phone: fullPhone,
      role: role === 'artist' ? 'public' : role, // Use 'public' for artists in roles table if needed, but 'artist' in user_type
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
    if (role === 'artist' && additionalData.artist) {
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
    const fakeEmail = formatPhoneToEmail(phone);
    const { error } = await supabase.auth.signInWithPassword({ email: fakeEmail, password });
    return { error: error as Error | null };
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

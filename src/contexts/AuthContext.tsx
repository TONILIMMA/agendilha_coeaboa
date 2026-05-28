import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User, Session } from "@supabase/supabase-js";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  isAdmin: boolean;
   signUp: (phone: string, password: string, name?: string, additionalData?: any, role?: string) => Promise<{ error: Error | null }>;
  signIn: (phone: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "TOKEN_REFRESHED") {
        console.log("Session token refreshed");
      }
      if (event === "SIGNED_OUT" || (!session && event === "TOKEN_REFRESHED")) {
        setSession(null);
        setUser(null);
        setIsAdmin(false);
        setLoading(false);
        return;
      }
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        setTimeout(() => checkAdmin(session.user.id), 0);
      } else {
        setIsAdmin(false);
      }
      setLoading(false);
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        checkAdmin(session.user.id);
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
    // Check both legacy system and new robust system
    const { data: legacyAdmin } = await supabase.rpc("has_role", { _user_id: userId, _role: "admin" });
    const { data: legacyMaster } = await supabase.rpc("has_role", { _user_id: userId, _role: "master" });
    
    const { data: newRoles } = await supabase
      .from('app_user_roles')
      .select('app_roles(name)')
      .eq('user_id', userId);
    
    const hasNewRole = newRoles?.some(r => 
      (r.app_roles as any)?.name === 'admin' || (r.app_roles as any)?.name === 'master_admin'
    );

    setIsAdmin(!!legacyAdmin || !!legacyMaster || !!hasNewRole);
  }

  const formatPhoneToEmail = (phone: string): string => {
    const digits = phone.replace(/\D/g, "");
    const fullNumber = digits.startsWith("55") ? digits : `55${digits}`;
    return `${fullNumber}@phone.agendilha.app`;
  };

   const signUp = async (phone: string, password: string, name?: string, additionalData: any = {}, role: string = 'public') => {
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

     const profilePayload = {
       responsible_name: cleanName,
       phone: fullPhone,
       role,
       ...additionalData
     };

    const { data: existingProfile, error: profileLookupError } = await supabase
      .from("profiles")
      .select("id")
      .eq("user_id", data.user.id)
      .maybeSingle();

    if (profileLookupError) {
      return { error: profileLookupError as Error };
    }

    const profileRequest = existingProfile
      ? supabase.from("profiles").update(profilePayload).eq("user_id", data.user.id)
      : supabase.from("profiles").insert({ user_id: data.user.id, ...profilePayload });

    const { error: profileError } = await profileRequest;
    return { error: (profileError ?? error) as Error | null };
  };

  const signIn = async (phone: string, password: string) => {
    const fakeEmail = formatPhoneToEmail(phone);
    const { error } = await supabase.auth.signInWithPassword({ email: fakeEmail, password });
    return { error: error as Error | null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, isAdmin, signUp, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

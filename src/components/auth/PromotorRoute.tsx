import { ReactNode, useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { ROUTES } from "@/routes/config";

/**
 * Guard que só permite acesso a usuários cujo `profiles.user_type`
 * seja `promotor`/`divulgador` ou que sejam admin/master.
 * Usuários `publico` são redirecionados para a agenda pública.
 */
export function PromotorRoute({ children }: { children: ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const location = useLocation();
  const [status, setStatus] = useState<"loading" | "ok" | "deny">("loading");

  useEffect(() => {
    let cancelled = false;
    if (authLoading) return;
    if (!user) {
      setStatus("deny");
      return;
    }
    (async () => {
      const [{ data: profile }, { data: roles }] = await Promise.all([
        supabase
          .from("profiles")
          .select("user_type")
          .eq("user_id", user.id)
          .maybeSingle(),
        supabase.from("user_roles").select("role").eq("user_id", user.id),
      ]);
      if (cancelled) return;
      const userType = (profile?.user_type ?? "").toLowerCase();
      const isPromotor =
        userType === "promotor" ||
        userType === "divulgador" ||
        roles?.some(({ role }) => role === "admin" || role === "master");
      setStatus(isPromotor ? "ok" : "deny");
    })();
    return () => {
      cancelled = true;
    };
  }, [user, authLoading]);

  if (authLoading || status === "loading") {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return (
      <Navigate
        to={`/auth?redirect=${encodeURIComponent(location.pathname)}`}
        replace
      />
    );
  }

  if (status === "deny") {
    return <Navigate to={ROUTES.AGENDA} replace />;
  }

  return <>{children}</>;
}
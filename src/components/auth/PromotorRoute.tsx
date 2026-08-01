import { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useDivulgadorStatus } from "@/hooks/useDivulgadorStatus";
import { ROUTES } from "@/routes/config";

/**
 * Guard que só permite acesso a usuários cujo `profiles.user_type`
 * seja `promotor`/`divulgador` ou que sejam admin/master.
 * Usuários `publico` são redirecionados para a agenda pública.
 */
export function PromotorRoute({ children }: { children: ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const location = useLocation();
  const { loading: statusLoading, isDivulgador } = useDivulgadorStatus();

  if (authLoading || (!!user && statusLoading)) {
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

  if (!isDivulgador) {
    return <Navigate to={ROUTES.AGENDA} replace />;
  }

  return <>{children}</>;
}
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { qk } from "@/data/queryKeys";
import { handleError } from "@/lib/error-handler";

export type DivulgadorRequestStatus = "pendente" | "aprovado" | "recusado";

export interface DivulgadorRequest {
  id: string;
  user_id: string;
  nome: string | null;
  whatsapp: string | null;
  tipo_divulgador: string | null;
  motivo: string | null;
  status: DivulgadorRequestStatus;
  admin_notes: string | null;
  reviewed_at: string | null;
  created_at: string;
}

/**
 * Diz se a pessoa logada já pode divulgar eventos e qual o status do pedido.
 * Centralizado na camada de dados com cache compartilhado.
 */
export function useDivulgadorStatus(targetUserId?: string | null) {
  const { user } = useAuth();
  const userId = targetUserId ?? user?.id ?? null;
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: qk.divulgador.status(userId),
    enabled: !!userId,
    staleTime: 60_000,
    queryFn: async () => {
      const [profileRes, rolesRes, collabRes, requestRes] = await Promise.all([
        supabase.from("profiles").select("user_type, responsible_name, phone, whatsapp_phone").eq("user_id", userId!).maybeSingle(),
        supabase.from("user_roles").select("role").eq("user_id", userId!),
        supabase
          .from("collaborators")
          .select("can_submit, is_active")
          .eq("user_id", userId!)
          .eq("is_active", true)
          .maybeSingle(),
        supabase
          .from("divulgador_requests")
          .select("id, user_id, nome, whatsapp, tipo_divulgador, motivo, status, admin_notes, reviewed_at, created_at")
          .eq("user_id", userId!)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle(),
      ]);

      if (profileRes.error) throw profileRes.error;
      if (rolesRes.error) throw rolesRes.error;

      const userType = ((profileRes.data as { user_type?: string | null } | null)?.user_type ?? "").toLowerCase();
      const isAdmin = !!rolesRes.data?.some((r: { role: string }) => r.role === "admin" || r.role === "master");
      const canSubmitAsCollaborator =
        (collabRes.data as { can_submit?: boolean | null } | null)?.can_submit === true;
      const isDivulgador =
        isAdmin || userType === "divulgador" || userType === "promotor" || canSubmitAsCollaborator;

      return {
        isAdmin,
        isDivulgador,
        isCollaborator: canSubmitAsCollaborator,
        profile: profileRes.data ?? null,
        request: (requestRes.data as DivulgadorRequest | null) ?? null,
      };
    },
    meta: {
      onError: (error: unknown) => handleError(error, { silent: true, context: "useDivulgadorStatus" })
    }
  });

  return {
    ...query,
    loading: !!userId && query.isLoading && !query.data,
    isAdmin: query.data?.isAdmin ?? false,
    isDivulgador: query.data?.isDivulgador ?? false,
    isCollaborator: query.data?.isCollaborator ?? false,
    profile: query.data?.profile ?? null,
    request: query.data?.request ?? null,
    refresh: () => qc.invalidateQueries({ queryKey: qk.divulgador.status(userId) }),
  };
}

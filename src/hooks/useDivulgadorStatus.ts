import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { qk } from "@/data/queryKeys";

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
 * Diz se a pessoa logada já pode divulgar eventos (divulgador, admin/master
 * ou colaborador com permissão de envio) e qual o status do pedido dela
 * pra virar Divulgador.
 *
 * Espelha exatamente a regra `public.can_create_events` do banco.
 */
export function useDivulgadorStatus() {
  const { user } = useAuth();
  const userId = user?.id ?? null;
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
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
  });

  return {
    loading: !!userId && isLoading && !data,
    isAdmin: data?.isAdmin ?? false,
    isDivulgador: data?.isDivulgador ?? false,
    isCollaborator: data?.isCollaborator ?? false,
    profile: data?.profile ?? null,
    request: data?.request ?? null,
    refresh: () => qc.invalidateQueries({ queryKey: qk.divulgador.status(userId) }),
  };
}
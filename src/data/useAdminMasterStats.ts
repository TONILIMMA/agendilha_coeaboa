import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { callEdge } from "@/lib/edge";
import { handleError } from "@/lib/error-handler";
import { qk } from "./queryKeys";
import type { AdminUser } from "./useAdminUsers";

export interface MasterStats {
  users: number;
  admins: number;
  approved: number;
  newsletter: number;
}

/** Estatísticas agregadas exibidas no painel Master. */
export function useAdminMasterStats(enabled = true) {
  return useQuery({
    queryKey: qk.adminStats.master(),
    enabled,
    staleTime: 30_000,
    queryFn: async (): Promise<MasterStats> => {
      const usersList = await callEdge<AdminUser[]>("list-users");

      const [{ data: roles }, approvedRes, subsRes] = await Promise.all([
        supabase.from("user_roles").select("user_id, role"),
        supabase
          .from("submissions")
          .select("*", { count: "exact", head: true })
          .in("status", ["aprovado", "publicado", "approved"]),
        supabase
          .from("newsletter_subscribers")
          .select("*", { count: "exact", head: true }),
      ]);

      const admins = (roles ?? []).filter(
        (r) => r.role === "admin" || r.role === "master"
      ).length;

      return {
        users: usersList.length,
        admins,
        approved: approvedRes.count ?? 0,
        newsletter: subsRes.count ?? 0,
      };
    },
    meta: {
      onError: (error: unknown) => handleError(error, {
        fallback: "Não deu pra carregar os dados do painel Master.",
        context: "useAdminMasterStats"
      })
    }
  });
}
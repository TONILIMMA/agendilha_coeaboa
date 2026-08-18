import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { callEdge } from "@/lib/edge";
import { handleError } from "@/lib/error-handler";
import { qk } from "./queryKeys";

export interface AdminUser {
  id: string;
  email: string;
  responsible_name: string | null;
  phone: string | null;
  is_admin: boolean;
  is_master: boolean;
}

/** Lista de usuários via edge function `list-users`. */
export function useAdminUsers(enabled = true) {
  return useQuery({
    queryKey: qk.adminUsers.list(),
    queryFn: () => callEdge<AdminUser[]>("list-users"),
    enabled,
    staleTime: 30_000,
    meta: {
      onError: (error: unknown) => handleError(error, { 
        fallback: "Não deu pra listar os usuários agora.",
        context: "useAdminUsers" 
      })
    }
  });
}

export interface UpdateAdminUserInput {
  user_id: string;
  responsible_name?: string | null;
  phone?: string | null;
  is_admin?: boolean;
  is_master?: boolean;
}

export function useUpdateAdminUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdateAdminUserInput) =>
      callEdge<{ ok: true }>("update-user", input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.adminUsers.all });
      qc.invalidateQueries({ queryKey: qk.adminStats.all });
    },
  });
}

export function useDeleteAdminUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (user_id: string) =>
      callEdge<{ ok: true }>("delete-user", { user_id }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.adminUsers.all });
      qc.invalidateQueries({ queryKey: qk.adminStats.all });
    },
  });
}
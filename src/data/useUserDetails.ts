import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { handleError } from "@/lib/error-handler";
import { qk } from "./queryKeys";

export interface UserDetailsEvent {
  id: string;
  event_title: string | null;
  date: string | null;
  status: string | null;
}

export interface UserDetailsCollab {
  can_submit: boolean;
  can_approve: boolean;
  can_edit: boolean;
  can_delete: boolean;
  is_active: boolean;
  role_title: string | null;
}

export interface UserDetails {
  events: UserDetailsEvent[];
  roles: string[];
  collab: UserDetailsCollab | null;
}

export function useUserDetails(userId: string | null | undefined, enabled = true) {
  return useQuery({
    queryKey: qk.userDetails.byId(userId),
    enabled: enabled && !!userId,
    queryFn: async (): Promise<UserDetails> => {
      const [events, roles, collab] = await Promise.all([
        supabase
          .from("submissions")
          .select("id, event_title, date, status")
          .eq("user_id", userId!)
          .order("date", { ascending: false })
          .limit(30),
        supabase.from("user_roles").select("role").eq("user_id", userId!),
        supabase
          .from("collaborators")
          .select("can_submit, can_approve, can_edit, can_delete, is_active, role_title")
          .eq("user_id", userId!)
          .maybeSingle(),
      ]);
      if (events.error) throw events.error;
      if (roles.error) throw roles.error;
      if (collab.error) throw collab.error;
      return {
        events: (events.data ?? []) as UserDetailsEvent[],
        roles: (roles.data ?? []).map((r) => String(r.role)),
        collab: (collab.data as UserDetailsCollab | null) ?? null,
      };
    },
    meta: {
      onError: (error: unknown) => handleError(error, { 
        fallback: "Não deu pra carregar os detalhes do usuário.",
        context: "useUserDetails" 
      })
    }
  });
}

export interface UserPermissionsInput {
  userId: string;
  name?: string | null;
  email?: string | null;
  can_submit: boolean;
  can_approve: boolean;
  can_edit: boolean;
  can_delete: boolean;
}

/** Grava as permissões finas do usuário na tabela `collaborators`. */
export function useSaveUserPermissions() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ userId, name, email, ...perms }: UserPermissionsInput) => {
      const { error } = await supabase.from("collaborators").upsert(
        {
          user_id: userId,
          name: name ?? "Sem nome",
          email: email ?? null,
          is_active: true,
          ...perms,
        },
        { onConflict: "user_id" },
      );
      if (error) throw error;
    },
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: qk.userDetails.byId(vars.userId) });
      qc.invalidateQueries({ queryKey: qk.collaborators.all });
    },
  });
}

export interface ProfileOption {
  id: string;
  name: string;
  phone: string;
}

/** Lista enxuta de perfis pra seletores (vincular colaborador, etc). */
export function useProfileOptions(enabled = true) {
  return useQuery({
    queryKey: qk.profileOptions.list(),
    enabled,
    staleTime: 5 * 60_000,
    meta: {
      onError: (error: unknown) => handleError(error, { silent: true, context: "useProfileOptions" })
    },
    queryFn: async (): Promise<ProfileOption[]> => {
      const { data, error } = await supabase
        .from("profiles")
        .select("user_id, responsible_name, phone")
        .order("responsible_name", { ascending: true });
      if (error) throw error;
      return (data ?? []).map((u) => ({
        id: u.user_id,
        name: u.responsible_name || "Sem nome",
        phone: u.phone || "",
      }));
    },
  });
}
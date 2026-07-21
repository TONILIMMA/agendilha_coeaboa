import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { TablesInsert, TablesUpdate } from "@/integrations/supabase/types";
import { qk } from "./queryKeys";

export interface Collaborator {
  id: string;
  user_id: string;
  name: string;
  email: string | null;
  role_title: string;
  can_submit: boolean;
  can_approve: boolean;
  can_edit: boolean;
  can_delete: boolean;
  is_active: boolean;
  created_at: string;
}

export function useCollaborators(enabled = true) {
  return useQuery({
    queryKey: qk.collaborators.list(),
    enabled,
    queryFn: async (): Promise<Collaborator[]> => {
      const { data, error } = await supabase
        .from("collaborators")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as Collaborator[];
    },
  });
}

export function useUpsertCollaborator() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      id?: string | null;
      payload: TablesInsert<"collaborators"> | TablesUpdate<"collaborators">;
    }) => {
      if (input.id) {
        const { error } = await supabase
          .from("collaborators")
          .update(input.payload as TablesUpdate<"collaborators">)
          .eq("id", input.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("collaborators")
          .insert(input.payload as TablesInsert<"collaborators">);
        if (error) throw error;
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.collaborators.all }),
  });
}

export function useDeleteCollaborator() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("collaborators").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.collaborators.all }),
  });
}
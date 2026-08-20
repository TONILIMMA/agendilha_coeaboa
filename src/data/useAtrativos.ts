import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { TablesInsert, TablesUpdate } from "@/integrations/supabase/types";
import { qk } from "./queryKeys";
import { emitEntityChanged } from "@/lib/entityEvents";
import { handleError } from "@/lib/error-handler";

export interface AtrativoRow {
  id: string;
  name: string;
  type: string | null;
  description: string | null;
  estabelecimento_id: string | null;
  tipo_atrativo?: string | null;
  estilos?: string[] | null;
  pais?: string | null;
  estado?: string | null;
  cidade_regiao?: string | null;
  membros_equipe?: string | null;
  responsavel_nome?: string | null;
  responsavel_telefone?: string | null;
  responsavel_email?: string | null;
  responsavel_redes?: string | null;
  fotos?: string[] | null;
  logo_url?: string | null;
  is_approved?: boolean;
  responsavel_id?: string | null;
}

const SELECT_MINE =
  "id, name, type, description, estabelecimento_id, tipo_atrativo, estilos, pais, estado, cidade_regiao, membros_equipe, responsavel_nome, responsavel_telefone, responsavel_email, responsavel_redes, fotos, is_approved";

export function useMyAtrativos(userId: string | null | undefined) {
  return useQuery({
    queryKey: qk.atrativos.mine(userId),
    enabled: !!userId,
    meta: {
      onError: (error: unknown) => handleError(error, { 
        silent: true, 
        context: "useMyAtrativos" 
      })
    },
    queryFn: async (): Promise<AtrativoRow[]> => {
      const { data, error } = await supabase
        .from("atrativos")
        .select(SELECT_MINE)
        .eq("responsavel_id", userId!)
        .order("name");
      if (error) throw error;
      return ((data ?? []) as unknown) as AtrativoRow[];
    },
  });
}

/** Lista completa de atrativos — restrito no cliente a Admin/Master. */
export function useAllAtrativos(enabled: boolean) {
  return useQuery({
    queryKey: [...qk.atrativos.all, "list"],
    enabled,
    meta: {
      onError: (error: unknown) => handleError(error, { 
        fallback: "Não deu pra carregar a lista de atrativos.",
        context: "useAllAtrativos" 
      })
    },
    queryFn: async (): Promise<AtrativoRow[]> => {
      const { data, error } = await supabase
        .from("atrativos")
        .select(
          "id, name, type, description, estabelecimento_id, tipo_atrativo, estilos, pais, estado, cidade_regiao, membros_equipe, responsavel_nome, responsavel_telefone, responsavel_email, responsavel_redes, fotos, is_approved, responsavel_id, created_by",
        )
        .order("name");
      if (error) throw error;
      return ((data ?? []) as unknown) as AtrativoRow[];
    },
  });
}

export function useUpsertAtrativo() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      id?: string | null;
      payload: TablesInsert<"atrativos"> | TablesUpdate<"atrativos">;
    }) => {
      if (input.id) {
        const { error } = await supabase
          .from("atrativos")
          .update(input.payload as TablesUpdate<"atrativos">)
          .eq("id", input.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("atrativos")
          .insert(input.payload as TablesInsert<"atrativos">);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.atrativos.all });
      emitEntityChanged("atrativo");
    },
  });
}

export function useDeleteAtrativo() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("atrativos").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.atrativos.all });
      emitEntityChanged("atrativo");
    },
  });
}
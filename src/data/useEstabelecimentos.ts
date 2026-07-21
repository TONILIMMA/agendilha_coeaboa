import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { TablesInsert, TablesUpdate } from "@/integrations/supabase/types";
import { qk } from "./queryKeys";

export interface EstabelecimentoRow {
  id: string;
  nome: string;
  endereco: string | null;
  bairro: string | null;
  tipo: string | null;
  contato: string | null;
  tipos?: string[] | null;
  anotacoes?: string | null;
  cnpj?: string | null;
  responsavel_nome?: string | null;
  responsavel_telefone?: string | null;
  responsavel_email?: string | null;
  responsavel_redes?: string | null;
  fotos?: string[] | null;
  is_approved?: boolean;
}

const SELECT_MINE =
  "id, nome, endereco, bairro, tipo, contato, tipos, anotacoes, cnpj, responsavel_nome, responsavel_telefone, responsavel_email, responsavel_redes, fotos, is_approved";

export function useMyEstabelecimentos(userId: string | null | undefined) {
  return useQuery({
    queryKey: qk.estabelecimentos.mine(userId),
    enabled: !!userId,
    queryFn: async (): Promise<EstabelecimentoRow[]> => {
      const { data, error } = await supabase
        .from("estabelecimentos")
        .select(SELECT_MINE)
        .eq("responsavel_id", userId!)
        .order("nome");
      if (error) throw error;
      return (data ?? []) as EstabelecimentoRow[];
    },
  });
}

export function useUpsertEstabelecimento() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      id?: string | null;
      payload: TablesInsert<"estabelecimentos"> | TablesUpdate<"estabelecimentos">;
    }) => {
      if (input.id) {
        const { error } = await supabase
          .from("estabelecimentos")
          .update(input.payload as TablesUpdate<"estabelecimentos">)
          .eq("id", input.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("estabelecimentos")
          .insert(input.payload as TablesInsert<"estabelecimentos">);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.estabelecimentos.all });
    },
  });
}

export function useDeleteEstabelecimento() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("estabelecimentos").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.estabelecimentos.all });
    },
  });
}
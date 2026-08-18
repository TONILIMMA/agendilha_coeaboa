import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { handleError } from "@/lib/error-handler";
import { qk } from "./queryKeys";

export interface Estabelecimento {
  id: string;
  nome: string;
  bairro: string | null;
  endereco?: string | null;
  responsavel_telefone?: string | null;
  tipo?: string | null;
  created_at?: string;
}

export function useEstabelecimentos(options: { 
  enabled?: boolean; 
  staleTime?: number;
} = {}) {
  const qc = useQueryClient();

  const estabelecimentosQuery = useQuery({
    queryKey: qk.estabelecimentos.all,
    queryFn: async (): Promise<Estabelecimento[]> => {
      const { data, error } = await supabase
        .from("estabelecimentos")
        .select("*")
        .order("nome");
      if (error) throw error;
      return (data as unknown as Estabelecimento[]) ?? [];
    },
    enabled: options.enabled,
    staleTime: options.staleTime ?? 60_000,
    meta: {
      onError: (error: unknown) => handleError(error, {
        fallback: "Não conseguimos carregar os estabelecimentos.",
        context: "useEstabelecimentos"
      })
    }
  });

  return {
    estabelecimentos: estabelecimentosQuery.data ?? [],
    isLoading: estabelecimentosQuery.isLoading,
    refetch: estabelecimentosQuery.refetch
  };
}

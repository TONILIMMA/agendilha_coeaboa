import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { qk } from "./queryKeys";

export interface Atrativo {
  id: string;
  name: string;
  type: string | null;
  style: string | null;
  description: string | null;
  is_approved: boolean;
  created_at?: string | null;
  estabelecimento_id?: string | null;
}

export function useAtrativosData(options: { 
  enabled?: boolean; 
  staleTime?: number;
} = {}) {
  const qc = useQueryClient();

  const atrativosQuery = useQuery({
    queryKey: qk.atrativos.all,
    queryFn: async (): Promise<Atrativo[]> => {
      const { data, error } = await supabase
        .from("atrativos")
        .select("*")
        .order("name");
      if (error) throw error;
      return data ?? [];
    },
    enabled: options.enabled,
    staleTime: options.staleTime ?? 60_000,
  });

  return {
    atrativos: atrativosQuery.data ?? [],
    isLoading: atrativosQuery.isLoading,
    refetch: atrativosQuery.refetch
  };
}

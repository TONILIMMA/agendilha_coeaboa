import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { handleError } from "@/lib/error-handler";
import { qk } from "./queryKeys";
import { useCallback } from "react";

export interface PromotorProfile {
  id?: string;
  user_id: string;
  promotor_nome: string;
  promotor_whatsapp: string | null;
  tipo_promotor: "artista" | "produtor" | "estabelecimento" | "outro" | null;
}

/**
 * Perfil de Promotor/Divulgador com cache compartilhado.
 */
export function usePromotorProfile(targetUserId: string | null | undefined) {
  return useQuery({
    queryKey: qk.divulgador.status(targetUserId),
    enabled: !!targetUserId,
    staleTime: 30_000,
    queryFn: async (): Promise<PromotorProfile | null> => {
      const { data, error } = await supabase
        .from("promotor_profiles")
        .select("id, user_id, promotor_nome, promotor_whatsapp, tipo_promotor")
        .eq("user_id", targetUserId!)
        .maybeSingle();
      
      if (error) throw error;
      return (data as PromotorProfile) ?? null;
    },
    meta: {
      onError: (error: unknown) => handleError(error, { 
        silent: true, 
        context: "usePromotorProfile" 
      })
    }
  });
}

export function useUpsertPromotorProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      user_id: string;
      promotor_nome: string;
      promotor_whatsapp?: string | null;
      tipo_promotor?: string | null;
    }) => {
      const payload = {
        user_id: input.user_id,
        promotor_nome: input.promotor_nome.trim(),
        promotor_whatsapp: input.promotor_whatsapp?.trim() || null,
        tipo_promotor: input.tipo_promotor || null,
      };
      if (!payload.promotor_nome) return;
      const { error } = await supabase
        .from("promotor_profiles")
        .upsert(payload, { onConflict: "user_id" });
      if (error) throw error;
    },
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: qk.divulgador.status(vars.user_id) });
    }
  });
}

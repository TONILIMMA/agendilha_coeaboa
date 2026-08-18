import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { qk } from "./queryKeys";
import { handleError } from "@/lib/error-handler";

export interface DivulgadorRequestInput {
  userId: string;
  nome: string;
  whatsapp: string;
  tipo_divulgador: string | null;
  motivo: string;
  neighborhood?: string | null;
  social_profile?: string | null;
}

/** Cria o pedido pra virar Divulgador. */
export function useCreateDivulgadorRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: DivulgadorRequestInput) => {
      const { error } = await supabase.from("divulgador_requests").insert({
        user_id: input.userId,
        nome: input.nome,
        whatsapp: input.whatsapp,
        tipo_divulgador: input.tipo_divulgador,
        motivo: input.motivo,
        // @ts-ignore - Columns added in migration
        neighborhood: input.neighborhood,
        // @ts-ignore - Columns added in migration
        social_profile: input.social_profile,
      } as any);
      if (error) throw error;
    },
    onSuccess: (_d, vars) =>
      qc.invalidateQueries({ queryKey: qk.divulgador.status(vars.userId) }),
    onError: (error: unknown) => handleError(error, {
      fallback: "Não conseguimos enviar seu pedido de divulgador agora.",
      context: "useCreateDivulgadorRequest"
    })
  });
}
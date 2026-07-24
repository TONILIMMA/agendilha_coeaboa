import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface PromotorProfile {
  id?: string;
  user_id: string;
  promotor_nome: string;
  promotor_whatsapp: string | null;
  tipo_promotor: "artista" | "produtor" | "estabelecimento" | "outro" | null;
}

/**
 * Perfil de Promotor/Divulgador ligado ao usuário logado.
 * - Cada usuário tem no máximo 1 perfil (user_id UNIQUE).
 * - RLS: dono lê/escreve o próprio; admin/master lê/escreve qualquer um.
 */
export function usePromotorProfile(targetUserId?: string) {
  const { user } = useAuth();
  const userId = targetUserId ?? user?.id ?? null;
  const [profile, setProfile] = useState<PromotorProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const refetch = useCallback(async () => {
    if (!userId) {
      setProfile(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data } = await (supabase as any)
      .from("promotor_profiles")
      .select("id, user_id, promotor_nome, promotor_whatsapp, tipo_promotor")
      .eq("user_id", userId)
      .maybeSingle();
    setProfile((data as PromotorProfile) ?? null);
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { profile, loading, refetch };
}

/** Upsert do perfil de promotor. Chame no submit do evento e na página de edição. */
export async function upsertPromotorProfile(input: {
  user_id: string;
  promotor_nome: string;
  promotor_whatsapp?: string | null;
  tipo_promotor?: string | null;
}) {
  const payload = {
    user_id: input.user_id,
    promotor_nome: input.promotor_nome.trim(),
    promotor_whatsapp: input.promotor_whatsapp?.trim() || null,
    tipo_promotor: input.tipo_promotor || null,
  };
  if (!payload.promotor_nome) return { error: null };
  const { error } = await (supabase as any)
    .from("promotor_profiles")
    .upsert(payload, { onConflict: "user_id" });
  return { error };
}
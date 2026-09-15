import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type AdStatus = "pendente" | "publicado" | "recusado";

export interface Ad {
  id: string;
  user_id: string;
  title: string;
  description: string;
  category: string;
  price_cents: number | null;
  contact_whatsapp: string;
  city: string | null;
  neighborhood: string | null;
  photos: string[];
  status: AdStatus;
  rejection_reason: string | null;
  is_highlight: boolean;
  highlight_plan_id: string | null;
  highlight_until: string | null;
  views_count: number;
  created_at: string;
}

export const AD_CATEGORIES = [
  "Produtos",
  "Serviços",
  "Espaço para eventos",
  "Equipamentos",
  "Alimentos e bebidas",
  "Artesanato",
  "Vagas e freelas",
  "Outros",
] as const;

const AD_COLUMNS =
  "id, user_id, title, description, category, price_cents, contact_whatsapp, city, neighborhood, photos, status, rejection_reason, is_highlight, highlight_plan_id, highlight_until, views_count, created_at";

export const ADS_KEY = ["ads"] as const;

/** Anúncios publicados (vitrine pública). */
export function usePublishedAds() {
  return useQuery({
    queryKey: [...ADS_KEY, "publicados"],
    queryFn: async (): Promise<Ad[]> => {
      const { data, error } = await supabase
        .from("ads")
        .select(AD_COLUMNS)
        .eq("status", "publicado")
        .order("is_highlight", { ascending: false })
        .order("created_at", { ascending: false });
      if (error) throw error;
      return normalize(data);
    },
    staleTime: 60 * 1000,
  });
}

/**
 * Anúncios publicados e SEM destaque (gratuitos), para a seção fixa do rodapé.
 * Observação: a tabela `ads` não tem coluna de data do evento; ordenamos por
 * data de publicação (mais recentes primeiro). Se um dia existir uma coluna de
 * data do evento, é aqui que a ordenação por proximidade deve ser ligada.
 */
export function useFreeAds() {
  return useQuery({
    queryKey: [...ADS_KEY, "gratuitos"],
    queryFn: async (): Promise<Ad[]> => {
      const { data, error } = await supabase
        .from("ads")
        .select(AD_COLUMNS)
        .eq("status", "publicado")
        .eq("is_highlight", false)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return normalize(data);
    },
    staleTime: 60 * 1000,
  });
}

/** Anúncios do usuário logado. */
export function useMyAds(userId: string | undefined) {
  return useQuery({
    queryKey: [...ADS_KEY, "meus", userId],
    enabled: !!userId,
    queryFn: async (): Promise<Ad[]> => {
      const { data, error } = await supabase
        .from("ads")
        .select(AD_COLUMNS)
        .eq("user_id", userId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return normalize(data);
    },
  });
}

/** Todos os anúncios — usado na tela de moderação (RLS libera só para a equipe). */
export function useAllAds(enabled: boolean) {
  return useQuery({
    queryKey: [...ADS_KEY, "todos"],
    enabled,
    queryFn: async (): Promise<Ad[]> => {
      const { data, error } = await supabase
        .from("ads")
        .select(AD_COLUMNS)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return normalize(data);
    },
  });
}

/** Um anúncio pelo id. */
export function useAd(id: string | undefined) {
  return useQuery({
    queryKey: [...ADS_KEY, "detalhe", id],
    enabled: !!id,
    queryFn: async (): Promise<Ad | null> => {
      const { data, error } = await supabase
        .from("ads")
        .select(AD_COLUMNS)
        .eq("id", id!)
        .maybeSingle();
      if (error) throw error;
      return data ? normalize([data])[0] : null;
    },
  });
}

export interface AdInput {
  title: string;
  description: string;
  category: string;
  price_cents: number | null;
  contact_whatsapp: string;
  city: string | null;
  neighborhood: string | null;
  photos: string[];
}

/** Cria um anúncio (entra em análise). */
export function useCreateAd() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ userId, input }: { userId: string; input: AdInput }): Promise<Ad> => {
      const { data, error } = await supabase
        .from("ads")
        .insert({ ...input, user_id: userId })
        .select(AD_COLUMNS)
        .single();
      if (error) throw error;
      return normalize([data])[0];
    },
    onSuccess: () => void qc.invalidateQueries({ queryKey: ADS_KEY }),
  });
}

/** Atualiza um anúncio do próprio autor. */
export function useUpdateAd() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, input }: { id: string; input: Partial<AdInput> }) => {
      const { error } = await supabase.from("ads").update(input).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => void qc.invalidateQueries({ queryKey: ADS_KEY }),
  });
}

/** Moderação: aprovar, recusar e ligar/desligar destaque (somente equipe, via RLS). */
export function useModerateAd() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      patch,
    }: {
      id: string;
      patch: {
        status?: AdStatus;
        rejection_reason?: string | null;
        is_highlight?: boolean;
        highlight_plan_id?: string | null;
        highlight_until?: string | null;
        published_at?: string | null;
      };
    }) => {
      const { error } = await supabase.from("ads").update(patch).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => void qc.invalidateQueries({ queryKey: ADS_KEY }),
  });
}

/** Remove um anúncio. */
export function useDeleteAd() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("ads").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => void qc.invalidateQueries({ queryKey: ADS_KEY }),
  });
}

function normalize(rows: unknown): Ad[] {
  return ((rows ?? []) as Ad[]).map((r) => ({ ...r, photos: r.photos ?? [] }));
}

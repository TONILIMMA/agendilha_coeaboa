import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface HighlightPackage {
  id: string;
  name: string;
  description: string | null;
  price_cents: number;
  duration_days: number;
  is_active: boolean;
  display_order: number;
}

export const HIGHLIGHT_PACKAGES_KEY = ["highlight_packages"] as const;

/** Pacotes de destaque ativos, na ordem definida pelos administradores. */
export function useHighlightPackages(includeInactive = false) {
  return useQuery({
    queryKey: [...HIGHLIGHT_PACKAGES_KEY, includeInactive],
    queryFn: async (): Promise<HighlightPackage[]> => {
      let query = supabase
        .from("highlight_packages")
        .select("id, name, description, price_cents, duration_days, is_active, display_order")
        .order("display_order", { ascending: true })
        .order("price_cents", { ascending: true });

      if (!includeInactive) query = query.eq("is_active", true);

      const { data, error } = await query;
      if (error) throw error;
      return (data ?? []) as HighlightPackage[];
    },
    staleTime: 5 * 60 * 1000,
  });
}

/** Formata centavos como moeda brasileira. */
export function formatPriceBRL(cents: number): string {
  return (cents / 100).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
  });
}

/** "7 dias" / "1 dia" */
export function formatDuration(days: number): string {
  return days === 1 ? "1 dia" : `${days} dias`;
}

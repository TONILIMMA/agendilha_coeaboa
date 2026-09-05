import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface AdPlan {
  id: string;
  name: string;
  description: string | null;
  benefits: string[];
  price_cents: number;
  duration_days: number;
  is_active: boolean;
  display_order: number;
}

const AD_PLAN_COLUMNS =
  "id, name, description, benefits, price_cents, duration_days, is_active, display_order";

export const AD_PLANS_KEY = ["ad_plans"] as const;

/** Planos de anúncio na ordem definida pela equipe. */
export function useAdPlans(includeInactive = false) {
  return useQuery({
    queryKey: [...AD_PLANS_KEY, includeInactive],
    queryFn: async (): Promise<AdPlan[]> => {
      let query = supabase
        .from("ad_plans")
        .select(AD_PLAN_COLUMNS)
        .order("display_order", { ascending: true })
        .order("price_cents", { ascending: true });

      if (!includeInactive) query = query.eq("is_active", true);

      const { data, error } = await query;
      if (error) throw error;
      return (data ?? []).map((p) => ({ ...p, benefits: p.benefits ?? [] })) as AdPlan[];
    },
    staleTime: 5 * 60 * 1000,
  });
}

/** Centavos em moeda brasileira. */
export function formatPriceBRL(cents: number): string {
  return (cents / 100).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
  });
}

/** "7 dias" / "1 dia" */
export function formatDurationDays(days: number): string {
  return days === 1 ? "1 dia" : `${days} dias`;
}

/** "30,00" — para inputs de valor. */
export function centsToInput(cents: number): string {
  return (cents / 100).toFixed(2).replace(".", ",");
}

/** Lê "R$ 1.234,50" e devolve centavos; null quando inválido. */
export function inputToCents(valor: string): number | null {
  const limpo = valor.replace(/[^\d,.-]/g, "").replace(/\./g, "").replace(",", ".");
  if (!limpo) return null;
  const n = Number(limpo);
  if (!Number.isFinite(n) || n < 0) return null;
  return Math.round(n * 100);
}

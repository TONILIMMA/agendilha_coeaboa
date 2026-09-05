export type HighlightStatus = "ativo" | "expirado" | "escondido" | "sem_destaque";

export interface HighlightFields {
  is_highlight?: boolean | null;
  highlight_hidden?: boolean | null;
  highlight_until?: string | null;
  highlight_active?: boolean | null;
}

/** Status do destaque de um rolê, derivado dos campos de destaque. */
export function highlightStatus(
  event: HighlightFields,
  now: Date = new Date(),
): HighlightStatus {
  if (!event.is_highlight) return "sem_destaque";
  if (event.highlight_hidden) return "escondido";
  if (event.highlight_until && new Date(event.highlight_until).getTime() <= now.getTime()) {
    return "expirado";
  }
  return "ativo";
}

/** true quando o destaque está valendo agora (respeita prazo e destaque escondido). */
export function isHighlightActive(event: HighlightFields, now: Date = new Date()): boolean {
  if (typeof event.highlight_active === "boolean") {
    // A view já calcula, mas revalidamos o prazo no cliente para não depender do cache.
    return event.highlight_active && highlightStatus(event, now) === "ativo";
  }
  return highlightStatus(event, now) === "ativo";
}

/** Dias restantes do destaque (0 quando expirado, null quando sem prazo). */
export function highlightDaysLeft(
  event: HighlightFields,
  now: Date = new Date(),
): number | null {
  if (!event.highlight_until) return null;
  const diff = new Date(event.highlight_until).getTime() - now.getTime();
  if (diff <= 0) return 0;
  return Math.ceil(diff / 86_400_000);
}

/**
 * Ordena colocando os destaques ativos na frente e o restante por data,
 * cortando na quantidade máxima (padrão: 10 do carrossel).
 */
export function pickCarouselEvents<T extends HighlightFields & { date?: string | null }>(
  events: T[],
  limit = 10,
  now: Date = new Date(),
): T[] {
  return [...events]
    .sort((a, b) => {
      const ha = isHighlightActive(a, now) ? 1 : 0;
      const hb = isHighlightActive(b, now) ? 1 : 0;
      if (ha !== hb) return hb - ha;
      return (a.date ?? "").localeCompare(b.date ?? "");
    })
    .slice(0, limit);
}

export const HIGHLIGHT_STATUS_LABEL: Record<HighlightStatus, string> = {
  ativo: "Ativo",
  expirado: "Expirado",
  escondido: "Escondido",
  sem_destaque: "Sem destaque",
};

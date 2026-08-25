/**
 * Utilitários defensivos para dados vindos de rede (edge functions, banco, JSON).
 *
 * Motivo: qualquer resposta que não seja um array (objeto de erro, `null`,
 * `{ raw: "ok" }`, `{ users: [...] }`) quebra chamadas como `.filter()`,
 * gerando erros do tipo "a.filter is not a function" em produção (minificado).
 */

/** Garante que o valor seja sempre um array seguro para `.filter/.map/.length`. */
export function asArray<T>(value: unknown): T[] {
  if (Array.isArray(value)) return value as T[];
  if (value && typeof value === "object") {
    // Aceita envelopes comuns: { data: [...] }, { items: [...] }, { users: [...] }, { rows: [...] }
    for (const key of ["data", "items", "users", "rows", "results"]) {
      const inner = (value as Record<string, unknown>)[key];
      if (Array.isArray(inner)) return inner as T[];
    }
  }
  return [];
}

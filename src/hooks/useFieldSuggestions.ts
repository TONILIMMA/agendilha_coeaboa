import { useCallback, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAutocompleteSearch } from "@/hooks/useAutocompleteSearch";

export interface FieldSuggestionSource {
  /** Tabela ou view pública já protegida por RLS. */
  from: string;
  /** Coluna com o texto sugerido. */
  column: string;
}

interface Options extends FieldSuggestionSource {
  term: string;
  enabled?: boolean;
  limit?: number;
  /** Muda para invalidar o cache (ex.: registro editado/aprovado/excluído). */
  refreshKey?: unknown;
}

/**
 * Sugestões de valores já cadastrados no banco para um campo de texto.
 * Silencioso por natureza: se a RLS bloquear a leitura, devolve lista vazia
 * e o campo continua funcionando como input normal.
 */
export function useFieldSuggestions({
  from,
  column,
  term,
  enabled = true,
  limit = 8,
  refreshKey,
}: Options) {
  const fetchPage = useCallback(
    async (q: string, start: number, end: number, signal: AbortSignal) => {
      let query = supabase
        .from(from as never)
        .select(column)
        .not(column, "is", null)
        .order(column, { ascending: true })
        .range(start, end)
        .abortSignal(signal);
      if (q) query = query.ilike(column, `%${q}%`);
      const { data, error } = await query;
      if (error) return [];
      return (data ?? []) as Record<string, unknown>[];
    },
    [from, column],
  );

  const { items, loading } = useAutocompleteSearch<Record<string, unknown>>({
    term,
    fetchPage,
    pageSize: limit * 3,
    debounceMs: 200,
    minChars: 0,
    enabled,
    refreshKey,
  });

  const suggestions = useMemo(() => {
    const seen = new Set<string>();
    const out: string[] = [];
    for (const row of items) {
      const raw = row?.[column];
      if (typeof raw !== "string") continue;
      const value = raw.trim();
      if (!value) continue;
      const key = value.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      out.push(value);
      if (out.length >= limit) break;
    }
    return out;
  }, [items, column, limit]);

  return { suggestions, loading };
}
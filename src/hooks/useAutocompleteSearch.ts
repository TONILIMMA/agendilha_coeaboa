import { useCallback, useEffect, useMemo, useRef, useState } from "react";

export interface AutocompletePage<T> {
  rows: T[];
  hasMore: boolean;
}

export interface UseAutocompleteSearchOptions<T> {
  /** Termo digitado. */
  term: string;
  /** Busca uma página. `from`/`to` são índices inclusivos (range do Supabase). */
  fetchPage: (query: string, from: number, to: number, signal: AbortSignal) => Promise<T[]>;
  /** Itens por página. */
  pageSize?: number;
  /** Debounce em ms para termo digitado (0 quando o campo está vazio). */
  debounceMs?: number;
  /** Mínimo de caracteres para disparar a busca por termo (abaixo disso lista o topo). */
  minChars?: number;
  /** Invalida o cache quando muda (ex.: novo registro criado). */
  refreshKey?: unknown;
  /** Desliga a busca (ex.: dropdown fechado). */
  enabled?: boolean;
}

/**
 * Autocomplete rápido: debounce, cache em memória por termo, cancelamento das
 * requisições antigas (evita resposta fora de ordem) e paginação incremental
 * para listas grandes.
 */
export function useAutocompleteSearch<T>({
  term,
  fetchPage,
  pageSize = 12,
  debounceMs = 180,
  minChars = 1,
  refreshKey,
  enabled = true,
}: UseAutocompleteSearchOptions<T>) {
  const [items, setItems] = useState<T[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);

  const cache = useRef(new Map<string, AutocompletePage<T>>());
  const abortRef = useRef<AbortController | null>(null);
  const seqRef = useRef(0);
  const pageRef = useRef(0);

  const normalized = useMemo(() => (term ?? "").trim().toLowerCase(), [term]);
  const effectiveTerm = normalized.length >= minChars ? normalized : "";

  // Invalida o cache quando a fonte de dados muda.
  useEffect(() => {
    cache.current.clear();
  }, [refreshKey]);

  const fetchRef = useRef(fetchPage);
  fetchRef.current = fetchPage;

  useEffect(() => {
    if (!enabled) return;

    const cached = cache.current.get(effectiveTerm);
    if (cached) {
      setItems(cached.rows);
      setHasMore(cached.hasMore);
      pageRef.current = Math.max(0, Math.ceil(cached.rows.length / pageSize) - 1);
      setLoading(false);
      return;
    }

    const delay = normalized.length ? debounceMs : 0;
    const seq = ++seqRef.current;
    setLoading(true);

    const timer = window.setTimeout(async () => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;
      try {
        const rows = await fetchRef.current(effectiveTerm, 0, pageSize, controller.signal);
        if (seq !== seqRef.current) return; // resposta obsoleta
        const more = rows.length > pageSize;
        const page = { rows: more ? rows.slice(0, pageSize) : rows, hasMore: more };
        cache.current.set(effectiveTerm, page);
        pageRef.current = 0;
        setItems(page.rows);
        setHasMore(page.hasMore);
      } catch {
        if (seq === seqRef.current) {
          setItems([]);
          setHasMore(false);
        }
      } finally {
        if (seq === seqRef.current) setLoading(false);
      }
    }, delay);

    return () => window.clearTimeout(timer);
  }, [effectiveTerm, normalized, enabled, pageSize, debounceMs, refreshKey]);

  const loadMore = useCallback(async () => {
    if (!hasMore || loadingMore) return;
    setLoadingMore(true);
    const seq = seqRef.current;
    const nextPage = pageRef.current + 1;
    try {
      const controller = new AbortController();
      const rows = await fetchRef.current(
        effectiveTerm,
        nextPage * pageSize,
        nextPage * pageSize + pageSize,
        controller.signal,
      );
      if (seq !== seqRef.current) return;
      const more = rows.length > pageSize;
      const merged = [...items, ...(more ? rows.slice(0, pageSize) : rows)];
      pageRef.current = nextPage;
      cache.current.set(effectiveTerm, { rows: merged, hasMore: more });
      setItems(merged);
      setHasMore(more);
    } catch {
      /* mantém o que já está na tela */
    } finally {
      setLoadingMore(false);
    }
  }, [effectiveTerm, hasMore, items, loadingMore, pageSize]);

  return { items, loading, loadingMore, hasMore, loadMore };
}

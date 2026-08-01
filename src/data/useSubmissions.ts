import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { qk } from "./queryKeys";

export interface SubmissionsFilters {
  /** select() projection — default "*". */
  select?: string;
  /** Equality filters: `{ status: "aprovado" }`. */
  eq?: Record<string, string | number | boolean | null>;
  /** "not equal" filters. */
  neq?: Record<string, string | number | boolean | null>;
  /** `in` filters: `{ status: ["pendente", "aprovado"] }`. */
  in?: Record<string, Array<string | number>>;
  /** Order column (default created_at desc). */
  orderBy?: { column: string; ascending?: boolean };
  /** Limit rows. */
  limit?: number;
}

/** Encadeia filtros num query builder do PostgREST sem depender dos genéricos internos. */
type FilterableQuery = {
  eq: (column: string, value: unknown) => FilterableQuery;
  neq: (column: string, value: unknown) => FilterableQuery;
  in: (column: string, values: readonly unknown[]) => FilterableQuery;
  order: (column: string, opts: { ascending: boolean }) => FilterableQuery;
  limit: (count: number) => FilterableQuery;
};

function applyFilters<Q>(builder: Q, f: SubmissionsFilters): Q {
  let query = builder as unknown as FilterableQuery;
  if (f.eq) for (const [k, v] of Object.entries(f.eq)) query = query.eq(k, v);
  if (f.neq) for (const [k, v] of Object.entries(f.neq)) query = query.neq(k, v);
  if (f.in) for (const [k, v] of Object.entries(f.in)) query = query.in(k, v);
  const order = f.orderBy ?? { column: "created_at", ascending: false };
  query = query.order(order.column, { ascending: !!order.ascending });
  if (f.limit) query = query.limit(f.limit);
  return query as unknown as Q;
}

/** Lista submissions com filtros declarativos e cache compartilhado. */
export function useSubmissions<T = unknown>(
  filters: SubmissionsFilters = {},
  options: { enabled?: boolean; staleTime?: number } = {}
) {
  return useQuery({
    queryKey: qk.submissions.list(filters as Record<string, unknown>),
    enabled: options.enabled ?? true,
    staleTime: options.staleTime ?? 30_000,
    queryFn: async (): Promise<T[]> => {
      let q = supabase.from("submissions").select(filters.select ?? "*");
      q = applyFilters(q, filters);
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as T[];
    },
  });
}

/** Contagem de submissions com mesmos filtros (HEAD + count exact). */
export function useSubmissionsCount(
  filters: SubmissionsFilters = {},
  options: { enabled?: boolean; staleTime?: number } = {}
) {
  return useQuery({
    queryKey: qk.submissions.count(filters as Record<string, unknown>),
    enabled: options.enabled ?? true,
    staleTime: options.staleTime ?? 30_000,
    queryFn: async (): Promise<number> => {
      let q = supabase
        .from("submissions")
        .select(filters.select ?? "*", { count: "exact", head: true });
      q = applyFilters(q, filters);
      const { count, error } = await q;
      if (error) throw error;
      return count ?? 0;
    },
  });
}

/** Busca uma submission por id. */
export function useSubmission<T = unknown>(
  id: string | null | undefined,
  select = "*"
) {
  return useQuery({
    queryKey: id ? qk.submissions.byId(id) : ["submissions", "byId", "disabled"],
    enabled: !!id,
    staleTime: 30_000,
    queryFn: async (): Promise<T | null> => {
      const { data, error } = await supabase
        .from("submissions")
        .select(select)
        .eq("id", id as string)
        .maybeSingle();
      if (error) throw error;
      return (data ?? null) as T | null;
    },
  });
}

/** Invalida toda a árvore de cache de submissions. */
export function useInvalidateSubmissions() {
  const qc = useQueryClient();
  return () => qc.invalidateQueries({ queryKey: qk.submissions.all });
}

/** Patch genérico em uma submission por id. */
export function useUpdateSubmission() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      patch,
    }: {
      id: string;
      patch: Record<string, unknown>;
    }) => {
      const { error } = await supabase
        .from("submissions")
        .update(patch as never)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.submissions.all });
    },
  });
}

/** Delete físico de uma submission. */
export function useDeleteSubmission() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("submissions")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.submissions.all });
    },
  });
}
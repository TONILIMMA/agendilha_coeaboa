import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { highlightStatus, type HighlightStatus } from "@/lib/highlights";

export interface HighlightedEvent {
  id: string;
  event_title: string | null;
  date: string | null;
  address_neighborhood: string | null;
  image_url: string | null;
  is_highlight: boolean | null;
  highlight_hidden: boolean;
  highlight_starts_at: string | null;
  highlight_until: string | null;
  highlight_package_id: string | null;
  package_name: string | null;
  package_duration_days: number | null;
  status: HighlightStatus;
}

export const HIGHLIGHTS_KEY = ["admin", "highlights"] as const;

/** Rolês com destaque (ativo, expirado ou escondido) para a gestão administrativa. */
export function useHighlightedEvents() {
  return useQuery({
    queryKey: HIGHLIGHTS_KEY,
    queryFn: async (): Promise<HighlightedEvent[]> => {
      const { data, error } = await supabase
        .from("submissions")
        .select(
          "id, event_title, date, address_neighborhood, image_url, is_highlight, highlight_hidden, highlight_starts_at, highlight_until, highlight_package_id, highlight_packages(name, duration_days)",
        )
        .eq("is_highlight", true)
        .is("deleted_at", null)
        .order("highlight_until", { ascending: true, nullsFirst: false });

      if (error) throw error;

      return (data ?? []).map((row) => {
        const pkg = (row as { highlight_packages?: { name: string; duration_days: number } | null })
          .highlight_packages;
        return {
          id: row.id,
          event_title: row.event_title,
          date: row.date,
          address_neighborhood: row.address_neighborhood,
          image_url: row.image_url,
          is_highlight: row.is_highlight,
          highlight_hidden: row.highlight_hidden ?? false,
          highlight_starts_at: row.highlight_starts_at,
          highlight_until: row.highlight_until,
          highlight_package_id: row.highlight_package_id,
          package_name: pkg?.name ?? null,
          package_duration_days: pkg?.duration_days ?? null,
          status: highlightStatus(row),
        };
      });
    },
    staleTime: 30_000,
  });
}

function addDays(days: number, from = new Date()): string {
  const d = new Date(from);
  d.setDate(d.getDate() + days);
  return d.toISOString();
}

interface AtivarInput {
  eventId: string;
  packageId: string;
  durationDays: number;
}

/** Ativar, estender, esconder ou encerrar o destaque de um rolê. */
export function useHighlightActions() {
  const qc = useQueryClient();

  const invalidate = () => {
    void qc.invalidateQueries({ queryKey: HIGHLIGHTS_KEY });
    void qc.invalidateQueries({ queryKey: ["agenda"] });
    void qc.invalidateQueries({ queryKey: ["events"] });
  };

  const ativar = useMutation({
    mutationFn: async ({ eventId, packageId, durationDays }: AtivarInput) => {
      const { error } = await supabase
        .from("submissions")
        .update({
          is_highlight: true,
          highlight_hidden: false,
          highlight_package_id: packageId,
          highlight_starts_at: new Date().toISOString(),
          highlight_until: addDays(durationDays),
        })
        .eq("id", eventId);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  const estender = useMutation({
    mutationFn: async ({ eventId, days, currentUntil }: { eventId: string; days: number; currentUntil: string | null }) => {
      const base =
        currentUntil && new Date(currentUntil).getTime() > Date.now()
          ? new Date(currentUntil)
          : new Date();
      const { error } = await supabase
        .from("submissions")
        .update({ is_highlight: true, highlight_until: addDays(days, base) })
        .eq("id", eventId);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  const esconder = useMutation({
    mutationFn: async ({ eventId, hidden }: { eventId: string; hidden: boolean }) => {
      const { error } = await supabase
        .from("submissions")
        .update({ highlight_hidden: hidden })
        .eq("id", eventId);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  const encerrar = useMutation({
    mutationFn: async (eventId: string) => {
      const { error } = await supabase
        .from("submissions")
        .update({
          is_highlight: false,
          highlight_hidden: false,
          highlight_package_id: null,
          highlight_until: null,
          highlight_starts_at: null,
        })
        .eq("id", eventId);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  return { ativar, estender, esconder, encerrar };
}

/** Rolês aprovados sem destaque, para a equipe escolher quem destacar. */
export function useHighlightCandidates(search: string) {
  return useQuery({
    queryKey: ["admin", "highlight-candidates", search],
    queryFn: async () => {
      let query = supabase
        .from("submissions")
        .select("id, event_title, date, address_neighborhood")
        .in("status", ["aprovado", "publicado", "divulgado"])
        .is("deleted_at", null)
        .or("is_highlight.is.null,is_highlight.eq.false")
        .order("date", { ascending: true })
        .limit(20);
      if (search.trim().length >= 2) {
        query = query.ilike("event_title", `%${search.trim()}%`);
      }
      const { data, error } = await query;
      if (error) throw error;
      return data ?? [];
    },
    staleTime: 30_000,
  });
}

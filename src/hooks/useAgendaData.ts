import { useEffect, useState, useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { handleError } from "@/lib/error-handler";
import type { AgendaEvent } from "@/components/agenda/types";
import { qk } from "@/data/queryKeys";

export type Rating = { average: number; total: number };

/**
 * Loads approved events + ratings via React Query, listens to realtime
 * changes, and returns helpers to track views and shares.
 */
export function useAgendaData() {
  const qc = useQueryClient();
  const [initialEventId, setInitialEventId] = useState<string | null>(null);

  const eventsQuery = useQuery({
    queryKey: qk.agenda.events(),
    queryFn: async (): Promise<AgendaEvent[]> => {
      const { data, error } = await supabase
        .from("public_submissions")
        .select("*")
        .eq("status", "aprovado")
        .neq("moderation_status", "blocked");
      if (error) throw error;
      return (data as unknown as AgendaEvent[]) ?? [];
    },
    staleTime: 60_000,
    meta: {
      onError: (error: unknown) =>
        handleError(error, "Não rolou carregar a agenda agora. Tenta de novo em instantes."),
    },
  });

  const ratingsQuery = useQuery({
    queryKey: qk.agenda.ratings(),
    queryFn: async (): Promise<Record<string, Rating>> => {
      const { data } = await supabase.from("event_ratings_summary").select("*");
      const map: Record<string, Rating> = {};
      (data ?? []).forEach((r: { event_id: string; average_rating: number; total_reviews: number }) => {
        map[r.event_id] = { average: r.average_rating, total: r.total_reviews };
      });
      return map;
    },
    staleTime: 60_000,
  });

  const events = eventsQuery.data ?? [];

  // Pick up ?event= from URL once events land.
  useEffect(() => {
    if (!events.length) return;
    const params = new URLSearchParams(window.location.search);
    const eventId = params.get("event");
    if (eventId && events.find((e) => e.id === eventId)) {
      setInitialEventId(eventId);
    }
  }, [events]);

  // Realtime → invalidate caches.
  useEffect(() => {
    const submissionsChannel = supabase
      .channel("submissions-all-updates")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "submissions" },
        () => qc.invalidateQueries({ queryKey: qk.agenda.events() }),
      )
      .subscribe();

    const ratingsChannel = supabase
      .channel("ratings-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "event_reviews" },
        () => qc.invalidateQueries({ queryKey: qk.agenda.ratings() }),
      )
      .subscribe();

    return () => {
      supabase.removeChannel(submissionsChannel);
      supabase.removeChannel(ratingsChannel);
    };
  }, [qc]);

  const trackView = useCallback(async (id: string) => {
    try {
      await supabase.rpc("increment_views", { event_id: id });
    } catch {
      /* silent for analytics */
    }
  }, []);

  const trackShare = useCallback(async (id: string) => {
    try {
      await supabase.rpc("increment_shares", { event_id: id });
    } catch {
      // best-effort telemetry; ignore failures
    }
  }, []);

  const clearInitialEventId = useCallback(() => setInitialEventId(null), []);

  return {
    events,
    ratings: ratingsQuery.data ?? {},
    loading: eventsQuery.isLoading,
    trackView,
    trackShare,
    initialEventId,
    clearInitialEventId,
  };
}
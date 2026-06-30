import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { handleError } from "@/lib/error-handler";
import type { AgendaEvent } from "@/components/agenda/types";

export type Rating = { average: number; total: number };

/**
 * Loads approved events + ratings, listens to realtime changes,
 * and returns helpers to track views and shares.
 */
export function useAgendaData() {
  const [events, setEvents] = useState<AgendaEvent[]>([]);
  const [ratings, setRatings] = useState<Record<string, Rating>>({});
  const [loading, setLoading] = useState(true);
  const [initialEventId, setInitialEventId] = useState<string | null>(null);

  const loadRatings = useCallback(async () => {
    const { data } = await supabase.from("event_ratings_summary").select("*");
    if (data) {
      const map: Record<string, Rating> = {};
      data.forEach((r: any) => {
        map[r.event_id] = { average: r.average_rating, total: r.total_reviews };
      });
      setRatings(map);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from("public_submissions")
          .select("*")
          .eq("status", "aprovado")
          .neq("moderation_status", "blocked");
        if (error) throw error;
        if (cancelled) return;

        const approved = (data as any[]) || [];
        setEvents(approved);
        loadRatings();

        const params = new URLSearchParams(window.location.search);
        const eventId = params.get("event");
        if (eventId && approved.find((e) => e.id === eventId)) {
          setInitialEventId(eventId);
        }
      } catch (error) {
        handleError(error, "Não rolou carregar a agenda agora. Tenta de novo em instantes.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();

    const submissionsChannel = supabase
      .channel("submissions-all-updates")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "submissions" },
        () => load(),
      )
      .subscribe();

    const ratingsChannel = supabase
      .channel("ratings-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "event_reviews" },
        () => loadRatings(),
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(submissionsChannel);
      supabase.removeChannel(ratingsChannel);
    };
  }, [loadRatings]);

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
    } catch (e) {
      console.error("Error tracking share:", e);
    }
  }, []);

  const clearInitialEventId = useCallback(() => setInitialEventId(null), []);

  return { events, ratings, loading, trackView, trackShare, initialEventId, clearInitialEventId };
}
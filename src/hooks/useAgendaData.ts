import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { qk } from "@/data/queryKeys";
import { useEvents } from "@/data/events";

/**
 * Compatibility layer for the legacy useAgendaData hook.
 * Proxies to the new unified useEvents hook.
 */
export function useAgendaData() {
  const qc = useQueryClient();
  const [initialEventId, setInitialEventId] = useState<string | null>(null);
  
  const { events, ratings, isLoading, trackView, trackShare } = useEvents();

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

  return {
    events,
    ratings,
    loading: isLoading,
    trackView,
    trackShare,
    initialEventId,
    clearInitialEventId: () => setInitialEventId(null),
  };
}

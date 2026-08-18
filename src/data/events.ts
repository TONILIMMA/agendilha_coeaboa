import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { handleError } from "@/lib/error-handler";
import type { AgendaEvent } from "@/components/agenda/types";
import { qk } from "./queryKeys";
import { useCallback } from "react";

export type Rating = { average: number; total: number };

/**
 * Unified hook for agenda events and related actions.
 * Replacing logic from useAgendaData.ts
 */
export function useEvents(options: { 
  enabled?: boolean; 
  staleTime?: number;
} = {}) {
  const qc = useQueryClient();

  const eventsQuery = useQuery({
    queryKey: qk.agenda.events(),
    queryFn: async (): Promise<AgendaEvent[]> => {
      const { data, error } = await supabase
        .from("public_submissions")
        .select(`
          id, 
          event_title, 
          date, 
          start_time, 
          location, 
          address_neighborhood, 
          category, 
          image_url, 
          age_rating, 
          is_suitable_for_minors, 
          description, 
          views_count,
          status,
          moderation_status,
          slug
        `)
        .eq("status", "aprovado")
        .neq("moderation_status", "blocked");
      
      if (error) throw error;
      return (data as unknown as AgendaEvent[]) ?? [];
    },
    enabled: options.enabled,
    staleTime: options.staleTime ?? 60_000,
    meta: {
      onError: (error: unknown) =>
        handleError(error, "Não rolou carregar a agenda agora."),
    },
  });

  const ratingsQuery = useQuery({
    queryKey: qk.agenda.ratings(),
    queryFn: async (): Promise<Record<string, Rating>> => {
      const { data, error } = await supabase.from("event_ratings_summary").select("*");
      if (error) throw error;
      
      const map: Record<string, Rating> = {};
      (data ?? []).forEach((r: any) => {
        map[r.event_id] = { average: r.average_rating, total: r.total_reviews };
      });
      return map;
    },
    staleTime: options.staleTime ?? 60_000,
  });

  const trackView = useCallback(async (id: string) => {
    try {
      await supabase.rpc("increment_views", { event_id: id });
    } catch { /* silent */ }
  }, []);

  const trackShare = useCallback(async (id: string) => {
    try {
      await supabase.rpc("increment_shares", { event_id: id });
    } catch { /* silent */ }
  }, []);

  return {
    events: eventsQuery.data ?? [],
    ratings: ratingsQuery.data ?? {},
    isLoading: eventsQuery.isLoading || ratingsQuery.isLoading,
    isError: eventsQuery.isError || ratingsQuery.isError,
    trackView,
    trackShare,
    refetch: eventsQuery.refetch
  };
}

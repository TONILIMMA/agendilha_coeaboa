import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { qk } from "./queryKeys";

export interface EventReview {
  id: string;
  rating: number;
  comment: string;
  user_name: string;
  created_at: string;
}

export function useEventReviews(eventId: string | null | undefined) {
  return useQuery({
    queryKey: qk.reviews.byEvent(eventId),
    enabled: !!eventId,
    staleTime: 30_000,
    queryFn: async (): Promise<EventReview[]> => {
      const { data, error } = await supabase
        .from("event_reviews")
        .select("id, rating, comment, user_name, created_at")
        .eq("event_id", eventId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as EventReview[];
    },
  });
}

export function useCreateEventReview(eventId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { rating: number; comment: string; user_name: string }) => {
      const { error } = await supabase.from("event_reviews").insert({
        event_id: eventId,
        rating: input.rating,
        comment: input.comment,
        user_name: input.user_name,
      });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.reviews.byEvent(eventId) }),
  });
}
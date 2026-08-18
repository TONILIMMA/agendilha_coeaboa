import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { handleError } from "@/lib/error-handler";
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
    meta: {
      onError: (error: unknown) => handleError(error, { silent: true, context: "useEventReviews" })
    }
  });
}

export function useCreateEventReview(eventId: string) {
  const qc = useQueryClient();
  return useMutation({
    // user_id e user_name são preenchidos no banco a partir da conta logada —
    // ninguém assina avaliação com o nome de outra pessoa.
    mutationFn: async (input: { rating: number; comment: string }) => {
      const { data: authData } = await supabase.auth.getUser();
      const uid = authData.user?.id;
      if (!uid) throw new Error("Entra na tua conta pra avaliar o rolê.");

      const { error } = await supabase.from("event_reviews").insert({
        event_id: eventId,
        user_id: uid,
        rating: input.rating,
        comment: input.comment,
      });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.reviews.byEvent(eventId) }),
  });
}
 import { useEffect } from "react";
 import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
 import { supabase } from "@/integrations/supabase/client";
 import { useAuth } from "@/contexts/AuthContext";
 import { toast } from "sonner";

 export function useFavorites() {
   const { user } = useAuth();
   const queryClient = useQueryClient();

   const { data: favorites = [], isLoading } = useQuery({
     queryKey: ["favorites", user?.id],
     queryFn: async () => {
       if (!user) return [];
       const { data, error } = await supabase
         .from("user_favorites")
         .select("event_id")
         .eq("user_id", user.id);

       if (error) throw error;
       return data.map((fav) => fav.event_id);
     },
     enabled: !!user,
   });

   const toggleFavoriteMutation = useMutation({
     mutationFn: async (eventId: string) => {
       if (!user) {
         toast.error("Você precisa estar logado para favoritar eventos.");
         return;
       }

       const isFavorite = favorites.includes(eventId);

       if (isFavorite) {
         const { error } = await supabase
           .from("user_favorites")
           .delete()
           .eq("user_id", user.id)
           .eq("event_id", eventId);
         if (error) throw error;
         return { eventId, action: "removed" };
       } else {
         const { error } = await supabase
           .from("user_favorites")
           .insert({ user_id: user.id, event_id: eventId });
         if (error) throw error;
         return { eventId, action: "added" };
       }
     },
     onMutate: async (eventId) => {
       await queryClient.cancelQueries({ queryKey: ["favorites", user?.id] });
       const previousFavorites = queryClient.getQueryData<string[]>(["favorites", user?.id]);

       queryClient.setQueryData<string[]>(["favorites", user?.id], (old = []) => {
         if (old.includes(eventId)) {
           return old.filter((id) => id !== eventId);
         }
         return [...old, eventId];
       });

       return { previousFavorites };
     },
     onError: (err, eventId, context) => {
       if (context?.previousFavorites) {
         queryClient.setQueryData(["favorites", user?.id], context.previousFavorites);
       }
       console.error("Error toggling favorite:", err);
       toast.error("Erro ao atualizar favorito.");
     },
     onSettled: () => {
       queryClient.invalidateQueries({ queryKey: ["favorites", user?.id] });
     },
   });

   useEffect(() => {
     if (!user) return;

     const channel = supabase
      .channel(`user_favorites_${user.id}_${Math.random().toString(36).slice(2)}`)
      .on(
         "postgres_changes",
         {
           event: "*",
           schema: "public",
           table: "user_favorites",
           filter: `user_id=eq.${user.id}`,
         },
         () => {
           queryClient.invalidateQueries({ queryKey: ["favorites", user.id] });
         }
       )
       .subscribe();

     return () => {
       supabase.removeChannel(channel);
     };
   }, [user, queryClient]);

   const isFavorite = (eventId: string) => favorites.includes(eventId);

   return {
     favorites,
     isLoading,
     isFavorite,
     toggleFavorite: (eventId: string) => toggleFavoriteMutation.mutate(eventId),
   };
 }
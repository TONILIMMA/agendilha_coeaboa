import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type {
  AgendaArtist,
  AgendaShortVideo,
} from "@/components/agenda/AgendaArtistsTab";

/** Artistas aprovados (view pública) + vídeos curtos embaralhados para descoberta. */
export function useAgendaArtists() {
  const { data, isLoading } = useQuery({
    queryKey: ["artists-approved"],
    staleTime: 60_000,
    queryFn: async (): Promise<AgendaArtist[]> => {
      const { data, error } = await supabase
        .from("public_artist_profiles")
        .select("*, artist_media (*)")
        .eq("is_approved", true)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as AgendaArtist[];
    },
  });

  const artists = data ?? [];

  const shortVideos = useMemo<AgendaShortVideo[]>(() => {
    const videos: AgendaShortVideo[] = [];
    artists.forEach((artist) => {
      artist.artist_media?.forEach((media) => {
        if (media.media_type === "video") videos.push({ ...media, artist });
      });
    });
    return videos.sort(() => Math.random() - 0.5);
  }, [artists]);

  return { artists, shortVideos, loading: isLoading };
}

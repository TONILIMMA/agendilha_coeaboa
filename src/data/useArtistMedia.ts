import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { qk } from "./queryKeys";

export interface ArtistMediaRow {
  id: string;
  url: string;
  media_type: string | null;
  display_order: number;
  thumbnail_url: string | null;
}

export function useArtistMedia(artistId: string | null | undefined) {
  return useQuery({
    queryKey: qk.artistMedia.byArtist(artistId),
    enabled: !!artistId,
    queryFn: async (): Promise<ArtistMediaRow[]> => {
      const { data, error } = await supabase
        .from("artist_media")
        .select("id, url, media_type, display_order, thumbnail_url")
        .eq("artist_id", artistId!)
        .order("display_order", { ascending: true })
        .order("created_at", { ascending: true });
      if (error) throw error;
      return (data ?? []) as ArtistMediaRow[];
    },
  });
}

function useArtistMediaInvalidate(artistId: string | null | undefined) {
  const qc = useQueryClient();
  return () => {
    qc.invalidateQueries({ queryKey: qk.artistMedia.byArtist(artistId) });
    qc.invalidateQueries({ queryKey: ["artist", artistId] });
  };
}

export function useDeleteArtistMedia(artistId: string | null | undefined) {
  const invalidate = useArtistMediaInvalidate(artistId);
  return useMutation({
    mutationFn: async (media: ArtistMediaRow) => {
      const match = media.url.match(/artist-media\/(.+)$/);
      if (match?.[1]) {
        await supabase.storage.from("artist-media").remove([match[1]]);
      }
      const { error } = await supabase.from("artist_media").delete().eq("id", media.id);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });
}

export function useReorderArtistMedia(artistId: string | null | undefined) {
  const invalidate = useArtistMediaInvalidate(artistId);
  return useMutation({
    mutationFn: async (list: ArtistMediaRow[]) => {
      const results = await Promise.all(
        list.map((m, idx) =>
          supabase.from("artist_media").update({ display_order: idx }).eq("id", m.id),
        ),
      );
      const failed = results.find((r) => r.error);
      if (failed?.error) throw failed.error;
    },
    onSuccess: invalidate,
    onError: invalidate,
  });
}

export interface ArtistMediaUpload {
  file: File;
  type: "image" | "video";
  displayOrder: number;
}

export function useUploadArtistMedia(artistId: string | null | undefined) {
  const invalidate = useArtistMediaInvalidate(artistId);
  return useMutation({
    mutationFn: async (uploads: ArtistMediaUpload[]) => {
      if (!artistId) throw new Error("Sem artista pra vincular a mídia.");
      for (const item of uploads) {
        const ext = item.file.name.split(".").pop() || (item.type === "image" ? "jpg" : "mp4");
        const filePath = `${artistId}/${crypto.randomUUID()}.${ext}`;

        const { error: uploadError } = await supabase.storage
          .from("artist-media")
          .upload(filePath, item.file, {
            contentType: item.file.type || undefined,
            upsert: false,
          });
        if (uploadError) throw uploadError;

        const {
          data: { publicUrl },
        } = supabase.storage.from("artist-media").getPublicUrl(filePath);

        const { error: insertErr } = await supabase.from("artist_media").insert({
          artist_id: artistId,
          url: publicUrl,
          media_type: item.type,
          display_order: item.displayOrder,
        });
        if (insertErr) throw insertErr;
      }
    },
    onSuccess: invalidate,
  });
}
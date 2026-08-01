import { useEffect, useState, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import {
  ImageIcon,
  Video,
  X,
  Upload,
  Loader2,
  GripVertical,
  Trash2,
  Play,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { handleError } from "@/lib/error-handler";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  compressImage,
  inspectVideo,
  formatBytes,
  type CompressedFile,
} from "@/lib/mediaCompression";

interface MediaUploadFormProps {
  artistId?: string;
  onMediaUploaded?: () => void;
}

interface MediaRow {
  id: string;
  url: string;
  media_type: string | null;
  display_order: number;
  thumbnail_url: string | null;
}

const MAX_IMAGE_MB = 15;
const MAX_VIDEO_MB = 40;
const MAX_VIDEO_SEC = 60;

export function MediaUploadForm({ artistId, onMediaUploaded }: MediaUploadFormProps) {
  const [uploading, setUploading] = useState(false);
  const [previews, setPreviews] = useState<CompressedFile[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const [reordering, setReordering] = useState<string | null>(null);
  const [items, setItems] = useState<MediaRow[]>([]);
  const dragIndex = useRef<number | null>(null);
  const qc = useQueryClient();

  const { data: existing = [], refetch } = useQuery({
    queryKey: ["artist-media-manage", artistId],
    enabled: !!artistId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("artist_media")
        .select("id, url, media_type, display_order, thumbnail_url")
        .eq("artist_id", artistId!)
        .order("display_order", { ascending: true })
        .order("created_at", { ascending: true });
      if (error) throw error;
      return (data || []) as MediaRow[];
    },
  });

  useEffect(() => {
    setItems(existing);
  }, [existing]);

  // Limpa object URLs no unmount
  useEffect(() => {
    return () => {
      previews.forEach((p) => URL.revokeObjectURL(p.preview));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const addFiles = useCallback(async (files: File[]) => {
    if (!files.length) return;
    const processed: CompressedFile[] = [];
    for (const raw of files) {
      const isImage = raw.type.startsWith("image/");
      const isVideo = raw.type.startsWith("video/");
      if (!isImage && !isVideo) continue;

      if (isImage) {
        if (raw.size > MAX_IMAGE_MB * 1024 * 1024) {
          toast.error(`Imagem grande demais: ${raw.name}`, {
            description: `Limite ${MAX_IMAGE_MB}MB antes da compressão.`,
          });
          continue;
        }
        const c = await compressImage(raw);
        processed.push(c);
        continue;
      }

      // video
      if (raw.size > MAX_VIDEO_MB * 1024 * 1024) {
        toast.error(`Vídeo grande demais: ${raw.name}`, {
          description: `Limite ${MAX_VIDEO_MB}MB. Reduz antes de mandar.`,
        });
        continue;
      }
      const info = await inspectVideo(raw);
      if (info.durationSec && info.durationSec > MAX_VIDEO_SEC) {
        toast.error(`Vídeo longo demais: ${raw.name}`, {
          description: `Até ${MAX_VIDEO_SEC}s. Manda um teaser mais curto.`,
        });
        URL.revokeObjectURL(info.preview);
        continue;
      }
      processed.push(info);
    }
    if (processed.length) {
      setPreviews((prev) => [...prev, ...processed]);
      const totalSaved = processed.reduce(
        (acc, p) => acc + (p.originalSize - p.finalSize),
        0
      );
      if (totalSaved > 200 * 1024) {
        toast.success(`Otimizei ${processed.length} arquivo(s)`, {
          description: `Economia total: ${formatBytes(totalSaved)}.`,
        });
      }
    }
  }, []);

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const files = Array.from(e.dataTransfer.files || []);
      addFiles(files);
    },
    [addFiles]
  );

  const removePreview = (index: number) => {
    setPreviews((prev) => {
      const updated = [...prev];
      URL.revokeObjectURL(updated[index].preview);
      updated.splice(index, 1);
      return updated;
    });
  };

  const uploadMedia = async () => {
    if (!artistId || previews.length === 0) return;
    setUploading(true);
    try {
      const baseOrder = items.length;
      for (let i = 0; i < previews.length; i++) {
        const item = previews[i];
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
          display_order: baseOrder + i,
        });
        if (insertErr) throw insertErr;
      }
      toast.success("Mídias enviadas!");
      previews.forEach((p) => URL.revokeObjectURL(p.preview));
      setPreviews([]);
      await refetch();
      qc.invalidateQueries({ queryKey: ["artist", artistId] });
      onMediaUploaded?.();
    } catch (error: any) {
      handleError(error, { context: "MediaUploadForm.upload", fallback: "Não deu pra enviar. Tenta de novo em instantes." });
    } finally {
      setUploading(false);
    }
  };

  const removeExisting = async (media: MediaRow) => {
    if (!confirm("Remover essa mídia da galeria?")) return;
    try {
      // tenta apagar do storage também
      const match = media.url.match(/artist-media\/(.+)$/);
      if (match?.[1]) {
        await supabase.storage.from("artist-media").remove([match[1]]);
      }
      const { error } = await supabase.from("artist_media").delete().eq("id", media.id);
      if (error) throw error;
      toast.success("Mídia removida.");
      await refetch();
      qc.invalidateQueries({ queryKey: ["artist", artistId] });
    } catch (e: any) {
      toast.error("Não deu pra remover", { description: e?.message });
    }
  };

  const persistOrder = async (list: MediaRow[]) => {
    try {
      // Atualiza um por um (poucos itens; simples e seguro com RLS)
      await Promise.all(
        list.map((m, idx) =>
          supabase.from("artist_media").update({ display_order: idx }).eq("id", m.id)
        )
      );
      qc.invalidateQueries({ queryKey: ["artist", artistId] });
    } catch (e: any) {
      toast.error("Não deu pra salvar a ordem", { description: e?.message });
      refetch();
    }
  };

  const handleDragStart = (idx: number) => {
    dragIndex.current = idx;
    setReordering(items[idx]?.id ?? null);
  };
  const handleDragOver = (e: React.DragEvent, idx: number) => {
    if (dragIndex.current === null || dragIndex.current === idx) return;
    e.preventDefault();
    const next = [...items];
    const [moved] = next.splice(dragIndex.current, 1);
    next.splice(idx, 0, moved);
    dragIndex.current = idx;
    setItems(next);
  };
  const handleDragEnd = () => {
    dragIndex.current = null;
    setReordering(null);
    persistOrder(items);
  };

  return (
    <div className="space-y-6">
      {/* Drop zone */}
      <div
        onDragEnter={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
        className={cn(
          "relative border-2 border-dashed rounded-2xl p-6 transition-all",
          dragOver ? "border-primary bg-primary/10" : "border-primary/20 bg-primary/5"
        )}
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <label className="group cursor-pointer">
            <input
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              disabled={uploading}
              onChange={(e) => addFiles(Array.from(e.target.files || []))}
            />
            <div className="border border-primary/10 rounded-xl p-4 flex flex-col items-center gap-2 bg-white/60 group-hover:bg-white transition">
              <ImageIcon className="h-6 w-6 text-primary" />
              <span className="text-xs font-bold uppercase tracking-widest text-primary">
                Adicionar fotos
              </span>
              <p className="text-[10px] text-muted-foreground text-center">
                JPG/PNG/WEBP · comprime automático · até {MAX_IMAGE_MB}MB
              </p>
            </div>
          </label>

          <label className="group cursor-pointer">
            <input
              type="file"
              accept="video/*"
              multiple
              className="hidden"
              disabled={uploading}
              onChange={(e) => addFiles(Array.from(e.target.files || []))}
            />
            <div className="border border-secondary/10 rounded-xl p-4 flex flex-col items-center gap-2 bg-white/60 group-hover:bg-white transition">
              <Video className="h-6 w-6 text-secondary" />
              <span className="text-xs font-bold uppercase tracking-widest text-secondary">
                Adicionar vídeos
              </span>
              <p className="text-[10px] text-muted-foreground text-center">
                MP4/MOV · até {MAX_VIDEO_SEC}s · até {MAX_VIDEO_MB}MB
              </p>
            </div>
          </label>
        </div>
        <p className="text-center text-[11px] text-muted-foreground mt-4">
          Ou <span className="font-semibold">arrasta e solta</span> os arquivos aqui.
        </p>
      </div>

      {/* Prévia dos arquivos escolhidos */}
      {previews.length > 0 && (
        <div className="space-y-4">
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
            {previews.map((item, idx) => (
              <div
                key={idx}
                className="relative aspect-square rounded-xl overflow-hidden border border-border group bg-muted"
              >
                {item.type === "image" ? (
                  <img src={item.preview} className="w-full h-full object-cover" alt="" />
                ) : (
                  <video
                    src={item.preview}
                    className="w-full h-full object-cover"
                    muted
                    playsInline
                  />
                )}
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-1.5 text-[9px] text-white leading-tight">
                  {item.compressed
                    ? `${formatBytes(item.finalSize)} · −${Math.round(
                        (1 - item.finalSize / item.originalSize) * 100
                      )}%`
                    : formatBytes(item.finalSize)}
                </div>
                <button
                  type="button"
                  onClick={() => removePreview(idx)}
                  className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-1 hover:bg-rose-500 transition-colors"
                  aria-label="Remover"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
          <Button
            onClick={uploadMedia}
            disabled={uploading}
            className="w-full rounded-xl gradient-sunset font-bold"
          >
            {uploading ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Upload className="h-4 w-4 mr-2" />
            )}
            Enviar {previews.length} {previews.length === 1 ? "mídia" : "mídias"}
          </Button>
        </div>
      )}

      {/* Galeria já publicada — reordenável */}
      {artistId && items.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-sm font-bold text-primary">Sua galeria</h3>
            <span className="text-[10px] uppercase tracking-widest text-muted-foreground">
              Arraste pra reordenar
            </span>
          </div>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
            {items.map((m, idx) => (
              <div
                key={m.id}
                draggable
                onDragStart={() => handleDragStart(idx)}
                onDragOver={(e) => handleDragOver(e, idx)}
                onDragEnd={handleDragEnd}
                className={cn(
                  "relative aspect-square rounded-xl overflow-hidden border bg-muted group cursor-grab active:cursor-grabbing transition-all",
                  reordering === m.id
                    ? "border-primary ring-2 ring-primary/40 scale-[0.98]"
                    : "border-border"
                )}
              >
                {m.media_type === "video" ? (
                  <>
                    <video
                      src={m.url}
                      className="w-full h-full object-cover"
                      muted
                      playsInline
                    />
                    <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                      <Play className="h-6 w-6 text-white drop-shadow" />
                    </div>
                  </>
                ) : (
                  <img src={m.url} className="w-full h-full object-cover" alt="" />
                )}
                <div className="absolute top-1 left-1 bg-black/60 text-white rounded-full p-1 opacity-70 group-hover:opacity-100">
                  <GripVertical className="h-3 w-3" />
                </div>
                <button
                  type="button"
                  onClick={() => removeExisting(m)}
                  className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-1 hover:bg-rose-500 transition-colors"
                  aria-label="Remover"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
                <div className="absolute bottom-1 left-1 text-[9px] font-bold bg-white/85 text-primary rounded-full px-2 py-0.5">
                  {idx + 1}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default MediaUploadForm;
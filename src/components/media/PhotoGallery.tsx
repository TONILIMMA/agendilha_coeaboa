import { useRef, useState } from "react";
import { ImagePlus, Loader2, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const BUCKET = "event-flyers"; // bucket público único reaproveitado
const MAX_MB = 5;
const MAX_PHOTOS = 8;

type Kind = "estabelecimentos" | "atrativos" | "events";

interface Props {
  urls: string[];
  onChange: (next: string[]) => void;
  kind: Kind;
  ownerUserId: string;
  /** id do estabelecimento/atrativo/evento, ou undefined enquanto for novo */
  targetId?: string | null;
  label?: string;
  helper?: string;
  max?: number;
}

/**
 * Galeria simples de fotos: upload múltiplo, preview, remover.
 * Grava no bucket público `event-flyers` em
 *   `{userId}/{kind}/{targetId ?? 'novo'}/{timestamp}-{filename}`
 * e devolve a lista de URLs públicas via onChange.
 */
export function PhotoGallery({
  urls,
  onChange,
  kind,
  ownerUserId,
  targetId,
  label = "Fotos",
  helper = "Fachada, logotipo ou imagens que representam o lugar.",
  max = MAX_PHOTOS,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const handlePick = () => inputRef.current?.click();

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    if (!ownerUserId) {
      toast.error("Faça login pra enviar fotos.");
      return;
    }
    const remaining = Math.max(0, max - urls.length);
    if (remaining === 0) {
      toast.error(`Você já enviou ${max} fotos.`);
      return;
    }
    const chosen = Array.from(files).slice(0, remaining);

    setUploading(true);
    const newUrls: string[] = [];
    try {
      for (const file of chosen) {
        if (file.size > MAX_MB * 1024 * 1024) {
          toast.error(`"${file.name}" tem mais de ${MAX_MB}MB. Pula essa e tenta outra.`);
          continue;
        }
        const ext = file.name.split(".").pop() || "jpg";
        const safeName = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
        const path = `${ownerUserId}/${kind}/${targetId ?? "novo"}/${safeName}`;
        const { error } = await supabase.storage
          .from(BUCKET)
          .upload(path, file, { upsert: false, contentType: file.type });
        if (error) {
          toast.error(`Não deu pra enviar "${file.name}"`, { description: error.message });
          continue;
        }
        const { data: pub } = supabase.storage.from(BUCKET).getPublicUrl(path);
        newUrls.push(pub.publicUrl);
      }
      if (newUrls.length > 0) {
        onChange([...urls, ...newUrls]);
        toast.success(
          newUrls.length === 1 ? "1 foto enviada." : `${newUrls.length} fotos enviadas.`
        );
      }
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const removeAt = (idx: number) => {
    const next = urls.filter((_, i) => i !== idx);
    onChange(next);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-baseline justify-between">
        <label className="text-sm font-semibold">{label}</label>
        <span className="text-[10px] text-muted-foreground">
          {urls.length}/{max}
        </span>
      </div>
      {helper && <p className="text-xs text-muted-foreground">{helper}</p>}

      <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
        {urls.map((u, i) => (
          <div
            key={u + i}
            className="relative aspect-square rounded-lg overflow-hidden ring-1 ring-border bg-muted"
          >
            <img src={u} alt={`Foto ${i + 1}`} className="w-full h-full object-cover" />
            <button
              type="button"
              onClick={() => removeAt(i)}
              className="absolute top-1 right-1 rounded-full bg-black/60 text-white p-1 hover:bg-black/80"
              aria-label="Remover foto"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}

        {urls.length < max && (
          <button
            type="button"
            onClick={handlePick}
            disabled={uploading}
            className="aspect-square rounded-lg border-2 border-dashed border-primary/30 bg-primary/5 flex flex-col items-center justify-center gap-1 text-primary/70 hover:bg-primary/10 disabled:opacity-60"
          >
            {uploading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <>
                <ImagePlus className="h-5 w-5" />
                <span className="text-[10px] font-semibold">Adicionar</span>
              </>
            )}
          </button>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />

      {urls.length === 0 && !uploading && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handlePick}
          className="w-full sm:w-auto gap-2"
        >
          <ImagePlus className="h-4 w-4" />
          Enviar fotos
        </Button>
      )}
    </div>
  );
}
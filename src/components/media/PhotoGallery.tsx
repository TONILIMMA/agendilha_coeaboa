import { useRef, useState } from "react";
import { ChevronLeft, ChevronRight, ImagePlus, Loader2, Star, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";

const BUCKET = "event-flyers"; // bucket público único reaproveitado
const MAX_MB = 5;
const MAX_PHOTOS = 8;
const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

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
  const [progress, setProgress] = useState({ done: 0, total: 0, currentName: "" });

  const handlePick = () => inputRef.current?.click();

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    if (!ownerUserId) {
      toast.error("Faça login pra enviar fotos.");
      return;
    }
    const remaining = Math.max(0, max - urls.length);
    if (remaining === 0) {
      toast.error(`Já tem ${max} fotos aqui.`, {
        description: `Remove alguma antes de enviar outra.`,
      });
      return;
    }
    const picked = Array.from(files);
    const overLimit = picked.length - remaining;
    const chosen = picked.slice(0, remaining);
    if (overLimit > 0) {
      toast.warning(
        `Só cabem mais ${remaining} ${remaining === 1 ? "foto" : "fotos"}.`,
        {
          description: `Vou enviar ${chosen.length} e deixar ${overLimit} de fora.`,
        }
      );
    }

    setUploading(true);
    setProgress({ done: 0, total: chosen.length, currentName: "" });
    const newUrls: string[] = [];
    let skippedSize = 0;
    let skippedType = 0;
    let failed = 0;

    try {
      for (let i = 0; i < chosen.length; i++) {
        const file = chosen[i];
        setProgress({ done: i, total: chosen.length, currentName: file.name });

        if (!ACCEPTED_TYPES.includes(file.type)) {
          skippedType++;
          toast.error(`"${file.name}" não é uma imagem suportada.`, {
            description: "Aceito JPG, PNG, WEBP ou GIF.",
          });
          continue;
        }
        if (file.size > MAX_MB * 1024 * 1024) {
          skippedSize++;
          toast.error(`"${file.name}" passou de ${MAX_MB}MB.`, {
            description: "Diminui a imagem no celular e tenta de novo.",
          });
          continue;
        }

        const ext = file.name.split(".").pop() || "jpg";
        const safeName = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
        const path = `${ownerUserId}/${kind}/${targetId ?? "novo"}/${safeName}`;

        const { error } = await supabase.storage
          .from(BUCKET)
          .upload(path, file, { upsert: false, contentType: file.type });

        if (error) {
          failed++;
          toast.error(`Não deu pra enviar "${file.name}".`, {
            description:
              "Confere sua internet e tenta de novo em alguns segundos.",
          });
          continue;
        }

        const { data: pub } = supabase.storage.from(BUCKET).getPublicUrl(path);
        newUrls.push(pub.publicUrl);
        setProgress({ done: i + 1, total: chosen.length, currentName: file.name });
      }

      if (newUrls.length > 0) {
        onChange([...urls, ...newUrls]);
        toast.success(
          newUrls.length === 1 ? "1 foto enviada." : `${newUrls.length} fotos enviadas.`
        );
      } else if (skippedSize + skippedType + failed > 0) {
        // Nenhuma passou — deixa claro o próximo passo
        toast.error("Nenhuma foto foi enviada.", {
          description: "Confere o tamanho e o formato e tenta de novo.",
        });
      }
    } finally {
      setUploading(false);
      setProgress({ done: 0, total: 0, currentName: "" });
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const removeAt = (idx: number) => {
    const next = urls.filter((_, i) => i !== idx);
    onChange(next);
  };

  const swap = (a: number, b: number) => {
    if (a < 0 || b < 0 || a >= urls.length || b >= urls.length) return;
    const next = [...urls];
    [next[a], next[b]] = [next[b], next[a]];
    onChange(next);
  };

  const makeFirst = (idx: number) => {
    if (idx <= 0) return;
    const next = [...urls];
    const [item] = next.splice(idx, 1);
    next.unshift(item);
    onChange(next);
  };

  const pct =
    progress.total > 0 ? Math.round((progress.done / progress.total) * 100) : 0;

  return (
    <div className="space-y-2">
      <div className="flex items-baseline justify-between">
        <label className="text-sm font-semibold">{label}</label>
        <span className="text-[10px] text-muted-foreground">
          {urls.length}/{max}
        </span>
      </div>
      {helper && <p className="text-xs text-muted-foreground">{helper}</p>}
      {urls.length > 1 && (
        <p className="text-[11px] text-muted-foreground">
          A ordem que você deixar aqui é a que aparece pra galera. A primeira é a foto de capa.
        </p>
      )}

      {uploading && progress.total > 0 && (
        <div className="space-y-1.5 rounded-lg bg-primary/5 border border-primary/15 p-3">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-primary">
              Enviando {progress.done + (progress.done < progress.total ? 1 : 0)} de {progress.total}
            </span>
            <span className="tabular-nums text-primary/80">{pct}%</span>
          </div>
          <Progress value={pct} className="h-1.5" />
          {progress.currentName && (
            <p className="text-[10px] text-muted-foreground truncate">
              {progress.currentName}
            </p>
          )}
        </div>
      )}

      <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
        {urls.map((u, i) => (
          <div
            key={u + i}
            className="relative aspect-square rounded-lg overflow-hidden ring-1 ring-border bg-muted group"
          >
            <img src={u} alt={`Foto ${i + 1}`} className="w-full h-full object-cover" />

            {i === 0 && (
              <span className="absolute top-1 left-1 rounded-full bg-primary text-primary-foreground text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 flex items-center gap-0.5">
                <Star className="h-2.5 w-2.5 fill-current" /> Capa
              </span>
            )}

            <button
              type="button"
              onClick={() => removeAt(i)}
              disabled={uploading}
              className="absolute top-1 right-1 rounded-full bg-black/60 text-white p-1 hover:bg-black/80 disabled:opacity-40"
              aria-label={`Remover foto ${i + 1}`}
            >
              <X className="h-3.5 w-3.5" />
            </button>

            {/* Reordenar */}
            <div className="absolute bottom-1 left-1 right-1 flex items-center justify-between gap-1">
              <button
                type="button"
                onClick={() => swap(i, i - 1)}
                disabled={uploading || i === 0}
                className="rounded-full bg-black/60 text-white p-1 hover:bg-black/80 disabled:opacity-30"
                aria-label={`Mover foto ${i + 1} para antes`}
                title="Mover pra trás"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
              </button>
              {i > 0 && (
                <button
                  type="button"
                  onClick={() => makeFirst(i)}
                  disabled={uploading}
                  className="rounded-full bg-black/60 text-white px-1.5 py-0.5 text-[9px] font-semibold hover:bg-black/80 disabled:opacity-30"
                  title="Usar como capa"
                >
                  Capa
                </button>
              )}
              <button
                type="button"
                onClick={() => swap(i, i + 1)}
                disabled={uploading || i === urls.length - 1}
                className="rounded-full bg-black/60 text-white p-1 hover:bg-black/80 disabled:opacity-30"
                aria-label={`Mover foto ${i + 1} para depois`}
                title="Mover pra frente"
              >
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
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
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                <span className="text-[10px] font-semibold">Enviando…</span>
              </>
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
        accept={ACCEPTED_TYPES.join(",")}
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

      <p className="text-[10px] text-muted-foreground">
        JPG, PNG, WEBP ou GIF. Cada foto até {MAX_MB}MB, máximo {max} no total.
      </p>
    </div>
  );
}
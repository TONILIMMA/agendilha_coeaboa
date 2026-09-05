import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { ImagePlus, Loader2, X } from "lucide-react";
import { toast } from "sonner";
import { handleError } from "@/lib/error-handler";
import { AD_PHOTOS_MAX, removeAdPhoto, uploadAdPhoto } from "@/lib/adPhotos";
import { useAdPhotoUrls } from "@/data/useAdPhotoUrls";

interface Props {
  userId: string;
  paths: string[];
  onChange: (paths: string[]) => void;
}

/** Envio de até 5 fotos do anúncio, com miniaturas e remoção. */
export function AdPhotoUploader({ userId, paths, onChange }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [enviando, setEnviando] = useState(false);
  const { data: urls = {} } = useAdPhotoUrls(paths);

  async function selecionar(files: FileList | null) {
    if (!files || files.length === 0) return;
    const espaco = AD_PHOTOS_MAX - paths.length;
    if (espaco <= 0) {
      toast.error(`Dá pra colocar no máximo ${AD_PHOTOS_MAX} fotos.`);
      return;
    }

    setEnviando(true);
    const novos: string[] = [];
    for (const file of Array.from(files).slice(0, espaco)) {
      try {
        novos.push(await uploadAdPhoto(file, userId));
      } catch (e) {
        handleError(e, "Não deu pra enviar essa foto. Tenta outra.");
      }
    }
    setEnviando(false);
    if (novos.length > 0) {
      onChange([...paths, ...novos]);
      toast.success(novos.length === 1 ? "Foto adicionada." : `${novos.length} fotos adicionadas.`);
    }
    if (inputRef.current) inputRef.current.value = "";
  }

  async function remover(path: string) {
    onChange(paths.filter((p) => p !== path));
    try {
      await removeAdPhoto(path);
    } catch {
      // A foto já saiu do anúncio; falha ao apagar o arquivo não bloqueia nada.
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-3">
        {paths.map((path) => (
          <div key={path} className="relative h-24 w-24 rounded-xl overflow-hidden border bg-muted">
            {urls[path] ? (
              <img src={urls[path]} alt="Foto do anúncio" className="h-full w-full object-cover" />
            ) : (
              <div className="h-full w-full flex items-center justify-center">
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              </div>
            )}
            <button
              type="button"
              onClick={() => void remover(path)}
              aria-label="Remover foto"
              className="absolute top-1 right-1 h-6 w-6 rounded-full bg-background/90 border flex items-center justify-center hover:bg-destructive hover:text-destructive-foreground transition-colors"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}

        {paths.length < AD_PHOTOS_MAX && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={enviando}
            className="h-24 w-24 rounded-xl border-2 border-dashed flex flex-col items-center justify-center gap-1 text-muted-foreground hover:border-primary hover:text-primary transition-colors"
          >
            {enviando ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <>
                <ImagePlus className="h-5 w-5" />
                <span className="text-[11px] font-medium">Adicionar</span>
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
        onChange={(e) => void selecionar(e.target.files)}
      />
      <p className="text-xs text-muted-foreground">
        Até {AD_PHOTOS_MAX} fotos, 10 MB cada. A primeira é a capa do anúncio.
      </p>
      {paths.length > 0 && (
        <Button type="button" variant="ghost" size="sm" onClick={() => onChange([])}>
          Limpar fotos
        </Button>
      )}
    </div>
  );
}

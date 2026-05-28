import { UseFormReturn } from "react-hook-form";
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload, X } from "lucide-react";
import { useRef, useState, useCallback } from "react";
import { toast } from "sonner";


interface ViaCepData {
  logradouro?: string;
  bairro?: string;
  localidade?: string;
  uf?: string;
  erro?: boolean;
}

export function CepField({ control, onCepFound }: { control: any; onCepFound: (data: ViaCepData) => void }) {
  const [loading, setLoading] = useState(false);

  const fetchCep = useCallback(async (cep: string) => {
    const clean = cep.replace(/\D/g, "");
    if (clean.length !== 8) return;
    setLoading(true);
    try {
      const res = await fetch(`https://viacep.com.br/ws/${clean}/json/`);
      const data: ViaCepData = await res.json();
      if (!data.erro) onCepFound(data);
    } catch { /* silently ignore */ }
    setLoading(false);
  }, [onCepFound]);

  return (
    <FormField
      control={control}
      name="addressZip"
      render={({ field }) => (
        <FormItem>
          <FormLabel>CEP</FormLabel>
          <FormControl>
            <Input
              {...field}
              inputMode="numeric"
              placeholder="00000-000"
              className="h-12 text-base"
              onChange={(e) => {
                field.onChange(e);
                fetchCep(e.target.value);
              }}
            />
          </FormControl>
          {loading && <p className="text-xs text-muted-foreground">Buscando endereço...</p>}
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

interface FileUploadProps {
  label: string;
  accept: string;
  file: File | string | null;
  onFileChange: (file: File | null) => void;
  required?: boolean;
}

export function FileUpload({ label, accept, file, onFileChange, required }: FileUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const fileName = file instanceof File ? file.name : (typeof file === 'string' ? 'Arquivo enviado' : null);

  return (
    <div className="space-y-2">
      <Label className="font-medium text-foreground">
        {label} {required && <span className="text-accent">*</span>}
      </Label>
      <div
        onClick={() => inputRef.current?.click()}
        className="relative flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-primary/30 bg-primary/5 px-3 sm:px-4 py-6 sm:py-8 cursor-pointer transition-all hover:border-primary/60 hover:bg-primary/10 active:scale-[0.98] min-h-[72px]"
      >
        <Upload className="h-6 w-6 text-primary/60" />
        {file ? (
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-foreground truncate max-w-[200px]">{fileName}</span>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onFileChange(null); }}
              className="rounded-full p-1.5 hover:bg-muted active:bg-muted/80 min-w-[36px] min-h-[36px] flex items-center justify-center"
            >
              <X className="h-4 w-4 text-muted-foreground" />
            </button>
          </div>
        ) : (
          <span className="text-sm text-muted-foreground text-center">Toque para enviar ({accept})</span>
        )}
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          className="hidden"
          onChange={(e) => {
            const selectedFile = e.target.files?.[0];
            if (selectedFile && selectedFile.size > 5 * 1024 * 1024) {
              toast.error("Arquivo muito grande", { description: "O limite é de 5MB" });
              return;
            }
            onFileChange(selectedFile || null);
          }}

        />
      </div>
    </div>
  );
}

import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { UseFormReturn } from "react-hook-form";
import { cn } from "@/lib/utils";

const GENRES = [
  "Samba", "Pagode", "Rock", "MPB", "Eletrônica", "Funk", "Sertanejo", "Jazz", "Blues", "Pop", "Forró", "Axé"
].sort();

interface PresentationFormProps {
  form: UseFormReturn<any>;
}

export function PresentationForm({ form }: PresentationFormProps) {
  const { register, watch, setValue } = form;
  const selectedStyles = watch("styles") || [];

  const toggleStyle = (style: string) => {
    const current = [...selectedStyles];
    const index = current.indexOf(style);
    if (index > -1) {
      current.splice(index, 1);
    } else {
      current.push(style);
    }
    setValue("styles", current);
  };

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <Label htmlFor="bio" className="text-xs font-bold uppercase tracking-wider">Biografia Curta *</Label>
        <Textarea 
          id="bio" 
          {...register("bio")}
          placeholder="Uma frase marcante que resuma quem você é..."
          className="min-h-[80px] bg-muted/30 border-none rounded-2xl resize-none p-4"
        />
        <p className="text-[10px] text-muted-foreground px-1 italic">Essa biografia aparece nos cards de busca.</p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="work_description" className="text-xs font-bold uppercase tracking-wider">Descrição do Trabalho *</Label>
        <Textarea 
          id="work_description" 
          {...register("work_description")}
          placeholder="Conte detalhes sobre seu repertório, trajetória e o que o público pode esperar do seu show..."
          className="min-h-[160px] bg-muted/30 border-none rounded-2xl resize-none p-4"
        />
      </div>

      <div className="space-y-4">
        <Label className="text-xs font-bold uppercase tracking-wider">Estilos Musicais *</Label>
        <div className="flex flex-wrap gap-2">
          {GENRES.map(style => (
            <Badge
              key={style}
              variant={selectedStyles.includes(style) ? "default" : "outline"}
              className={cn(
                "px-4 py-1.5 rounded-full cursor-pointer transition-all border-2",
                selectedStyles.includes(style) 
                  ? "bg-primary text-white border-primary" 
                  : "bg-transparent text-muted-foreground border-border hover:border-primary/30"
              )}
              onClick={() => toggleStyle(style)}
            >
              {style}
            </Badge>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="differentials" className="text-xs font-bold uppercase tracking-wider">Diferenciais</Label>
        <Textarea 
          id="differentials" 
          {...register("differentials")}
          placeholder="O que torna seu show único? Equipamento próprio? Formatos variados?"
          className="min-h-[80px] bg-muted/30 border-none rounded-2xl resize-none p-4"
        />
      </div>
    </div>
  );
}
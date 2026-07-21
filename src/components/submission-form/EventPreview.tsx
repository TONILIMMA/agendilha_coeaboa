import { UseFormReturn } from "react-hook-form";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Eye, MapPin, Clock, Music, Sparkles } from "lucide-react";

const CATEGORY_LABEL: Record<string, string> = {
  musica: "Música / Show",
  gastronomia: "Gastronomia",
  cultura: "Cultura / Arte",
  esporte: "Esporte",
  turismo: "Turismo",
  outros: "Outros",
};

interface EventPreviewProps {
  form: UseFormReturn<any>;
  variant?: "event" | "atrativo";
}

/**
 * Prévia leve de como o evento/atrativo vai aparecer na divulgação,
 * a partir dos dados já preenchidos nas Etapas 3 e 4.
 */
export function EventPreview({ form, variant = "event" }: EventPreviewProps) {
  const values = form.watch();
  const dateStr = values.date ? new Date(values.date) : null;
  const dateFmt = dateStr && !isNaN(dateStr.getTime())
    ? format(dateStr, "EEEE, dd/MM", { locale: ptBR })
    : "— defina a data";
  const startTime = values.startTime || "—:—";
  const endTime = values.endTime ? ` até ${values.endTime}` : "";
  const title = values.eventTitle?.trim() || values.atrativoName?.trim() || "Nome do evento";
  const atrativo = values.atrativoName?.trim() || "Atrativo a confirmar";
  const category = values.atrativoCategory ? CATEGORY_LABEL[values.atrativoCategory] : null;
  const age = values.ageRating || "Livre";
  const local = values.locationName?.trim() || "Local a confirmar";

  return (
    <div className="mt-6 rounded-xl border border-dashed border-primary/30 bg-primary/5 p-4">
      <div className="flex items-center gap-2 mb-3">
        <Eye className="h-4 w-4 text-primary" />
        <span className="text-[11px] font-bold uppercase tracking-widest text-primary">
          Prévia da divulgação
        </span>
      </div>
      <div className="rounded-lg bg-background border p-4 space-y-2 text-sm">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-bold text-base leading-snug capitalize">{title}</h3>
          <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-muted text-muted-foreground shrink-0">
            {age}
          </span>
        </div>
        <p className="flex items-center gap-2 text-muted-foreground capitalize">
          <Clock className="h-3.5 w-3.5" />
          {dateFmt} • {startTime}{endTime}
        </p>
        <p className="flex items-center gap-2 text-muted-foreground">
          <Music className="h-3.5 w-3.5" />
          {atrativo}
          {category && <span className="text-primary/80">• {category}</span>}
        </p>
        <p className="flex items-center gap-2 text-muted-foreground">
          <MapPin className="h-3.5 w-3.5" />
          {local}
        </p>
      </div>
      <p className="mt-2 text-[11px] text-muted-foreground flex items-center gap-1">
        <Sparkles className="h-3 w-3" />
        {variant === "event"
          ? "Assim vai aparecer pro público. Vai atualizando conforme você preenche."
          : "Categoria e atrativo entram na divulgação exatamente como aqui."}
      </p>
    </div>
  );
}
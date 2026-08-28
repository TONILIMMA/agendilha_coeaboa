import { UseFormReturn } from "react-hook-form";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { CalendarDays, Clock, MapPin, Music, Pencil } from "lucide-react";

/**
 * Resumo compacto do que foi preenchido na Etapa 1, exibido na Etapa 2.
 * Permite voltar e editar sem perder nada do que já foi digitado.
 */
export function Step1Summary({ form, onEdit }: { form: UseFormReturn<any>; onEdit: () => void }) {
  const v = form.watch();
  const dateLabel = v.date ? format(new Date(v.date), "EEEE, dd/MM", { locale: ptBR }) : "Sem data";
  const horario = v.startTime ? `${v.startTime}${v.endTime ? ` às ${v.endTime}` : ""}` : "Sem horário";

  const rows = [
    { icon: CalendarDays, text: dateLabel },
    { icon: Clock, text: horario },
    { icon: Music, text: v.atrativoName || "Sem atrativo" },
    { icon: MapPin, text: [v.locationName, v.eventAddress].filter(Boolean).join(" · ") || "Sem local" },
  ];

  return (
    <div className="rounded-2xl border bg-card/40 p-4 space-y-3">
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Etapa 1</p>
          <p className="font-bold truncate">{v.eventTitle || "Rolê sem título"}</p>
        </div>
        <Button type="button" variant="ghost" size="sm" className="gap-1 shrink-0" onClick={onEdit}>
          <Pencil className="h-3 w-3" />
          Editar
        </Button>
      </div>
      <ul className="grid gap-1.5 sm:grid-cols-2">
        {rows.map(({ icon: Icon, text }) => (
          <li key={text} className="flex items-center gap-2 text-sm text-muted-foreground min-w-0">
            <Icon className="h-3.5 w-3.5 shrink-0 text-primary" />
            <span className="truncate capitalize-first">{text}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

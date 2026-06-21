import { Badge } from "@/components/ui/badge";
import { editorialMeta, type EditorialStatus } from "./types";

export function StatusBadge({ status }: { status?: EditorialStatus | null }) {
  const key = (status || "recebido") as EditorialStatus;
  const meta = editorialMeta[key] ?? editorialMeta.recebido;
  return (
    <Badge variant="outline" className={`text-[10px] font-medium border ${meta.color}`}>
      {meta.label}
    </Badge>
  );
}

export function NextStepLabel({ status }: { status?: EditorialStatus | null }) {
  const key = (status || "recebido") as EditorialStatus;
  const meta = editorialMeta[key] ?? editorialMeta.recebido;
  return (
    <span className="text-[10px] text-muted-foreground italic">
      Próximo passo: <span className="text-foreground/80 not-italic font-medium">{meta.nextStep}</span>
    </span>
  );
}

export function PendingPublishBadge() {
  return (
    <Badge variant="outline" className="text-[10px] border-orange-400 bg-orange-50 text-orange-800 dark:bg-orange-900/30 dark:text-orange-200 animate-pulse">
      ⚠ Falta publicar
    </Badge>
  );
}
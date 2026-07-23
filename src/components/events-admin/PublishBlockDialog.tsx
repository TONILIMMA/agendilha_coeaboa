import { AlertCircle, CheckCircle2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";

export type PublishBlockAction = "aprovar" | "publicar" | "agendar" | "marcar como pronto";

export interface PublishBlockInfo {
  eventTitle?: string | null;
  action: PublishBlockAction;
  missing: string[]; // labels: "título", "data", "horário", "local"
}

const ALL_FIELDS = ["título", "data", "horário", "local"] as const;

export function PublishBlockDialog({
  info,
  onClose,
}: {
  info: PublishBlockInfo | null;
  onClose: () => void;
}) {
  const open = !!info;
  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent role="alertdialog" aria-labelledby="publish-block-title">
        <DialogHeader>
          <DialogTitle id="publish-block-title" className="flex items-center gap-2 text-destructive">
            <AlertCircle className="h-5 w-5" aria-hidden />
            Ainda falta um pouquinho pra {info?.action ?? "publicar"}
          </DialogTitle>
          <DialogDescription>
            {info?.eventTitle ? <>Evento: <strong>{info.eventTitle}</strong>. </> : null}
            Complete os itens abaixo pra liberar a divulgação.
          </DialogDescription>
        </DialogHeader>
        <ul className="space-y-2 py-2" aria-label="Campos obrigatórios">
          {ALL_FIELDS.map((label) => {
            const isMissing = info?.missing.includes(label);
            return (
              <li key={label} className="flex items-center gap-2 text-sm">
                {isMissing ? (
                  <XCircle className="h-4 w-4 text-destructive" aria-hidden />
                ) : (
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" aria-hidden />
                )}
                <span className={isMissing ? "font-medium text-foreground" : "text-muted-foreground line-through"}>
                  {label.charAt(0).toUpperCase() + label.slice(1)}
                </span>
                {isMissing && <span className="text-xs text-destructive">— faltando</span>}
              </li>
            );
          })}
        </ul>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Entendi</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
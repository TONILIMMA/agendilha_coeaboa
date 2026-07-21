import { UseFormReturn } from "react-hook-form";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, MapPin, Music, User, Phone, Sparkles } from "lucide-react";

const CATEGORY_LABEL: Record<string, string> = {
  musica: "Música / Show",
  gastronomia: "Gastronomia",
  cultura: "Cultura / Arte",
  esporte: "Esporte",
  turismo: "Turismo",
  outros: "Outros",
};

interface FullPreviewDialogProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  form: UseFormReturn<any>;
}

/**
 * Prévia em tela cheia da divulgação + atrativo, antes de enviar.
 * Mostra tudo do jeito que o público vai ver.
 */
export function FullPreviewDialog({ open, onOpenChange, form }: FullPreviewDialogProps) {
  const values = form.getValues();
  const d = values.date ? new Date(values.date) : null;
  const dateFmt = d && !isNaN(d.getTime())
    ? format(d, "EEEE, dd 'de' MMMM 'de' yyyy", { locale: ptBR })
    : "Data a definir";
  const startTime = values.startTime || "—:—";
  const endTime = values.endTime ? ` até ${values.endTime}` : "";
  const title = values.eventTitle?.trim() || values.atrativoName?.trim() || "Evento sem nome";
  const atrativo = values.atrativoName?.trim() || "Atrativo a confirmar";
  const category = values.atrativoCategory ? CATEGORY_LABEL[values.atrativoCategory] : null;
  const age = values.ageRating || "Livre";
  const local = values.locationName?.trim() || "Local a confirmar";
  const address = [values.addressStreet, values.addressNumber, values.addressNeighborhood, values.addressCity]
    .filter(Boolean).join(", ");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[92vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Prévia em tela cheia
          </DialogTitle>
          <DialogDescription>
            Assim vai aparecer pro público. Se algo tiver estranho, é só voltar e ajustar antes de enviar.
          </DialogDescription>
        </DialogHeader>

        <div className="rounded-2xl border-2 border-primary/20 bg-gradient-to-b from-primary/5 to-background p-6 space-y-5">
          {values.eventImageUrl && (
            <img
              src={values.eventImageUrl}
              alt={title}
              className="w-full aspect-square object-cover rounded-xl border"
            />
          )}

          <div className="space-y-3">
            <div className="flex items-start justify-between gap-3 flex-wrap">
              <h2 className="text-2xl font-bold leading-tight capitalize">{title}</h2>
              <Badge variant="secondary" className="shrink-0">{age}</Badge>
            </div>

            <div className="grid gap-2.5 text-sm">
              <p className="flex items-center gap-2 capitalize">
                <Calendar className="h-4 w-4 text-primary shrink-0" />
                {dateFmt}
              </p>
              <p className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-primary shrink-0" />
                {startTime}{endTime}
              </p>
              <p className="flex items-start gap-2">
                <MapPin className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                <span>
                  <span className="font-medium">{local}</span>
                  {address && <span className="block text-muted-foreground text-xs">{address}</span>}
                </span>
              </p>
              <p className="flex items-center gap-2">
                <Music className="h-4 w-4 text-primary shrink-0" />
                {atrativo}
                {category && <span className="text-muted-foreground">• {category}</span>}
              </p>
              {values.atrativoStyle && (
                <p className="flex items-center gap-2 text-muted-foreground text-xs pl-6">
                  Estilo: {values.atrativoStyle}
                </p>
              )}
            </div>

            {values.description && (
              <div className="pt-3 border-t">
                <p className="text-sm whitespace-pre-wrap">{values.description}</p>
              </div>
            )}

            {values.atrativoDescription && (
              <div className="pt-3 border-t">
                <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">Sobre o atrativo</p>
                <p className="text-sm whitespace-pre-wrap">{values.atrativoDescription}</p>
              </div>
            )}

            <div className="pt-3 border-t space-y-1.5 text-xs text-muted-foreground">
              {values.nickName && (
                <p className="flex items-center gap-2">
                  <User className="h-3.5 w-3.5" /> Divulgado por {values.nickName}
                </p>
              )}
              {values.basicPhone && (
                <p className="flex items-center gap-2">
                  <Phone className="h-3.5 w-3.5" /> {values.basicPhone}
                </p>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
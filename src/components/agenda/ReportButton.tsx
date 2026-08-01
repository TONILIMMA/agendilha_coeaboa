import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { handleError } from "@/lib/error-handler";

interface ReportButtonProps {
  eventId: string;
  eventTitle: string;
}

export function ReportButton({ eventId, eventTitle }: ReportButtonProps) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);

  const handleReport = async () => {
    if (!reason) {
      toast.error("Por favor, selecione um motivo.");
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.rpc("report_event", {
        target_event_id: eventId,
        report_reason: reason,
        report_description: description,
      });
      if (error) throw error;
      toast.success("Denúncia enviada com sucesso.", {
        description: "Nossa equipe de moderação irá analisar o evento em breve.",
      });
      setOpen(false);
    } catch (err) {
      handleError(err, { context: "ReportButton.submit", fallback: "Não deu pra enviar a denúncia. Tenta de novo." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Button
        variant="ghost"
        className="w-full h-10 text-xs font-bold text-red-500 hover:text-red-600 hover:bg-red-50 transition-colors"
        onClick={() => setOpen(true)}
      >
        🚩 Denunciar Evento Inadequado
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md rounded-[2rem]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertCircle className="h-5 w-5" />
              Denunciar Evento
            </DialogTitle>
            <DialogDescription>
              Ajude-nos a manter o AgendIlha seguro. Por que você está denunciando "{eventTitle}"?
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <p className="text-sm font-bold">Motivo</p>
              <Select onValueChange={setReason}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o motivo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Inadequado para menores">
                    Conteúdo inadequado para menores
                  </SelectItem>
                  <SelectItem value="Spam ou Falso">Spam ou Informação falsa</SelectItem>
                  <SelectItem value="Ofensivo ou Ódio">
                    Conteúdo ofensivo ou discurso de ódio
                  </SelectItem>
                  <SelectItem value="Drogas ou Violência">Drogas ou Violência explícita</SelectItem>
                  <SelectItem value="Outro">Outro motivo</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <p className="text-sm font-bold">Descrição Adicional (Opcional)</p>
              <Textarea
                placeholder="Conte-nos mais detalhes..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="min-h-[100px] rounded-xl"
              />
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="ghost" onClick={() => setOpen(false)} className="rounded-full">
              Cancelar
            </Button>
            <Button
              onClick={handleReport}
              disabled={loading}
              className="rounded-full bg-red-600 hover:bg-red-700 text-white font-bold px-8"
            >
              {loading ? "Enviando..." : "Enviar Denúncia"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
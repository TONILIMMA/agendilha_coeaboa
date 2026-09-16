import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Lock } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";

export type EventoEditavel = {
  id: string;
  event_title: string;
  date: string | null;
  start_time: string | null;
  end_time?: string | null;
  location?: string | null;
  description?: string | null;
  status?: string | null;
};

type Props = {
  evento: EventoEditavel | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onSaved?: () => void;
  /**
   * Se true, permite editar mesmo quando o evento já foi aprovado/publicado.
   * Reservado para admin/master. Divulgador comum recebe false.
   */
  canEditApproved?: boolean;
};

/**
 * Edição rápida do próprio rolê.
 * Depois de aprovado/publicado, o divulgador comum não edita mais: precisa
 * pedir alteração à curadoria. Só admin/master (canEditApproved) segue editando.
 * O RLS confere de novo no banco.
 */
export function EditarMeuEventoDialog({ evento, open, onOpenChange, onSaved, canEditApproved = false }: Props) {
  const { user } = useAuth();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<EventoEditavel | null>(evento);

  // sincroniza quando troca o evento selecionado
  if (evento && (!form || form.id !== evento.id)) setForm(evento);

  const isLocked =
    !canEditApproved &&
    (form?.status === "aprovado" || form?.status === "publicado");

  const set = (k: keyof EventoEditavel, v: string) =>
    setForm((f) => (f ? { ...f, [k]: v } : f));

  const salvar = async () => {
    if (!form || !user) return;
    if (isLocked) {
      toast.error("Evento travado para edição", {
        description: "Depois de aprovado, só a curadoria pode alterar. Peça a mudança pra moderação.",
      });
      return;
    }
    if (!form.event_title?.trim()) {
      toast.error("Falta o nome do rolê", { description: "Coloca um título pra galera reconhecer." });
      return;
    }
    setSaving(true);
    try {
      const { error } = await supabase
        .from("submissions")
        .update({
          event_title: form.event_title.trim(),
          date: form.date || null,
          start_time: form.start_time || null,
          end_time: form.end_time || null,
          location: form.location || null,
          description: form.description || null,
        })
        .eq("id", form.id)
        .eq("user_id", user.id);
      if (error) throw error;
      toast.success("Prontinho, evento atualizado!");
      onOpenChange(false);
      onSaved?.();
    } catch (e: any) {
      toast.error("Não rolou salvar agora", {
        description: e?.message || "Tenta de novo em instantes.",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Editar meu evento</DialogTitle>
          <DialogDescription>
            Ajuste os dados do seu rolê. Depois de salvar, a curadoria dá uma olhada de novo.
          </DialogDescription>
        </DialogHeader>

        {isLocked && (
          <div className="flex items-start gap-2 rounded-lg border border-amber-300 bg-amber-50/70 px-3 py-2.5 text-sm text-amber-800">
            <Lock className="h-4 w-4 mt-0.5 shrink-0" />
            <span>
              Este evento já foi aprovado e está travado para edição comum. Para mudar algo, peça
              autorização à curadoria/moderação.
            </span>
          </div>
        )}

        {form && (
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="ev-title">Nome do evento</Label>
              <Input
                id="ev-title"
                value={form.event_title || ""}
                disabled={isLocked}
                onChange={(e) => set("event_title", e.target.value)}
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="ev-date">Data</Label>
                <Input
                  id="ev-date"
                  type="date"
                  value={form.date || ""}
                  disabled={isLocked}
                  onChange={(e) => set("date", e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="ev-start">Começa</Label>
                <Input
                  id="ev-start"
                  type="time"
                  value={form.start_time || ""}
                  disabled={isLocked}
                  onChange={(e) => set("start_time", e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="ev-end">Termina</Label>
                <Input
                  id="ev-end"
                  type="time"
                  value={form.end_time || ""}
                  disabled={isLocked}
                  onChange={(e) => set("end_time", e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ev-local">Local</Label>
              <Input
                id="ev-local"
                value={form.location || ""}
                disabled={isLocked}
                onChange={(e) => set("location", e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ev-desc">Descrição</Label>
              <Textarea
                id="ev-desc"
                rows={4}
                value={form.description || ""}
                disabled={isLocked}
                onChange={(e) => set("description", e.target.value)}
              />
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            {isLocked ? "Fechar" : "Cancelar"}
          </Button>
          {!isLocked && (
            <Button onClick={salvar} disabled={saving}>
              {saving ? "Salvando…" : "Salvar alterações"}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default EditarMeuEventoDialog;

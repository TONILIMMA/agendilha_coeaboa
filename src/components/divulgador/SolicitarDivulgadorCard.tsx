import { useEffect, useState } from "react";
import { Megaphone, Clock, CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { useDivulgadorStatus } from "@/hooks/useDivulgadorStatus";
import { useCreateDivulgadorRequest } from "@/data/useDivulgadorRequest";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatPhoneDisplay, validateBrazilianMobile } from "@/lib/whatsapp";

const TIPOS = ["Produtor(a) de eventos", "Bar/Restaurante", "Espaço cultural", "Artista/Banda", "Coletivo", "Outro"];

/**
 * Bloco pra usuário público pedir pra virar Divulgador.
 * Some quando a pessoa já é Divulgador ou admin.
 */
export function SolicitarDivulgadorCard({ compact = false }: { compact?: boolean }) {
  const { user } = useAuth();
  const { loading, isDivulgador, profile, request, refresh } = useDivulgadorStatus();
  const [open, setOpen] = useState(false);
  const createRequest = useCreateDivulgadorRequest();
  const saving = createRequest.isPending;
  const [nome, setNome] = useState("");
  const [whats, setWhats] = useState("");
  const [tipo, setTipo] = useState("");
  const [motivo, setMotivo] = useState("");

  useEffect(() => {
    if (!profile) return;
    setNome((p) => p || profile.responsible_name || "");
    setWhats((p) => p || formatPhoneDisplay(profile.whatsapp_phone || profile.phone || ""));
  }, [profile]);

  if (!user || loading || isDivulgador) return null;

  const pendente = request?.status === "pendente";
  const recusado = request?.status === "recusado";

  const enviar = async () => {
    if (!nome.trim()) return toast.error("Diz teu nome pra gente saber com quem falar.");
    if (!validateBrazilianMobile(whats)) return toast.error("Confere o WhatsApp — precisa de DDD e número.");
    if (motivo.trim().length < 10) return toast.error("Conta rapidinho o que você quer divulgar.");

    try {
      await createRequest.mutateAsync({
        userId: user.id,
        nome: nome.trim(),
        whatsapp: whats.replace(/\D/g, ""),
        tipo_divulgador: tipo || null,
        motivo: motivo.trim(),
      });
    } catch (error: any) {
      toast.error(
        error?.code === "23505"
          ? "Você já tem um pedido em análise. Segura aí que a gente responde."
          : "Não rolou enviar agora. Tenta de novo em instantes."
      );
      return;
    }
    toast.success("Pedido enviado! A equipe avisa assim que liberar.");
    setOpen(false);
    refresh();
  };

  return (
    <div
      className={`rounded-2xl border border-foreground/10 bg-foreground/[0.03] ${compact ? "p-4" : "p-5"} space-y-3`}
      data-testid="solicitar-divulgador"
    >
      <div className="flex items-start gap-3">
        <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
          <Megaphone className="h-5 w-5 text-primary" />
        </div>
        <div className="min-w-0">
          <h3 className="font-bold tracking-tight">Quer divulgar seus rolês?</h3>
          <p className="text-sm text-foreground/65">
            Só Divulgador pode criar e editar eventos. Pede acesso que a equipe libera rapidinho.
          </p>
        </div>
      </div>

      {pendente ? (
        <div className="flex items-center gap-2 text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">
          <Clock className="h-4 w-4 shrink-0" />
          Pedido em análise. A gente te avisa por aqui assim que liberar.
        </div>
      ) : (
        <>
          {recusado && (
            <div className="flex items-start gap-2 text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl px-3 py-2">
              <XCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <span>
                Último pedido não aprovado
                {request?.admin_notes ? `: ${request.admin_notes}` : "."} Pode mandar de novo com mais detalhes.
              </span>
            </div>
          )}
          <Button className="rounded-full w-full sm:w-auto" onClick={() => setOpen(true)}>
            Quero ser Divulgador
          </Button>
        </>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Pedir acesso de Divulgador</DialogTitle>
            <DialogDescription>
              Rapidinho: a equipe confere e libera a criação de eventos.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="div-nome">Seu nome *</Label>
              <Input id="div-nome" name="name" autoComplete="name" value={nome} onChange={(e) => setNome(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="div-whats">WhatsApp *</Label>
              <Input
                id="div-whats"
                name="tel"
                autoComplete="tel"
                inputMode="tel"
                value={whats}
                onChange={(e) => setWhats(formatPhoneDisplay(e.target.value))}
                placeholder="(21) 99999-9999"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Você é...</Label>
              <Select value={tipo} onValueChange={setTipo}>
                <SelectTrigger><SelectValue placeholder="Escolhe uma opção" /></SelectTrigger>
                <SelectContent>
                  {TIPOS.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="div-motivo">O que você quer divulgar? *</Label>
              <Textarea
                id="div-motivo"
                rows={3}
                value={motivo}
                onChange={(e) => setMotivo(e.target.value)}
                placeholder="Ex.: shows no meu bar toda sexta, feira de artesanato no Cocotá..."
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="ghost" className="rounded-full" onClick={() => setOpen(false)}>
              Agora não
            </Button>
            <Button className="rounded-full" onClick={enviar} disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <CheckCircle2 className="h-4 w-4 mr-2" />}
              Enviar pedido
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
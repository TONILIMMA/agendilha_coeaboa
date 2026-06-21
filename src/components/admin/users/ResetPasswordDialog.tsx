import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  KeyRound,
  Copy,
  MessageCircle,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";
import {
  buildTempPasswordMessage,
  buildWhatsappUrl,
  formatPhoneDisplay,
} from "@/lib/whatsapp";
import type { ResetResultState } from "./types";

interface Props {
  resetResult: ResetResultState | null;
  setResetResult: (v: ResetResultState | null) => void;
}

export function ResetPasswordDialog({ resetResult, setResetResult }: Props) {
  return (
    <Dialog open={!!resetResult} onOpenChange={(open) => !open && setResetResult(null)}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <KeyRound className="h-5 w-5 text-primary" />
            Senha temporária gerada
          </DialogTitle>
          <DialogDescription>
            Copie ou envie pelo WhatsApp agora. Por segurança, esta senha só aparece uma vez.
          </DialogDescription>
        </DialogHeader>

        {resetResult && (
          <div className="space-y-4">
            <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 space-y-3">
              <p className="text-xs text-muted-foreground uppercase tracking-wider font-bold">
                Para: {resetResult.user.responsible_name || resetResult.user.email}
              </p>
              <p className="text-2xl font-bold tracking-widest text-center text-foreground font-mono py-2 select-all break-all">
                {resetResult.tempPassword}
              </p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="w-full"
                onClick={() => {
                  navigator.clipboard.writeText(resetResult.tempPassword);
                  toast.success("Senha copiada!");
                }}
              >
                <Copy className="mr-2 h-4 w-4" />
                Copiar senha
              </Button>
            </div>

            <div className="rounded-lg border border-border bg-muted/20 p-3 text-xs space-y-1">
              <p className="flex items-center gap-1">
                <strong>WhatsApp:</strong>{" "}
                {resetResult.phone ? formatPhoneDisplay(resetResult.phone) : "—"}{" "}
                {resetResult.phoneIsValid ? (
                  <span className="text-emerald-600 inline-flex items-center gap-0.5">
                    <CheckCircle2 className="h-3 w-3" /> válido
                  </span>
                ) : (
                  <span className="text-destructive inline-flex items-center gap-0.5">
                    <AlertCircle className="h-3 w-3" /> inválido
                  </span>
                )}
              </p>
              {!resetResult.phoneIsValid && (
                <p className="text-amber-700">
                  Telefone ausente ou fora do padrão BR (DDD + 9XXXX-XXXX). Envie por outro canal ou atualize o cadastro.
                </p>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-xs font-medium">Instruções extras (opcional)</label>
              <Input
                value={resetResult.customNote}
                maxLength={500}
                placeholder="Ex.: Use até hoje 18h. Dúvidas: fale com Daniel."
                onChange={(e) => {
                  const customNote = e.target.value;
                  setResetResult({
                    ...resetResult,
                    customNote,
                    message: buildTempPasswordMessage({
                      tempPassword: resetResult.tempPassword,
                      recipientName: resetResult.recipientName,
                      customNote,
                    }),
                  });
                }}
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-medium">Mensagem (edite se quiser)</label>
              <Textarea
                rows={7}
                value={resetResult.message}
                onChange={(e) => setResetResult({ ...resetResult, message: e.target.value })}
                className="text-xs font-mono bg-muted/30"
              />
            </div>

            {(() => {
              const liveUrl = resetResult.phone
                ? buildWhatsappUrl(resetResult.phone, resetResult.message)
                : null;
              return liveUrl ? (
                <Button asChild className="w-full h-11 bg-[#25D366] hover:bg-[#1ebe5b] text-white font-bold">
                  <a href={liveUrl} target="_blank" rel="noreferrer">
                    <MessageCircle className="mr-2 h-4 w-4" />
                    Enviar pelo WhatsApp
                  </a>
                </Button>
              ) : (
                <Button
                  type="button"
                  variant="outline"
                  className="w-full h-11"
                  onClick={() => {
                    navigator.clipboard.writeText(resetResult.message);
                    toast.success("Mensagem copiada — envie por outro canal");
                  }}
                >
                  <Copy className="mr-2 h-4 w-4" />
                  Copiar mensagem
                </Button>
              );
            })()}
          </div>
        )}

        <DialogFooter>
          <Button variant="ghost" onClick={() => setResetResult(null)}>
            Fechar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
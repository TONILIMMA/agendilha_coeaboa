import { useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import {
  Loader2,
  ArrowLeft,
  KeyRound,
  Copy,
  ShieldCheck,
  MessageCircle,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import {
  isValidBrazilianMobile,
  formatPhoneDisplay,
  buildTempPasswordMessage,
  buildWhatsappUrl,
} from "@/lib/whatsapp";

type Step = "phone" | "done";

export default function ForgotPassword() {
  const [step, setStep] = useState<Step>("phone");
  const [phone, setPhone] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [tempPassword, setTempPassword] = useState("");
  const [recipientName, setRecipientName] = useState<string | null>(null);
  const [message, setMessage] = useState("");

  const phoneOk = isValidBrazilianMobile(phone);

  function handlePhoneChange(e: React.ChangeEvent<HTMLInputElement>) {
    const d = e.target.value.replace(/\D/g, "");
    if (d.length <= 11) setPhone(formatPhoneDisplay(d));
  }

  async function handleGenerate(e: React.FormEvent) {
    e.preventDefault();
    if (!phoneOk) {
      toast.error("WhatsApp inválido", {
        description: "Use um celular brasileiro: (DDD) 9XXXX-XXXX",
      });
      return;
    }
    setSubmitting(true);
    const { data, error } = await supabase.functions.invoke(
      "generate-temp-password",
      { body: { phone } },
    );
    setSubmitting(false);

    if (error || data?.error) {
      toast.error("Não foi possível gerar a senha", {
        description: data?.error || error?.message,
      });
      return;
    }
    setTempPassword(data.tempPassword);
    setRecipientName(data.recipientName ?? null);
    setMessage(
      buildTempPasswordMessage({
        tempPassword: data.tempPassword,
        recipientName: data.recipientName,
      }),
    );
    setStep("done");
  }

  function copyPassword() {
    navigator.clipboard.writeText(tempPassword);
    toast.success("Senha copiada!");
  }

  const whatsappUrl = buildWhatsappUrl(phone, message);

  return (
    <div className="flex items-center justify-center min-h-screen bg-background px-4 py-8">
      <div className="w-full max-w-sm rounded-2xl bg-card shadow-elevated p-6 sm:p-8 space-y-6">
        <div className="text-center space-y-1">
          <h1 className="font-display text-2xl font-black text-primary tracking-tight">
            📌 AgendIlha
          </h1>
          <h2 className="text-sm font-bold text-foreground">Recuperar acesso</h2>
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground">
            senha temporária via WhatsApp
          </p>
        </div>

        {step === "phone" && (
          <form onSubmit={handleGenerate} className="space-y-5">
            <div className="bg-primary/5 p-4 rounded-xl border border-primary/10">
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                Informe seu WhatsApp cadastrado. Vamos gerar uma{" "}
                <strong>senha temporária</strong>. Após entrar, você define uma
                nova senha definitiva.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Seu WhatsApp</Label>
              <Input
                id="phone"
                type="tel"
                value={phone}
                onChange={handlePhoneChange}
                required
                placeholder="(21) 98765-4321"
                className="h-12 bg-muted/30 focus-visible:ring-primary/20"
                aria-invalid={phone.length > 0 && !phoneOk}
              />
              {phone.length > 0 && (
                <p
                  className={`flex items-center gap-1 text-[11px] ${
                    phoneOk ? "text-emerald-600" : "text-destructive"
                  }`}
                >
                  {phoneOk ? (
                    <CheckCircle2 className="h-3 w-3" />
                  ) : (
                    <AlertCircle className="h-3 w-3" />
                  )}
                  {phoneOk
                    ? "Número válido"
                    : "Use celular BR com DDD e 9 inicial"}
                </p>
              )}
            </div>

            <Button
              type="submit"
              disabled={submitting || !phoneOk}
              className="w-full h-12 gradient-sunset text-primary-foreground font-display font-black uppercase tracking-wider"
            >
              {submitting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <KeyRound className="mr-2 h-4 w-4" />
              )}
              Gerar senha temporária
            </Button>
          </form>
        )}

        {step === "done" && (
          <div className="space-y-5">
            <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 space-y-3">
              <div className="flex items-center gap-2 text-primary">
                <ShieldCheck className="h-4 w-4" />
                <p className="text-xs font-bold uppercase tracking-wider">
                  Senha gerada
                  {recipientName ? ` · ${recipientName.split(" ")[0]}` : ""}
                </p>
              </div>
              <p className="text-2xl font-bold tracking-widest text-center text-foreground font-mono py-2 select-all break-all">
                {tempPassword}
              </p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="w-full"
                onClick={copyPassword}
              >
                <Copy className="mr-2 h-4 w-4" />
                Copiar senha
              </Button>
              <p className="text-[11px] text-muted-foreground leading-snug">
                Anote ou copie agora — por segurança esta senha só aparece uma
                vez. Ao entrar você precisará trocá-la.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="msg" className="text-xs">
                Mensagem que será enviada (você pode personalizar)
              </Label>
              <Textarea
                id="msg"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={8}
                className="text-xs font-mono bg-muted/30"
              />
              <p className="text-[10px] text-muted-foreground">
                Destinatário: <strong>{formatPhoneDisplay(phone)}</strong>{" "}
                {phoneOk ? (
                  <span className="text-emerald-600">✓ válido</span>
                ) : (
                  <span className="text-destructive">✗ inválido</span>
                )}
              </p>
            </div>

            <Button
              asChild
              disabled={!whatsappUrl}
              className="w-full h-12 bg-[#25D366] hover:bg-[#1ebe5b] text-white font-bold disabled:opacity-50"
            >
              <a
                href={whatsappUrl ?? "#"}
                target="_blank"
                rel="noreferrer"
                onClick={(e) => {
                  if (!whatsappUrl) e.preventDefault();
                }}
              >
                <MessageCircle className="mr-2 h-4 w-4" />
                Enviar para meu WhatsApp
              </a>
            </Button>

            <Button asChild variant="outline" className="w-full">
              <Link to="/auth">Ir para o login</Link>
            </Button>
          </div>
        )}

        <Link
          to="/auth"
          className="flex items-center justify-center text-sm text-muted-foreground hover:text-primary transition-colors"
        >
          <ArrowLeft className="mr-1 h-3 w-3" />
          Voltar ao login
        </Link>
      </div>
    </div>
  );
}
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";
import { Loader2, Phone, ArrowLeft, KeyRound, CheckCircle2, Copy, ShieldCheck } from "lucide-react";
import { PasswordStrengthMeter, calculatePasswordScore } from "@/components/PasswordStrengthMeter";

type Step = "phone" | "code" | "newPassword" | "done";

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>("phone");
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [generatedCode, setGeneratedCode] = useState("");
  const [token, setToken] = useState("");
  const [showDirectInstructions, setShowDirectInstructions] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  function formatPhoneDisplay(value: string) {
    let d = value.replace(/\D/g, "");
    // Remove prefix for display formatting if it's there
    if (d.startsWith("55") && d.length > 11) d = d.slice(2);
    
    if (d.length <= 2) return d;
    if (d.length <= 7) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
    return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7, 11)}`;
  }


  function handlePhoneChange(e: React.ChangeEvent<HTMLInputElement>) {
    const d = e.target.value.replace(/\D/g, "");
    if (d.length <= 11) setPhone(formatPhoneDisplay(d));
  }

  function isValidPhone(value: string) {
    const d = value.replace(/\D/g, "");
    return (d.length >= 10 && d.length <= 11) || (d.startsWith("55") && d.length >= 12 && d.length <= 13);
  }


  async function handleRequestCode(e: React.FormEvent) {
    e.preventDefault();
    if (!isValidPhone(phone)) {
      toast.error("Número inválido", { description: "Use o formato (21) 98765-4321" });
      return;
    }
    setSubmitting(true);
    const { data, error } = await supabase.functions.invoke("request-password-reset", {
      body: { phone },
    });
    setSubmitting(false);
    
    if (error || data?.error) {
      // If automated reset fails, we can offer direct contact or just show the same message
      toast.error("Erro", { description: data?.error || error?.message });
      setShowDirectInstructions(true);
      return;
    }
    
    if (data?.code) {
      setGeneratedCode(data.code);
      setStep("code");
      toast.success("Solicitação recebida!", {
        description: "Enviaremos seu código pelo WhatsApp em instantes.",
      });
    } else {
      toast.success("Código enviado!", { description: "Verifique seu WhatsApp." });
      setStep("code");
    }
  }

  async function handleVerifyCode(e: React.FormEvent) {
    e.preventDefault();
    if (code.length !== 6) {
      toast.error("Digite os 6 dígitos do código");
      return;
    }
    setSubmitting(true);
    const { data, error } = await supabase.functions.invoke("verify-reset-code", {
      body: { phone, code },
    });
    setSubmitting(false);
    if (error || data?.error) {
      toast.error("Código incorreto", { description: data?.error || error?.message });
      return;
    }
    setToken(data.token);
    setStep("newPassword");
  }

  async function handleResetPassword(e: React.FormEvent) {
    e.preventDefault();
    if (newPassword.length < 6) {
      toast.error("Senha deve ter no mínimo 6 caracteres");
      return;
    }
    if (calculatePasswordScore(newPassword) < 3) {
      toast.error("Senha muito fraca", {
        description: "Atenda aos requisitos exibidos para criar uma senha mais segura.",
      });
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("As senhas não coincidem");
      return;
    }
    setSubmitting(true);
    const { data, error } = await supabase.functions.invoke("reset-password", {
      body: { phone, token, newPassword },
    });
    setSubmitting(false);
    if (error || data?.error) {
      toast.error("Erro ao redefinir", { description: data?.error || error?.message });
      return;
    }
    setStep("done");
  }

  function handleCopyCode() {
    navigator.clipboard.writeText(generatedCode);
    toast.success("Código copiado!");
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-background px-4">
      <div className="w-full max-w-sm rounded-2xl bg-card shadow-elevated p-8 space-y-6">
        <div className="text-center space-y-1">
          <h1 className="font-display text-2xl font-black text-primary tracking-tight">📌 AgendIlha</h1>
          <h2 className="text-sm font-bold text-foreground">Recuperar acesso</h2>
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground">via WhatsApp</p>
        </div>

        {step === "phone" && (
          <form onSubmit={handleRequestCode} className="space-y-5">
            <div className="bg-primary/5 p-4 rounded-xl border border-primary/10">
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                O WhatsApp é o seu canal de autenticação. Informe o número cadastrado para receber um código de acesso.
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
              />
            </div>
            
            {showDirectInstructions && (
              <div className="bg-amber-50 p-3 rounded-lg border border-amber-200 text-xs text-amber-900 leading-snug">
                Não recebeu o código? Entre em contato diretamente com o suporte pelo link:
                <a href="https://wa.me/5521999999999" target="_blank" rel="noreferrer" className="block mt-1 font-bold underline">Falar com suporte</a>
              </div>
            )}

            <Button
              type="submit"
              disabled={submitting}
              className="w-full h-12 gradient-sunset text-primary-foreground font-display font-black uppercase tracking-wider"
            >
              {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <KeyRound className="mr-2 h-4 w-4" />}
              Receber código no WhatsApp
            </Button>
          </form>
        )}

        {step === "code" && (
          <div className="space-y-4">
            {generatedCode && (
              <Alert>
                <ShieldCheck className="h-4 w-4" />
                <AlertDescription className="space-y-3">
                  <p className="text-sm">Seu código de verificação:</p>
                  <p className="text-3xl font-bold tracking-widest text-center text-primary font-mono py-2">
                    {generatedCode}
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={handleCopyCode}
                  >
                    <Copy className="mr-2 h-4 w-4" />
                    Copiar código
                  </Button>
                  <p className="text-xs text-muted-foreground">
                    Digite ou cole o código no campo abaixo. Validade: 15 minutos.
                  </p>
                </AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleVerifyCode} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="code">Código de 6 dígitos</Label>
                <Input
                  id="code"
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                  required
                  placeholder="000000"
                  className="text-center text-lg tracking-widest font-mono"
                />
              </div>
              <Button
                type="submit"
                disabled={submitting || code.length !== 6}
                className="w-full gradient-sunset text-primary-foreground font-display font-semibold"
              >
                {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Verificar código
              </Button>
            </form>
          </div>
        )}

        {step === "newPassword" && (
          <form onSubmit={handleResetPassword} className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Defina sua nova senha.
            </p>
            <div className="space-y-2">
              <Label htmlFor="newPassword">Nova senha</Label>
              <Input
                id="newPassword"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                minLength={6}
                placeholder="Mínimo 8 caracteres"
              />
              <PasswordStrengthMeter password={newPassword} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirme a senha</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={6}
                placeholder="Repita a senha"
              />
            </div>
            <Button
              type="submit"
              disabled={submitting}
              className="w-full gradient-sunset text-primary-foreground font-display font-semibold"
            >
              {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Redefinir senha
            </Button>
          </form>
        )}

        {step === "done" && (
          <div className="space-y-4 text-center">
            <CheckCircle2 className="h-12 w-12 text-primary mx-auto" />
            <h2 className="font-display text-lg font-semibold">Senha redefinida!</h2>
            <p className="text-sm text-muted-foreground">
              Você já pode entrar com sua nova senha.
            </p>
            <Button
              onClick={() => navigate("/auth")}
              className="w-full gradient-sunset text-primary-foreground font-display font-semibold"
            >
              Ir para login
            </Button>
          </div>
        )}

        {step !== "done" && (
          <Link
            to="/auth"
            className="flex items-center justify-center text-sm text-muted-foreground hover:text-primary transition-colors"
          >
            <ArrowLeft className="mr-1 h-3 w-3" />
            Voltar ao login
          </Link>
        )}
      </div>
    </div>
  );
}

import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, KeyRound, Loader2, Lock, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/ui/PasswordInput";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { handleError } from "@/lib/error-handler";
import { onlyPinDigits, validatePin } from "@/lib/pin";
import { maskBrPhone, toAuthEmail, toLegacyAuthEmail, validateWhatsappForAccount } from "@/lib/phone";
import { cn } from "@/lib/utils";

const phoneDigits = (value: string) => value.replace(/\D/g, "");
const primaryBtn = "w-full gradient-sunset text-primary-foreground font-display font-semibold";

/**
 * Recuperação de acesso self-service, sem administrador no meio:
 * - Esqueci minha senha: confirma o PIN de 4 dígitos e define a nova senha.
 * - Esqueci meu PIN: confirma a senha da conta e define o novo PIN.
 */
export default function ForgotPassword() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialTab = searchParams.get("tab") === "pin" ? "pin" : "senha";

  const [phone, setPhone] = useState("");
  const [busy, setBusy] = useState(false);

  // Aba senha
  const [pin, setPin] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Aba PIN
  const [password, setPassword] = useState("");
  const [newPin, setNewPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");

  async function handleResetPassword(e: React.FormEvent) {
    e.preventDefault();
    const phoneProblem = validateWhatsappForAccount(phone);
    if (phoneProblem) {
      toast.error(phoneProblem);
      return;
    }
    if (!/^\d{4}$/.test(pin)) {
      toast.error("O PIN deve ter exatamente 4 números.");
      return;
    }
    if (newPassword.length < 8) {
      toast.error("A nova senha precisa de no mínimo 8 caracteres.");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("As senhas não coincidem.");
      return;
    }

    setBusy(true);
    try {
      const { data, error } = await supabase.functions.invoke("pin-reset-password", {
        body: { phone: phoneDigits(phone), pin, newPassword },
      });

      const message = (data as { error?: string } | null)?.error;
      if (error || message) {
        toast.error(message || "Não deu pra confirmar. Confira o número e o PIN.");
        return;
      }

      toast.success("Senha redefinida! Já pode entrar com ela.");
      navigate("/auth", { replace: true });
    } catch (error) {
      handleError(error, { context: "ForgotPassword.resetPassword", fallback: "Não deu pra redefinir a senha agora." });
    } finally {
      setBusy(false);
    }
  }

  async function handleResetPin(e: React.FormEvent) {
    e.preventDefault();
    const phoneProblem = validateWhatsappForAccount(phone);
    if (phoneProblem) {
      toast.error(phoneProblem);
      return;
    }
    const problem = validatePin(newPin, confirmPin);
    if (problem) {
      toast.error(problem);
      return;
    }
    if (password.length < 6) {
      toast.error("Digite a senha da sua conta.");
      return;
    }

    setBusy(true);
    try {
      const email = toAuthEmail(phone)!;
      let { error: signInError } = await supabase.auth.signInWithPassword({ email, password });

      // Contas antigas usam outro e-mail sintético — tenta o formato legado.
      const legacy = toLegacyAuthEmail(phone);
      if (signInError && legacy && legacy !== email) {
        signInError = (await supabase.auth.signInWithPassword({ email: legacy, password })).error;
      }

      if (signInError) {
        toast.error("Número ou senha incorretos.", { description: "Confira os dados e tente de novo." });
        return;
      }

      const { error } = await supabase.rpc("set_user_pin", { new_pin: newPin, current_password: password });
      if (error) {
        toast.error(error.message || "Não deu pra salvar o novo PIN.");
        return;
      }

      toast.success("PIN redefinido! Já pode usar os 4 números novos.");
      navigate("/", { replace: true });
    } catch (error) {
      handleError(error, { context: "ForgotPassword.resetPin", fallback: "Não deu pra redefinir o PIN agora." });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-background px-4 py-8">
      <div className="w-full max-w-sm rounded-2xl bg-card shadow-elevated p-6 sm:p-8 space-y-6">
        <div className="text-center space-y-1">
          <h1 className="font-display text-2xl font-black text-primary tracking-tight">AgendIlha</h1>
          <h2 className="text-sm font-bold text-foreground">Recuperar acesso</h2>
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground">
            Resolve na hora, sem esperar ninguém
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="recover-phone">WhatsApp da conta</Label>
          <Input
            id="recover-phone"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            value={phone}
            onChange={(e) => setPhone(maskBrPhone(e.target.value))}
            placeholder="(21) 98765-4321"
            className="h-11 bg-muted/30"
          />
        </div>

        <Tabs defaultValue={initialTab}>
          <TabsList className="grid grid-cols-2 w-full">
            <TabsTrigger value="senha" className="text-xs font-bold">Esqueci a senha</TabsTrigger>
            <TabsTrigger value="pin" className="text-xs font-bold">Esqueci o PIN</TabsTrigger>
          </TabsList>

          <TabsContent value="senha" className="pt-4">
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="recover-pin">PIN de 4 números</Label>
                <Input
                  id="recover-pin"
                  type="password"
                  inputMode="numeric"
                  maxLength={4}
                  value={pin}
                  onChange={(e) => setPin(onlyPinDigits(e.target.value))}
                  placeholder="••••"
                  className="text-center text-xl tracking-[0.4em]"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="recover-newpass">Nova senha</Label>
                <PasswordInput
                  id="recover-newpass"
                  autoComplete="new-password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Mínimo 8 caracteres"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="recover-confirmpass">Confirmar nova senha</Label>
                <PasswordInput
                  id="recover-confirmpass"
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repita a senha"
                />
              </div>
              <Button type="submit" disabled={busy} className={primaryBtn}>
                {busy ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Lock className="h-4 w-4 mr-2" />}
                Redefinir senha
              </Button>
              <p className="text-[10px] text-muted-foreground text-center">
                Nunca cadastrou PIN? Então essa via não funciona ainda: entre com a senha atual e
                cadastre o PIN em Configurações da conta. Sem senha e sem PIN, chama a curadoria no
                WhatsApp pra liberar seu acesso.
              </p>
            </form>
          </TabsContent>

          <TabsContent value="pin" className="pt-4">
            <form onSubmit={handleResetPin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="recover-password">Senha da conta</Label>
                <PasswordInput
                  id="recover-password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Sua senha de login"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="recover-newpin">Novo PIN</Label>
                  <Input
                    id="recover-newpin"
                    type="password"
                    inputMode="numeric"
                    maxLength={4}
                    value={newPin}
                    onChange={(e) => setNewPin(onlyPinDigits(e.target.value))}
                    placeholder="••••"
                    className="text-center text-xl tracking-[0.4em]"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="recover-confirmpin">Confirmar</Label>
                  <Input
                    id="recover-confirmpin"
                    type="password"
                    inputMode="numeric"
                    maxLength={4}
                    value={confirmPin}
                    onChange={(e) => setConfirmPin(onlyPinDigits(e.target.value))}
                    placeholder="••••"
                    className="text-center text-xl tracking-[0.4em]"
                  />
                </div>
              </div>
              <Button type="submit" disabled={busy} className={primaryBtn}>
                {busy ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <KeyRound className="h-4 w-4 mr-2" />}
                Redefinir PIN
              </Button>
            </form>
          </TabsContent>
        </Tabs>

        <div className="flex items-start gap-2 rounded-xl border border-border bg-muted/40 p-3">
          <ShieldCheck className="h-4 w-4 text-primary mt-0.5 shrink-0" />
          <p className="text-[11px] text-muted-foreground">
            Depois de redefinir, você já entra normalmente — sem precisar de liberação de ninguém.
          </p>
        </div>

        <Button asChild variant="outline" className={cn("w-full")}>
          <Link to="/auth">
            <ArrowLeft className="h-4 w-4 mr-2" /> Voltar para o login
          </Link>
        </Button>
      </div>
    </div>
  );
}

import { useEffect, useState, type ReactNode } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Loader2, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { handleError } from "@/lib/error-handler";
import { logger } from "@/lib/logger";
import { supabase } from "@/integrations/supabase/client";
import { validatePin } from "@/lib/pin";

const SESSION_KEY = "admin_pin_token";
const TTL_MS = 30 * 60 * 1000; // 30 min (espelho do backend)

type StoredToken = { userId: string; token: string; expiresAt: number };

const readToken = (userId: string): string | null => {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StoredToken;
    if (parsed.userId !== userId) return null;
    if (Date.now() > parsed.expiresAt) {
      sessionStorage.removeItem(SESSION_KEY);
      return null;
    }
    return parsed.token;
  } catch {
    sessionStorage.removeItem(SESSION_KEY);
    return null;
  }
};

const writeToken = (userId: string, token: string) => {
  const payload: StoredToken = { userId, token, expiresAt: Date.now() + TTL_MS };
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(payload));
};

const removeToken = () => sessionStorage.removeItem(SESSION_KEY);

type Mode = "verify" | "setup" | "change" | "forgot";

const validateNewPin = (newPin: string, confirmPin: string): string | null =>
  validatePin(newPin, confirmPin);

/**
 * Gate de PIN para áreas sensíveis do Painel Master/Admin.
 * - Desbloqueio validado pelo backend (admin_pin_sessions), com expiração de 30 min.
 * - Não existe PIN padrão: no primeiro acesso o admin define o PIN dele (setup_admin_pin).
 * - Trocar o PIN exige o PIN atual; "Esqueci o PIN" exige a senha da conta.
 */
export default function AdminPinGate({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [unlocked, setUnlocked] = useState(false);
  const [mode, setMode] = useState<Mode>("verify");
  const [checkingStatus, setCheckingStatus] = useState(true);
  const [pin, setPin] = useState("");
  const [currentPin, setCurrentPin] = useState("");
  const [newPin, setNewPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [resetPassword, setResetPassword] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!user) {
      removeToken();
      setUnlocked(false);
      setMode("verify");
      return;
    }

    const token = readToken(user.id);
    if (!token) {
      setUnlocked(false);
      return;
    }

    let cancelled = false;
    supabase.rpc("verify_admin_pin_session", { input_token: token }).then(({ data, error }) => {
      if (cancelled) return;
      if (error || !data) {
        removeToken();
        setUnlocked(false);
      } else {
        setUnlocked(true);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [user]);

  useEffect(() => {
    let cancelled = false;
    const checkStatus = async () => {
      if (!user) return;
      setCheckingStatus(true);
      const { data, error } = await supabase.rpc("admin_pin_status");
      if (cancelled) return;
      setCheckingStatus(false);

      if (error) {
        handleError(error, { context: "AdminPinGate.status", fallback: "Falha ao consultar PIN administrativo." });
        return;
      }

      const status = data?.[0] as { is_admin?: boolean; has_pin?: boolean; requires_change?: boolean } | undefined;
      if (status?.is_admin && !status.has_pin) {
        setMode("setup");
      }
    };
    checkStatus();
    return () => {
      cancelled = true;
    };
  }, [user]);

  if (!user) return null;
  if (unlocked) return <>{children}</>;

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pin.length !== 4) return;

    setBusy(true);
    try {
      const { data, error } = await supabase.rpc("create_admin_pin_session", { input_pin: pin });
      if (error) throw error;

      const result = data?.[0] as { session_token?: string; requires_change?: boolean; error_message?: string } | undefined;

      if (!result || result.error_message) {
        toast.error(result?.error_message || "PIN incorreto");
        setPin("");
        return;
      }

      if (result.requires_change) {
        setCurrentPin(pin);
        setPin("");
        setMode("change");
        toast.info("Você precisa definir um novo PIN para continuar.");
        return;
      }

      if (!result.session_token) {
        toast.error("Não foi possível criar a sessão de acesso.");
        return;
      }

      writeToken(user.id, result.session_token);
      setUnlocked(true);
    } catch (error) {
      handleError(error, { context: "AdminPinGate.verify", fallback: "Não deu pra conferir o PIN. Tenta de novo." });
    } finally {
      setBusy(false);
    }
  };

  const handleSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    const problem = validateNewPin(newPin, confirmPin);
    if (problem) {
      toast.error(problem);
      return;
    }

    setBusy(true);
    try {
      const { data, error } = await supabase.rpc("setup_admin_pin", { new_pin: newPin });
      if (error) throw error;

      const result = data?.[0] as { session_token?: string; error_message?: string } | undefined;

      if (!result || result.error_message) {
        toast.error(result?.error_message || "Não foi possível configurar o PIN");
        if (result?.error_message?.includes("já tem um PIN")) {
          setMode("verify");
        }
        return;
      }

      if (!result.session_token) {
        toast.error("PIN salvo, mas não foi possível abrir a sessão. Entre com o PIN novo.");
        setMode("verify");
        return;
      }

      writeToken(user.id, result.session_token);
      setNewPin("");
      setConfirmPin("");
      toast.success("PIN configurado. Guarde bem esse número.");
      setUnlocked(true);
    } catch (error) {
      handleError(error, { context: "AdminPinGate.setup", fallback: "Não deu pra configurar o PIN. Tenta de novo." });
    } finally {
      setBusy(false);
    }
  };

  const handleChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^\d{4}$/.test(currentPin)) {
      toast.error("Digite o PIN atual");
      return;
    }
    const problem = validateNewPin(newPin, confirmPin);
    if (problem) {
      toast.error(problem);
      return;
    }

    setBusy(true);
    try {
      const { error } = await supabase.rpc("update_admin_pin", { current_pin: currentPin, new_pin: newPin });
      if (error) {
        handleError(error, { context: "AdminPinGate.update", fallback: "Erro ao atualizar PIN" });
        return;
      }

      const { data: sessionData, error: sessionError } = await supabase.rpc("create_admin_pin_session", { input_pin: newPin });
      if (sessionError) throw sessionError;

      const result = sessionData?.[0] as { session_token?: string; error_message?: string } | undefined;
      if (!result?.session_token) {
        toast.error("PIN salvo, mas não foi possível abrir a sessão. Tente entrar de novo.");
        setMode("verify");
        setPin("");
        setCurrentPin("");
        setNewPin("");
        setConfirmPin("");
        return;
      }

      writeToken(user.id, result.session_token);
      toast.success("PIN atualizado com sucesso");
      setCurrentPin("");
      setNewPin("");
      setConfirmPin("");
      setUnlocked(true);
    } catch (error) {
      handleError(error, { context: "AdminPinGate.update", fallback: "Não deu pra atualizar o PIN. Tenta de novo." });
    } finally {
      setBusy(false);
    }
  };

  const handleForgotPin = async (e: React.FormEvent) => {
    e.preventDefault();
    const problem = validateNewPin(newPin, confirmPin);
    if (problem) {
      toast.error(problem);
      return;
    }
    if (resetPassword.length < 6) {
      toast.error("Digite sua senha atual corretamente");
      return;
    }

    setBusy(true);
    try {
      const { error } = await supabase.rpc("reset_admin_pin_with_password", {
        new_pin: newPin,
        current_password: resetPassword,
      });

      if (error) {
        handleError(error, { context: "AdminPinGate.reset", fallback: "Não foi possível redefinir o PIN" });
        return;
      }

      removeToken();
      setResetPassword("");
      setNewPin("");
      setConfirmPin("");
      setMode("verify");
      toast.success("PIN redefinido. Agora entre com o novo PIN.");
    } catch (error) {
      handleError(error, { context: "AdminPinGate.reset", fallback: "Não deu pra redefinir o PIN. Tenta de novo." });
    } finally {
      setBusy(false);
    }
  };

  const title =
    mode === "setup"
      ? "Crie seu PIN de acesso"
      : mode === "change"
      ? "Defina seu novo PIN"
      : mode === "forgot"
      ? "Redefinir PIN"
      : "Acesso restrito";

  const description =
    mode === "setup"
      ? "Primeiro acesso: escolha um PIN de 4 dígitos só seu. Ele será pedido sempre que você entrar nesta área."
      : mode === "change"
      ? "Confirme o PIN atual e escolha o novo PIN de 4 dígitos."
      : mode === "forgot"
      ? "Digite a senha da sua conta e escolha um novo PIN de 4 dígitos."
      : "Digite seu PIN de 4 dígitos para acessar esta área.";

  return (
    <Dialog open modal>
      <DialogContent className="sm:max-w-sm" onInteractOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-primary" />
            {title}
          </DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        {mode === "verify" && (
          <form onSubmit={handleVerify} className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="pin">PIN</Label>
              <Input
                id="pin"
                type="password"
                inputMode="numeric"
                autoFocus
                maxLength={4}
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
                placeholder="••••"
                className="text-center text-2xl tracking-[0.5em]"
                disabled={checkingStatus}
              />
            </div>
            <DialogFooter className="flex-col gap-2">
              <Button type="submit" className="w-full" disabled={busy || checkingStatus || pin.length !== 4}>
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Entrar"}
              </Button>
              <Button
                type="button"
                variant="ghost"
                className="w-full text-xs"
                onClick={() => {
                  setPin("");
                  setMode("change");
                }}
                disabled={busy}
              >
                Trocar meu PIN
              </Button>
              <Button
                type="button"
                variant="ghost"
                className="w-full text-xs"
                onClick={() => {
                  setPin("");
                  setMode("forgot");
                }}
                disabled={busy}
              >
                Esqueci o PIN
              </Button>
            </DialogFooter>
          </form>
        )}

        {mode === "setup" && (
          <form onSubmit={handleSetup} className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="setup-newpin">Novo PIN</Label>
              <Input
                id="setup-newpin"
                type="password"
                inputMode="numeric"
                autoFocus
                maxLength={4}
                value={newPin}
                onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ""))}
                placeholder="••••"
                className="text-center text-xl tracking-[0.4em]"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="setup-confirmpin">Confirmar PIN</Label>
              <Input
                id="setup-confirmpin"
                type="password"
                inputMode="numeric"
                maxLength={4}
                value={confirmPin}
                onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, ""))}
                placeholder="••••"
                className="text-center text-xl tracking-[0.4em]"
              />
            </div>
            <DialogFooter>
              <Button type="submit" className="w-full" disabled={busy}>
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Salvar meu PIN"}
              </Button>
            </DialogFooter>
          </form>
        )}

        {mode === "change" && (
          <form onSubmit={handleChange} className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="currentpin">PIN atual</Label>
              <Input
                id="currentpin"
                type="password"
                inputMode="numeric"
                autoFocus
                maxLength={4}
                value={currentPin}
                onChange={(e) => setCurrentPin(e.target.value.replace(/\D/g, ""))}
                placeholder="••••"
                className="text-center text-xl tracking-[0.4em]"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="newpin">Novo PIN</Label>
              <Input
                id="newpin"
                type="password"
                inputMode="numeric"
                maxLength={4}
                value={newPin}
                onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ""))}
                placeholder="••••"
                className="text-center text-xl tracking-[0.4em]"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="confirmpin">Confirmar PIN</Label>
              <Input
                id="confirmpin"
                type="password"
                inputMode="numeric"
                maxLength={4}
                value={confirmPin}
                onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, ""))}
                placeholder="••••"
                className="text-center text-xl tracking-[0.4em]"
              />
            </div>
            <DialogFooter className="flex-col gap-2">
              <Button type="submit" className="w-full" disabled={busy}>
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Salvar novo PIN"}
              </Button>
              <Button
                type="button"
                variant="ghost"
                className="w-full text-xs"
                onClick={() => {
                  setMode("verify");
                  setCurrentPin("");
                  setNewPin("");
                  setConfirmPin("");
                }}
                disabled={busy}
              >
                Voltar
              </Button>
            </DialogFooter>
          </form>
        )}

        {mode === "forgot" && (
          <form onSubmit={handleForgotPin} className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="reset-password">Senha atual da conta</Label>
              <Input
                id="reset-password"
                type="password"
                autoFocus
                value={resetPassword}
                onChange={(e) => setResetPassword(e.target.value)}
                placeholder="Sua senha de login"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="forgot-newpin">Novo PIN</Label>
              <Input
                id="forgot-newpin"
                type="password"
                inputMode="numeric"
                maxLength={4}
                value={newPin}
                onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ""))}
                placeholder="••••"
                className="text-center text-xl tracking-[0.4em]"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="forgot-confirmpin">Confirmar PIN</Label>
              <Input
                id="forgot-confirmpin"
                type="password"
                inputMode="numeric"
                maxLength={4}
                value={confirmPin}
                onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, ""))}
                placeholder="••••"
                className="text-center text-xl tracking-[0.4em]"
              />
            </div>
            <DialogFooter className="flex-col gap-2">
              <Button type="submit" className="w-full" disabled={busy}>
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Redefinir PIN"}
              </Button>
              <Button
                type="button"
                variant="ghost"
                className="w-full text-xs"
                onClick={() => {
                  setMode("verify");
                  setResetPassword("");
                  setNewPin("");
                  setConfirmPin("");
                }}
                disabled={busy}
              >
                Voltar ao login
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}

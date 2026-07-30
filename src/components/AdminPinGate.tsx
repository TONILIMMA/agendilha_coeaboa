import { useEffect, useState, type ReactNode } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Loader2, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

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

type Mode = "verify" | "change" | "forgot";

/**
 * Gate de PIN para áreas sensíveis do Painel Master/Admin.
 * - O desbloqueio agora é validado pelo backend (tabela admin_pin_sessions).
 * - Sessões expiram em 30 minutos e podem ser revogadas.
 * - PIN padrão 0000 só funciona no primeiro acesso e força troca imediata.
 * - "Esqueci o PIN" permite redefinir usando a senha da conta.
 * - Apenas administradores/master podem acessar.
 */
export default function AdminPinGate({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [unlocked, setUnlocked] = useState(false);
  const [mode, setMode] = useState<Mode>("verify");
  const [pin, setPin] = useState("");
  const [newPin, setNewPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [resetPassword, setResetPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [isDefaultPin, setIsDefaultPin] = useState<boolean | null>(null);

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

    // Valida o token no backend ao carregar
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
    const checkStatus = async () => {
      if (!user) return;
      const { data, error } = await supabase
        .from("admin_configs")
        .select("pin_hash, requires_change")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) {
        console.error("Error checking admin pin status:", error);
        return;
      }

      const noPin = !data || !data.pin_hash;
      setIsDefaultPin(noPin || data?.requires_change);
    };
    checkStatus();
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

      const result = data as { session_token?: string; requires_change?: boolean; error_message?: string } | null;

      if (!result || result.error_message) {
        toast.error(result?.error_message || "PIN incorreto");
        setPin("");
        return;
      }

      if (result.requires_change) {
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
      console.error("Error verifying PIN:", error);
      toast.error("Erro ao verificar PIN");
    } finally {
      setBusy(false);
    }
  };

  const handleChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^\d{4}$/.test(newPin)) {
      toast.error("O PIN deve ter 4 dígitos");
      return;
    }
    if (newPin === "0000") {
      toast.error("Escolha um PIN diferente do padrão");
      return;
    }
    if (newPin !== confirmPin) {
      toast.error("Os PINs não coincidem");
      return;
    }

    setBusy(true);
    try {
      const { error } = await supabase.rpc("update_admin_pin", { new_pin: newPin });
      if (error) throw error;

      // Após trocar o PIN, cria a sessão de desbloqueio com o novo PIN
      const { data: sessionData, error: sessionError } = await supabase.rpc("create_admin_pin_session", { input_pin: newPin });
      if (sessionError) throw sessionError;

      const result = sessionData as { session_token?: string; error_message?: string } | null;
      if (!result?.session_token) {
        toast.error("PIN salvo, mas não foi possível abrir a sessão. Tente entrar de novo.");
        setMode("verify");
        setPin("");
        setNewPin("");
        setConfirmPin("");
        return;
      }

      writeToken(user.id, result.session_token);
      toast.success("PIN atualizado com sucesso");
      setIsDefaultPin(false);
      setUnlocked(true);
    } catch (error) {
      console.error("Error updating PIN:", error);
      toast.error("Erro ao atualizar PIN");
    } finally {
      setBusy(false);
    }
  };

  const handleForgotPin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^\d{4}$/.test(newPin)) {
      toast.error("O PIN deve ter 4 dígitos");
      return;
    }
    if (newPin === "0000") {
      toast.error("Escolha um PIN diferente do padrão");
      return;
    }
    if (newPin !== confirmPin) {
      toast.error("Os PINs não coincidem");
      return;
    }
    if (resetPassword.length < 8) {
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
        // Se a RPC não existir ou der erro, mostra mensagem amigável
        const msg = error.message?.toLowerCase() || "";
        if (msg.includes("senha") || msg.includes("password") || msg.includes("incorrect")) {
          toast.error("Senha atual incorreta");
        } else {
          toast.error(error.message || "Erro ao redefinir PIN");
        }
        return;
      }

      writeToken(user.id, ""); // limpa token antigo
      setResetPassword("");
      setNewPin("");
      setConfirmPin("");
      setMode("verify");
      toast.success("PIN redefinido. Agora entre com o novo PIN.");
    } catch (error) {
      console.error("Error resetting PIN:", error);
      toast.error("Erro ao redefinir PIN");
    } finally {
      setBusy(false);
    }
  };

  const title = mode === "change" ? "Defina seu novo PIN" : mode === "forgot" ? "Redefinir PIN" : "Acesso restrito";
  const description =
    mode === "change"
      ? "Por segurança, troque o PIN padrão antes de acessar a área administrativa."
      : mode === "forgot"
      ? "Digite sua senha atual e escolha um novo PIN de 4 dígitos."
      : "Digite o PIN de 4 dígitos para acessar esta área. PIN padrão: 0000.";

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
              />
            </div>
            <DialogFooter className="flex-col gap-2">
              <Button type="submit" className="w-full" disabled={busy || pin.length !== 4}>
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Entrar"}
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

        {mode === "change" && (
          <form onSubmit={handleChange} className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="newpin">Novo PIN</Label>
              <Input
                id="newpin"
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
            <DialogFooter>
              <Button type="submit" className="w-full" disabled={busy}>
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Salvar novo PIN"}
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

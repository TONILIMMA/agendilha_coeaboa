import { useEffect, useState, type ReactNode } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Loader2, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

const DEFAULT_PIN = "0000";
const SESSION_KEY = "admin_pin_unlocked";

function pinKey(userId: string) {
  return `admin_pin_${userId}`;
}

/**
 * Gate de PIN para áreas sensíveis (ex: Usuários).
 * - PIN padrão: 0000
 * - No primeiro acesso (PIN ainda padrão), exige troca obrigatória.
 * - Desbloqueio persiste por sessão (sessionStorage).
 */
export default function AdminPinGate({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [unlocked, setUnlocked] = useState(false);
  const [pin, setPin] = useState("");
  const [newPin, setNewPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [mustChange, setMustChange] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!user) return;
    if (sessionStorage.getItem(SESSION_KEY) === user.id) {
      setUnlocked(true);
    }
  }, [user]);

  if (!user) return null;
  if (unlocked) return <>{children}</>;

  const storedPin = localStorage.getItem(pinKey(user.id)) ?? DEFAULT_PIN;
  const isDefaultPin = storedPin === DEFAULT_PIN;

  const handleVerify = (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    if (pin !== storedPin) {
      toast.error("PIN incorreto");
      setPin("");
      setBusy(false);
      return;
    }
    if (isDefaultPin) {
      setMustChange(true);
      setBusy(false);
      return;
    }
    sessionStorage.setItem(SESSION_KEY, user.id);
    setUnlocked(true);
    setBusy(false);
  };

  const handleChange = (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^\d{4}$/.test(newPin)) {
      toast.error("O PIN deve ter 4 dígitos");
      return;
    }
    if (newPin === DEFAULT_PIN) {
      toast.error("Escolha um PIN diferente do padrão");
      return;
    }
    if (newPin !== confirmPin) {
      toast.error("Os PINs não coincidem");
      return;
    }
    localStorage.setItem(pinKey(user.id), newPin);
    sessionStorage.setItem(SESSION_KEY, user.id);
    toast.success("PIN atualizado com sucesso");
    setUnlocked(true);
  };

  return (
    <Dialog open modal>
      <DialogContent className="sm:max-w-sm" onInteractOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-primary" />
            {mustChange ? "Defina seu novo PIN" : "Acesso restrito"}
          </DialogTitle>
          <DialogDescription>
            {mustChange
              ? "Por segurança, troque o PIN padrão antes de acessar a área de Usuários."
              : "Digite o PIN de 4 dígitos para acessar Usuários. PIN padrão: 0000."}
          </DialogDescription>
        </DialogHeader>

        {!mustChange ? (
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
            <DialogFooter>
              <Button type="submit" className="w-full" disabled={busy || pin.length !== 4}>
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Entrar"}
              </Button>
            </DialogFooter>
          </form>
        ) : (
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
              <Button type="submit" className="w-full">Salvar novo PIN</Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}

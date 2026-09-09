import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/ui/PasswordInput";
import { Loader2, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { handleError } from "@/lib/error-handler";
import { onlyPinDigits, validatePin } from "@/lib/pin";

/**
 * PIN de recuperação (4 dígitos) do próprio usuário.
 * É o que permite redefinir a senha sozinho, sem depender de administrador.
 */
export function RecoveryPinSection() {
  const [hasPin, setHasPin] = useState<boolean | null>(null);
  const [password, setPassword] = useState("");
  const [pin, setPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    supabase.rpc("user_pin_status").then(({ data, error }) => {
      if (cancelled) return;
      setHasPin(error ? false : !!data);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const problem = validatePin(pin, confirmPin);
    if (problem) {
      toast.error(problem);
      return;
    }
    if (password.length < 6) {
      toast.error("Confirme a senha da sua conta para salvar o PIN.");
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase.rpc("set_user_pin", {
        new_pin: pin,
        current_password: password,
      });
      if (error) {
        toast.error(error.message || "Não deu pra salvar o PIN. Tenta de novo.");
        return;
      }
      setPassword("");
      setPin("");
      setConfirmPin("");
      setHasPin(true);
      toast.success("PIN salvo! Guarde bem esses 4 números.", {
        description: "É com ele que você recupera o acesso sozinho.",
      });
    } catch (error) {
      handleError(error, { context: "RecoveryPinSection.save", fallback: "Não deu pra salvar o PIN." });
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex items-start gap-2 rounded-xl border border-border bg-muted/40 p-3">
        <ShieldCheck className="h-4 w-4 text-primary mt-0.5 shrink-0" />
        <p className="text-xs text-muted-foreground">
          {hasPin === null
            ? "Conferindo se você já tem PIN…"
            : hasPin
            ? "Você já tem um PIN cadastrado. Pode trocar quando quiser — é só confirmar a senha."
            : "Você ainda não tem PIN. Cadastre agora pra conseguir redefinir sua senha na hora, sem falar com ninguém."}
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="pin-current-password">Senha da conta</Label>
        <PasswordInput
          id="pin-current-password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Sua senha de login"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label htmlFor="new-pin">{hasPin ? "Novo PIN" : "PIN"}</Label>
          <Input
            id="new-pin"
            name="new-pin"
            type="password"
            inputMode="numeric"
            autoComplete="off"
            maxLength={4}
            value={pin}
            onChange={(e) => setPin(onlyPinDigits(e.target.value))}
            placeholder="••••"
            className="text-center text-xl tracking-[0.4em]"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="confirm-pin">Confirmar</Label>
          <Input
            id="confirm-pin"
            name="confirm-pin"
            type="password"
            inputMode="numeric"
            autoComplete="off"
            maxLength={4}
            value={confirmPin}
            onChange={(e) => setConfirmPin(onlyPinDigits(e.target.value))}
            placeholder="••••"
            className="text-center text-xl tracking-[0.4em]"
          />
        </div>
      </div>
      <p className="text-[10px] text-muted-foreground">Exatamente 4 números. Evite 0000, 1111 ou 1234.</p>

      <Button type="submit" disabled={saving} className="w-full font-display font-semibold">
        {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <ShieldCheck className="h-4 w-4 mr-2" />}
        {hasPin ? "Salvar novo PIN" : "Cadastrar meu PIN"}
      </Button>
    </form>
  );
}

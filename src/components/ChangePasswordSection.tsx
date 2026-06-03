import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/ui/PasswordInput";
import { PasswordStrengthMeter, calculatePasswordScore } from "@/components/PasswordStrengthMeter";
import { toast } from "sonner";
import { Loader2, KeyRound, ShieldCheck } from "lucide-react";

interface Props {
  /** When true, hides the "current password" field — used right after a temp-password login. */
  isTemporary?: boolean;
  /** Called after successful password change. */
  onSuccess?: () => void;
}

export function ChangePasswordSection({ isTemporary = false, onSuccess }: Props) {
  const { user } = useAuth();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user?.email) {
      toast.error("Sessão inválida");
      return;
    }
    if (newPassword.length < 8) {
      toast.error("Senha muito curta", { description: "Use no mínimo 8 caracteres." });
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
    if (!isTemporary && newPassword === currentPassword) {
      toast.error("A nova senha deve ser diferente da atual");
      return;
    }

    setSubmitting(true);
    try {
      if (!isTemporary) {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: user.email,
          password: currentPassword,
        });
        if (signInError) {
          toast.error("Senha atual incorreta");
          setSubmitting(false);
          return;
        }
      }

      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) {
        const msg = error.message || "";
        const isWeak = /weak|pwned|leaked|easy to guess|short/i.test(msg);
        toast.error(
          isWeak
            ? "Senha vazada ou muito fraca. Use uma combinação mais segura."
            : msg || "Erro ao atualizar senha",
        );
        setSubmitting(false);
        return;
      }

      // Clear must_change_password flag
      await supabase
        .from("profiles")
        .update({ must_change_password: false })
        .eq("user_id", user.id);

      toast.success("Senha alterada!", {
        description: "Sua nova senha já está ativa.",
      });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      onSuccess?.();
    } catch (err) {
      toast.error("Erro ao alterar senha", {
        description: (err as Error).message,
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {isTemporary && (
        <div className="flex items-start gap-2 rounded-lg border border-primary/20 bg-primary/5 p-3 text-xs text-foreground">
          <ShieldCheck className="h-4 w-4 text-primary mt-0.5 shrink-0" />
          <p>
            Você entrou com uma <strong>senha temporária</strong>. Defina uma nova senha
            para continuar usando o app.
          </p>
        </div>
      )}

      {!isTemporary && (
        <div className="space-y-2">
          <Label htmlFor="current-password">Senha atual</Label>
          <PasswordInput
            id="current-password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            required
            autoComplete="current-password"
            placeholder="Digite sua senha atual"
          />
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="new-password">Nova senha</Label>
        <PasswordInput
          id="new-password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          required
          minLength={8}
          autoComplete="new-password"
          placeholder="Mínimo 8 caracteres"
        />
        <PasswordStrengthMeter password={newPassword} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="confirm-password">Confirmar nova senha</Label>
        <PasswordInput
          id="confirm-password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
          minLength={8}
          autoComplete="new-password"
          placeholder="Repita a nova senha"
        />
      </div>

      <Button
        type="submit"
        disabled={submitting}
        className="w-full gradient-sunset text-primary-foreground font-display font-semibold"
      >
        {submitting ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <KeyRound className="mr-2 h-4 w-4" />
        )}
        Alterar senha
      </Button>
    </form>
  );
}
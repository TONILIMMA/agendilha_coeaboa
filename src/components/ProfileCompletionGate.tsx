import { useState } from "react";
import { useProfile } from "@/hooks/useProfile";
import { useAuth } from "@/contexts/AuthContext";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2, AlertTriangle } from "lucide-react";

function formatPhone(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  if (digits.length <= 2) return digits.length ? `(${digits}` : "";
  if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

interface Props {
  children: React.ReactNode;
}

export default function ProfileCompletionGate({ children }: Props) {
  const { user } = useAuth();
  const { profile, loaded, saveProfile } = useProfile();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [saving, setSaving] = useState(false);
  const [nameError, setNameError] = useState("");
  const [phoneError, setPhoneError] = useState("");

  if (!user || !loaded) return <>{children}</>;

  const isComplete = profile.responsible_name?.trim() && profile.phone?.trim();

  if (isComplete) return <>{children}</>;

  const validate = () => {
    let valid = true;
    const trimmedName = name.trim();
    const phoneDigits = phone.replace(/\D/g, "");

    if (!trimmedName || trimmedName.length < 2) {
      setNameError("O nome completo é obrigatório (mínimo 2 caracteres).");
      valid = false;
    } else if (!/^[A-Za-zÀ-ÿ\s'-]+$/.test(trimmedName)) {
      setNameError("O nome contém caracteres inválidos.");
      valid = false;
    } else {
      setNameError("");
    }

    if (!phoneDigits || phoneDigits.length < 10) {
      setPhoneError("O número de telefone é obrigatório (mínimo 10 dígitos).");
      valid = false;
    } else {
      setPhoneError("");
    }

    return valid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setSaving(true);
    await saveProfile({
      responsible_name: name.trim(),
      phone: phone.trim(),
    });
    setSaving(false);
    toast.success("Cadastro atualizado com sucesso! Bem-vindo ao AgendIlha.");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-xl border bg-card p-6 shadow-lg space-y-5">
        <div className="flex items-center gap-3 text-amber-500">
          <AlertTriangle className="h-6 w-6 shrink-0" />
          <h2 className="text-lg font-semibold text-foreground">
            Complete seu cadastro
          </h2>
        </div>

        <p className="text-sm text-muted-foreground">
          Para continuar usando o AgendIlha, preencha os campos obrigatórios
          abaixo. Esses dados são essenciais para a segurança e integridade do
          sistema.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="gate-name">Nome completo *</Label>
            <Input
              id="gate-name"
              placeholder="Seu nome completo"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={100}
              autoFocus
            />
            {nameError && (
              <p className="text-sm text-destructive">{nameError}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="gate-phone">Telefone / WhatsApp *</Label>
            <Input
              id="gate-phone"
              placeholder="(21) 98765-4321"
              value={phone}
              onChange={(e) => setPhone(formatPhone(e.target.value))}
              maxLength={16}
            />
            {phoneError && (
              <p className="text-sm text-destructive">{phoneError}</p>
            )}
          </div>

          <Button type="submit" className="w-full" disabled={saving}>
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Salvando…
              </>
            ) : (
              "Salvar e continuar"
            )}
          </Button>
        </form>
      </div>
    </div>
  );
}

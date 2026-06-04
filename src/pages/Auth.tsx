import { useState, useCallback } from "react";
import { cn } from "@/lib/utils";
import { Navigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/ui/PasswordInput";
import { handleError } from "@/lib/error-handler";
import { toast } from "sonner";
import { LogIn, UserPlus, Loader2, Phone, MapPin, Sparkles } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { RegistrationFlow } from "@/components/auth/RegistrationFlow";

export default function Auth() {
  const { user, loading } = useAuth();
  const [searchParams] = useSearchParams();
  const rawRedirect = searchParams.get("redirect") || "/";
  // Only allow same-origin relative paths to prevent open-redirect phishing.
  const redirect =
    rawRedirect.startsWith("/") && !rawRedirect.startsWith("//")
      ? rawRedirect
      : "/";

   const [mode, setMode] = useState<"login" | "signup">("login");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { signIn, signUp } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (user) return <Navigate to={redirect} replace />;

  function formatPhoneDisplay(value: string) {
    let digits = value.replace(/\D/g, "");
    
    // If it starts with 55 and has more than 11 digits, it's likely the prefix
    if (digits.startsWith("55") && digits.length > 11) {
      digits = digits.slice(2);
    }


    if (digits.length <= 2) return digits;
    if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
    if (digits.length <= 11) return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7, 11)}`;
  }

  function handlePhoneChange(e: React.ChangeEvent<HTMLInputElement>) {
    const value = e.target.value;
    const digits = value.replace(/\D/g, "");
    
    // Accept up to 13 digits (allowing +55) but format normally
    if (digits.length <= 13) {
      setPhone(formatPhoneDisplay(digits));
    }
  }

  function isValidPhone(value: string) {
    const digits = value.replace(/\D/g, "");
    // Accepts 10 or 11 digits (if prefix is removed) or up to 13 with +55
    return (digits.length >= 10 && digits.length <= 11) || (digits.startsWith("55") && digits.length >= 12 && digits.length <= 13);
  }


  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!isValidPhone(phone)) {
      toast.error("Número inválido", {
        description: "Por favor, insira um número de WhatsApp válido. Exemplo: (21) 98765-4321",
      });
      return;
    }

    setSubmitting(true);

    // Standardize phone for backend
    const cleanPhone = phone.replace(/\D/g, "");
    
    try {
      const { error } = await signIn(cleanPhone, password);

      if (error) {
        handleError(error, "Erro ao entrar");
      }
    } catch (err) {
      handleError(err, "Erro no processo de autenticação");
    } finally {
      setSubmitting(false);
    }
  }


  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-8rem)] bg-background px-4 py-8">
      <div className="w-full max-w-sm rounded-2xl bg-card shadow-elevated p-6 sm:p-8 space-y-6">
        <div className="text-center">
          <div className="flex flex-col items-center mb-4">
            <h1 className="font-display text-2xl font-black text-primary tracking-tight">
              AgendIlha
            </h1>
            <span className="text-[10px] text-secondary font-black uppercase tracking-widest">Coé a Boa?</span>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1 max-w-[280px] mx-auto">
            {mode === "login" 
              ? "Use seu WhatsApp para entrar na sua conta e salvar seus favoritos." 
              : "Cadastre-se para receber sugestões personalizadas de eventos baseadas no seu bairro e estilo musical."}
          </p>
        </div>

        {mode === "login" ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="phone" className="flex items-center gap-2">
                <Phone className="h-3.5 w-3.5 text-primary" />
                WhatsApp (Identificador da Conta)
              </Label>
              <Input
                id="phone"
                type="tel"
                value={phone}
                onChange={handlePhoneChange}
                required
                placeholder="(21) 98765-4321"
                className="h-11 sm:h-12 bg-muted/30 focus-visible:ring-primary/20"
              />
              <p className="text-[10px] text-muted-foreground">O DDD é obrigatório. Ex: 21 para o Rio. Prefixo +55 opcional.</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <PasswordInput
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                placeholder="Mínimo 6 caracteres"
              />
            </div>
            <div className="text-right">
              <a
                href="/forgot-password"
                className="text-[11px] font-bold text-primary hover:text-primary/80 transition-colors flex items-center justify-end gap-1"
              >
                Recuperar acesso pelo WhatsApp
              </a>
            </div>
            <Button
              type="submit"
              disabled={submitting}
              className="w-full gradient-sunset text-primary-foreground font-display font-semibold"
            >
              {submitting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <LogIn className="mr-2 h-4 w-4" />
              )}
              Entrar
            </Button>
          </form>
        ) : (
          <RegistrationFlow onComplete={() => setMode("login")} />
        )}

        <p className="text-center text-sm text-muted-foreground">
          {mode === "login" ? "Não tem conta?" : "Já tem conta?"}{" "}
          <button
            type="button"
            onClick={() => setMode(mode === "login" ? "signup" : "login")}
            className="text-primary font-medium hover:underline"
          >
            {mode === "login" ? "Cadastre-se" : "Faça login"}
          </button>
        </p>
      </div>
    </div>
  );
}

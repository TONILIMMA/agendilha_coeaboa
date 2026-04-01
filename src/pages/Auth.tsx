import { useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { LogIn, UserPlus, Loader2, KeyRound } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export default function Auth() {
  const { user, loading } = useAuth();
  const [mode, setMode] = useState<"login" | "signup" | "recovery">("login");
  const [email, setEmail] = useState("");
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

  if (user) return <Navigate to="/" replace />;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);

    if (mode === "recovery") {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth`,
      });
      setSubmitting(false);
      if (error) {
        toast.error("Erro ao enviar e-mail de recuperação", { description: error.message });
      } else {
        toast.success("E-mail enviado!", {
          description: "Verifique sua caixa de entrada para redefinir a senha.",
        });
        setMode("login");
      }
      return;
    }

    const { error } = mode === "login"
      ? await signIn(email, password)
      : await signUp(email, password);

    setSubmitting(false);

    if (error) {
      toast.error(mode === "login" ? "Erro ao entrar" : "Erro ao criar conta", {
        description: error.message,
      });
    } else if (mode === "signup") {
      toast.success("Conta criada!", {
        description: "Você já pode fazer login.",
      });
      setMode("login");
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-background px-4">
      <div className="w-full max-w-sm rounded-2xl bg-card shadow-elevated p-8 space-y-6">
        <div className="text-center">
          <h1 className="font-display text-2xl font-bold text-foreground">
            📌 AgendIlha
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {mode === "login" && "Entre na sua conta"}
            {mode === "signup" && "Crie sua conta"}
            {mode === "recovery" && "Recupere sua senha"}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">E-mail</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="seu@email.com"
            />
          </div>
          {mode !== "recovery" && (
            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                placeholder="Mínimo 6 caracteres"
              />
            </div>
          )}
          <Button
            type="submit"
            disabled={submitting}
            className="w-full gradient-sunset text-primary-foreground font-display font-semibold"
          >
            {submitting ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : mode === "login" ? (
              <LogIn className="mr-2 h-4 w-4" />
            ) : mode === "signup" ? (
              <UserPlus className="mr-2 h-4 w-4" />
            ) : (
              <KeyRound className="mr-2 h-4 w-4" />
            )}
            {mode === "login" && "Entrar"}
            {mode === "signup" && "Criar conta"}
            {mode === "recovery" && "Enviar e-mail de recuperação"}
          </Button>
        </form>

        {mode === "login" && (
          <button
            type="button"
            onClick={() => setMode("recovery")}
            className="block w-full text-center text-sm text-muted-foreground hover:text-primary transition-colors"
          >
            Esqueci minha senha
          </button>
        )}

        <p className="text-center text-sm text-muted-foreground">
          {mode === "login" ? "Não tem conta?" : mode === "signup" ? "Já tem conta?" : "Lembrou a senha?"}{" "}
          <button
            type="button"
            onClick={() => setMode(mode === "signup" ? "login" : mode === "login" ? "signup" : "login")}
            className="text-primary font-medium hover:underline"
          >
            {mode === "signup" ? "Faça login" : mode === "login" ? "Cadastre-se" : "Faça login"}
          </button>
        </p>
      </div>
    </div>
  );
}

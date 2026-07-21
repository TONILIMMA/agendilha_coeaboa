import { Link } from "react-router-dom";
import { ArrowLeft, ShieldCheck, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ForgotPassword() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-background px-4 py-8">
      <div className="w-full max-w-sm rounded-2xl bg-card shadow-elevated p-6 sm:p-8 space-y-6">
        <div className="text-center space-y-1">
          <h1 className="font-display text-2xl font-black text-primary tracking-tight">
            📌 AgendIlha
          </h1>
          <h2 className="text-sm font-bold text-foreground">Recuperar acesso</h2>
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground">
            Precisa entrar de novo?
          </p>
        </div>

        <div className="rounded-xl border border-border bg-muted/40 p-4 space-y-3 text-sm">
          <div className="flex items-start gap-2">
            <ShieldCheck className="h-5 w-5 text-primary mt-0.5 shrink-0" />
            <p className="text-muted-foreground">
              Pra sua segurança, a redefinição de senha agora é feita pela equipe. Assim ninguém entra na sua conta no seu lugar.
            </p>
          </div>
          <div className="flex items-start gap-2">
            <MessageCircle className="h-5 w-5 text-primary mt-0.5 shrink-0" />
            <p className="text-muted-foreground">
              Chama a gente no WhatsApp informando o número da sua conta. Confirmamos sua identidade e liberamos uma senha temporária novinha.
            </p>
          </div>
        </div>

        <Button asChild variant="outline" className="w-full">
          <Link to="/auth">
            <ArrowLeft className="h-4 w-4 mr-2" /> Voltar para o login
          </Link>
        </Button>
      </div>
    </div>
  );
}
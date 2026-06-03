import { useNavigate } from "react-router-dom";
import { ChangePasswordSection } from "@/components/ChangePasswordSection";
import { ShieldCheck } from "lucide-react";

export default function MustChangePassword() {
  const navigate = useNavigate();
  return (
    <div className="flex items-center justify-center min-h-screen bg-background px-4 py-8">
      <div className="w-full max-w-sm rounded-2xl bg-card shadow-elevated p-6 sm:p-8 space-y-6">
        <div className="text-center space-y-1">
          <div className="mx-auto h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
            <ShieldCheck className="h-6 w-6 text-primary" />
          </div>
          <h1 className="font-display text-xl font-black text-primary tracking-tight">
            Defina sua nova senha
          </h1>
          <p className="text-xs text-muted-foreground">
            Por segurança, troque a senha temporária antes de continuar.
          </p>
        </div>
        <ChangePasswordSection
          isTemporary
          onSuccess={() => navigate("/agenda", { replace: true })}
        />
      </div>
    </div>
  );
}
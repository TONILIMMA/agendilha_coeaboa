import { ChangePasswordSection } from "@/components/ChangePasswordSection";
import { RecoveryPinSection } from "@/components/auth/RecoveryPinSection";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { Card, CardContent } from "@/components/ui/card";
import { KeyRound, ShieldCheck } from "lucide-react";

export default function Settings() {
  return (
    <div className="space-y-6 max-w-xl mx-auto">
      <SectionHeader
        title="Configurações da conta"
        subtitle="Gerencie sua senha e preferências de segurança."
      />

      <Card>
        <CardContent className="p-5 sm:p-6 space-y-5">
          <div className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center">
              <KeyRound className="h-4 w-4 text-primary" />
            </div>
            <div>
              <h2 className="font-display font-bold text-base">Senha</h2>
              <p className="text-xs text-muted-foreground">
                Mantenha sua conta segura com uma senha forte.
              </p>
            </div>
          </div>
          <ChangePasswordSection />
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-5 sm:p-6 space-y-5">
          <div className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center">
              <ShieldCheck className="h-4 w-4 text-primary" />
            </div>
            <div>
              <h2 className="font-display font-bold text-base">PIN de recuperação</h2>
              <p className="text-xs text-muted-foreground">
                4 números que liberam a redefinição da sua senha na hora.
              </p>
            </div>
          </div>
          <RecoveryPinSection />
        </CardContent>
      </Card>
    </div>
  );
}
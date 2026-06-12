import { ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StepProgress } from "./StepProgress";

interface Props {
  title: string;
  subtitle?: string;
  step: number;
  totalSteps: number;
  children: ReactNode;
  onBack: () => void;
  onNext: () => void;
  nextLabel?: string;
  loading?: boolean;
  canGoNext?: boolean;
  isLast?: boolean;
}

export function WizardShell({
  title,
  subtitle,
  step,
  totalSteps,
  children,
  onBack,
  onNext,
  nextLabel,
  loading,
  canGoNext = true,
  isLast,
}: Props) {
  const navigate = useNavigate();

  const handleBack = () => {
    if (step === 1) navigate("/cadastro");
    else onBack();
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50/40 via-background to-background">
      <div className="mx-auto max-w-md px-4 py-6 sm:py-10 space-y-6">
        <button
          onClick={handleBack}
          className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar
        </button>

        <StepProgress current={step} total={totalSteps} />

        <div className="space-y-2">
          <h1 className="text-2xl sm:text-3xl font-black font-display text-foreground leading-tight">
            {title}
          </h1>
          {subtitle && (
            <p className="text-base text-muted-foreground">{subtitle}</p>
          )}
        </div>

        <div className="space-y-5">{children}</div>

        <Button
          onClick={onNext}
          disabled={!canGoNext || loading}
          className="w-full h-14 text-base font-bold rounded-full gradient-sunset shadow-lg"
        >
          {loading ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            nextLabel ?? (isLast ? "Finalizar cadastro" : "Continuar")
          )}
        </Button>
      </div>
    </div>
  );
}
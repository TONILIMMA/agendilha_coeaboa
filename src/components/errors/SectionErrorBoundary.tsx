import { ReactNode } from "react";
import { AppErrorBoundary } from "@/components/AppErrorBoundary";
import { InlineError } from "@/components/errors/InlineError";

interface SectionErrorBoundaryProps {
  children: ReactNode;
  /** Contexto pra log (ex.: "AdminEvents.list"). */
  context?: string;
  /** Mensagem exibida no fallback. */
  title?: string;
  description?: string;
  /** Handler custom pro botão "Tentar de novo". */
  onReset?: () => void;
}

/**
 * Boundary escopado a uma seção/rota. Diferente do AppErrorBoundary global,
 * renderiza um InlineError ao invés de tomar a tela toda.
 */
export function SectionErrorBoundary({ children, context, title, description, onReset }: SectionErrorBoundaryProps) {
  return (
    <AppErrorBoundary
      context={context}
      onReset={onReset}
      fallback={({ error, reset }) => (
        <div className="p-4">
          <InlineError
            error={error ?? undefined}
            title={title}
            description={description}
            onRetry={reset}
          />
        </div>
      )}
    >
      {children}
    </AppErrorBoundary>
  );
}
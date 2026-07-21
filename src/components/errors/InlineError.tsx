import { AlertTriangle, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { getErrorMessage } from "@/lib/error-handler";

interface InlineErrorProps {
  /** Erro cru — será classificado pra mensagem amigável. */
  error?: unknown;
  /** Sobrescreve a mensagem principal. */
  title?: string;
  /** Descrição extra opcional. */
  description?: string;
  /** Handler pra "Tentar de novo". Se ausente, o botão não aparece. */
  onRetry?: () => void;
  /** Rótulo do botão de retry. */
  retryLabel?: string;
  className?: string;
  /** Variante compacta pra usar dentro de cards pequenos. */
  compact?: boolean;
}

/**
 * Fallback visual pra erros de seção/card. Usa o mesmo classificador do
 * handleError, mas sem toast — pra não empilhar mensagem duplicada.
 */
export function InlineError({
  error,
  title,
  description,
  onRetry,
  retryLabel = "Tentar de novo",
  className,
  compact,
}: InlineErrorProps) {
  const message = title ?? (error ? getErrorMessage(error) : "Deu ruim carregando aqui.");

  return (
    <div
      role="alert"
      className={cn(
        "rounded-lg border border-destructive/30 bg-destructive/5 text-foreground",
        compact ? "p-3" : "p-4",
        "flex gap-3 items-start",
        className,
      )}
    >
      <AlertTriangle className={cn("text-destructive shrink-0", compact ? "h-4 w-4 mt-0.5" : "h-5 w-5 mt-0.5")} />
      <div className="flex-1 min-w-0 space-y-2">
        <div className="space-y-1">
          <p className={cn("font-medium leading-tight", compact ? "text-sm" : "text-base")}>{message}</p>
          {description && <p className="text-xs text-muted-foreground">{description}</p>}
        </div>
        {onRetry && (
          <Button size="sm" variant="outline" onClick={onRetry} className="gap-1.5">
            <RotateCcw className="h-3.5 w-3.5" />
            {retryLabel}
          </Button>
        )}
      </div>
    </div>
  );
}
import { AlertTriangle, CheckCircle2 } from "lucide-react";
import type { AutofillIssue } from "@/lib/autofillValidation";

/**
 * Painel de conferência do autopreenchimento: mostra o que ainda precisa
 * de ajuste antes de enviar. Erros bloqueiam, avisos são só pra conferir.
 */
export function AutofillIssues({
  issues,
  okMessage = "Tudo certo por aqui — pode seguir.",
  title = "Confere esses pontos antes de enviar",
}: {
  issues: AutofillIssue[];
  okMessage?: string;
  title?: string;
}) {
  const safeIssues = issues || [];

  if (safeIssues.length === 0) {
    return (
      <div
        data-testid="autofill-ok"
        className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-700 dark:text-emerald-400 flex items-center gap-2"
      >
        <CheckCircle2 className="h-4 w-4 shrink-0" />
        <span>{okMessage}</span>
      </div>
    );
  }

  const hasError = safeIssues.some((i) => i.level === "error");

  return (
    <div
      role="alert"
      data-testid="autofill-issues"
      className={
        "rounded-lg border px-3 py-2 text-xs space-y-1.5 " +
        (hasError
          ? "border-destructive/30 bg-destructive/5 text-destructive"
          : "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-400")
      }
    >
      <p className="font-semibold flex items-center gap-2">
        <AlertTriangle className="h-4 w-4 shrink-0" />
        {title}
      </p>
      <ul className="space-y-1 pl-6 list-disc">
        {safeIssues.map((i) => (
          <li key={`${i.field}-${i.message}`}>
            <span className="font-medium">{i.label}:</span> {i.message}
          </li>
        ))}
      </ul>
    </div>
  );
}

import { UseFormReturn } from "react-hook-form";
import { CheckCircle2, XCircle, ListChecks } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface Item {
  key: string;
  label: string;
  ok: boolean;
  step: number;
}

function useItems(form: UseFormReturn<any>): Item[] {
  const title = form.watch("eventTitle");
  const date = form.watch("date");
  const startTime = form.watch("startTime");
  const locationName = form.watch("locationName");
  const eventAddress = form.watch("eventAddress");
  const has = (v: unknown) => typeof v === "string" && v.trim().length > 0;
  return [
    { key: "title", label: "Título do rolê", ok: has(title), step: 3 },
    { key: "date", label: "Data", ok: has(date), step: 3 },
    { key: "time", label: "Horário", ok: has(startTime), step: 3 },
    { key: "location", label: "Local (nome e endereço)", ok: has(locationName) && has(eventAddress), step: 3 },
  ];
}

/**
 * Checklist ao vivo dos 4 campos mínimos exigidos para aprovar, publicar ou agendar.
 * Atualiza em tempo real conforme o promotor preenche o formulário.
 */
export function PublishChecklist({
  form,
  goToStep,
  variant = "full",
  className,
}: {
  form: UseFormReturn<any>;
  goToStep?: (step: number) => void;
  variant?: "full" | "compact";
  className?: string;
}) {
  const items = useItems(form);
  const missing = items.filter((i) => !i.ok).length;
  const allOk = missing === 0;

  if (variant === "compact") {
    return (
      <div
        className={cn(
          "flex flex-wrap items-center gap-2 rounded-md border px-3 py-2 text-xs",
          allOk
            ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-900 dark:text-emerald-200"
            : "border-amber-500/40 bg-amber-500/10 text-amber-900 dark:text-amber-200",
          className,
        )}
        role="status"
        aria-live="polite"
      >
        <ListChecks className="h-3.5 w-3.5 shrink-0" aria-hidden />
        <span className="font-medium">
          {allOk ? "Pronto pra publicar" : `Falta ${missing} pra publicar:`}
        </span>
        <div className="flex flex-wrap gap-1.5">
          {items.map((i) => (
            <button
              key={i.key}
              type="button"
              onClick={goToStep ? () => goToStep(i.step) : undefined}
              className={cn(
                "inline-flex items-center gap-1 rounded-full border px-2 py-0.5",
                i.ok
                  ? "border-emerald-500/40 bg-background/60 text-emerald-700 dark:text-emerald-300"
                  : "border-amber-500/40 bg-background/60 text-amber-800 dark:text-amber-200",
                goToStep && !i.ok && "hover:bg-background cursor-pointer",
                !goToStep && "cursor-default",
              )}
              aria-label={`${i.label} ${i.ok ? "preenchido" : "faltando"}`}
            >
              {i.ok ? <CheckCircle2 className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
              {i.label}
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "rounded-lg border p-4 space-y-3",
        allOk ? "border-emerald-500/40 bg-emerald-500/5" : "border-amber-500/40 bg-amber-500/5",
        className,
      )}
      role="status"
      aria-live="polite"
    >
      <div className="flex items-center gap-2">
        <ListChecks className="h-4 w-4 text-primary" aria-hidden />
        <h3 className="font-bold text-sm">
          {allOk
            ? "Tudo certo pra enviar, aprovar, publicar ou agendar"
            : "Antes de enviar, complete esses itens"}
        </h3>
      </div>
      <ul className="space-y-2" aria-label="Campos obrigatórios">
        {items.map((i) => (
          <li key={i.key} className="flex items-center justify-between gap-3 text-sm">
            <span className="flex items-center gap-2">
              {i.ok ? (
                <CheckCircle2 className="h-4 w-4 text-emerald-500" aria-hidden />
              ) : (
                <XCircle className="h-4 w-4 text-destructive" aria-hidden />
              )}
              <span
                className={cn(
                  i.ok ? "text-muted-foreground line-through" : "font-medium text-foreground",
                )}
              >
                {i.label}
              </span>
            </span>
            {!i.ok && goToStep && (
              <Button
                type="button"
                variant="link"
                size="sm"
                className="h-auto p-0 text-primary"
                onClick={() => goToStep(i.step)}
              >
                Preencher →
              </Button>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
import { cn } from "@/lib/utils";

interface Props {
  current: number; // 1-based
  total: number;
  label?: string;
}

export function StepProgress({ current, total, label }: Props) {
  const pct = Math.round((current / total) * 100);
  return (
    <div className="w-full space-y-2">
      <div className="flex items-center justify-between text-sm font-medium text-muted-foreground">
        <span>
          Etapa {current} de {total}
        </span>
        {label && <span className="text-xs">{label}</span>}
      </div>
      <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
        <div
          className={cn("h-full bg-primary transition-all duration-300")}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
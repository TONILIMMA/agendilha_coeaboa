import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface PageHeaderProps {
  eyebrow?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  className?: string;
}

/**
 * Cabeçalho padrão de páginas internas (admin/promotor).
 * Título grande, subtítulo opcional e slot para ações à direita.
 */
export function PageHeader({ eyebrow, title, description, actions, className }: PageHeaderProps) {
  return (
    <header className={cn("flex flex-col md:flex-row md:items-end justify-between gap-4 flex-wrap", className)}>
      <div className="space-y-1">
        {eyebrow}
        <h1 className="text-2xl sm:text-3xl font-black font-display tracking-tight text-foreground">
          {title}
        </h1>
        {description && (
          <p className="text-sm text-muted-foreground max-w-2xl">{description}</p>
        )}
      </div>
      {actions && <div className="flex items-center gap-2 flex-wrap">{actions}</div>}
    </header>
  );
}
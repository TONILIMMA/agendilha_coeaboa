import { LucideIcon, SearchX } from "lucide-react";
import { Button } from "./button";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export function EmptyState({
  icon: Icon = SearchX,
  title,
  description,
  actionLabel,
  onAction,
  className
}: EmptyStateProps) {
  return (
    <div className={cn(
      "flex flex-col items-center justify-center text-center p-8 border-2 border-dashed border-muted rounded-3xl gap-4 bg-muted/5 animate-fade-in",
      className
    )}>
      <div className="h-16 w-16 rounded-full bg-muted/20 flex items-center justify-center text-muted-foreground">
        <Icon className="h-8 w-8" />
      </div>
      <div className="space-y-1 max-w-[280px]">
        <h3 className="text-lg font-bold text-foreground leading-tight">{title}</h3>
        {description && <p className="text-sm text-muted-foreground">{description}</p>}
      </div>
      {actionLabel && onAction && (
        <Button onClick={onAction} className="rounded-full px-6 font-bold shadow-sm">
          {actionLabel}
        </Button>
      )}
    </div>
  );
}

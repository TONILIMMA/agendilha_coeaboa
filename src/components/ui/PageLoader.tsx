import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface PageLoaderProps {
  className?: string;
  size?: "sm" | "md" | "lg";
  label?: string;
  inline?: boolean;
}

const sizeMap = {
  sm: "h-4 w-4",
  md: "h-6 w-6",
  lg: "h-8 w-8",
};

export function PageLoader({ className, size = "lg", label, inline = false }: PageLoaderProps) {
  if (inline) {
    return <Loader2 className={cn(sizeMap[size], "animate-spin", className)} aria-label={label ?? "Carregando"} />;
  }
  return (
    <div className={cn("flex flex-col items-center justify-center gap-3 py-12", className)} role="status" aria-live="polite">
      <Loader2 className={cn(sizeMap[size], "animate-spin text-primary")} />
      {label && <p className="text-sm text-muted-foreground">{label}</p>}
    </div>
  );
}
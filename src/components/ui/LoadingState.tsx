import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface LoadingStateProps {
  message?: string;
  fullPage?: boolean;
  className?: string;
}

export function LoadingState({ 
  message = "Buscando o rolê...", 
  fullPage = false,
  className 
}: LoadingStateProps) {
  return (
    <div className={cn(
      "flex flex-col items-center justify-center gap-4 animate-fade-in",
      fullPage ? "min-h-[60vh] w-full" : "py-12",
      className
    )}>
      <div className="relative">
        <Loader2 className="h-10 w-10 animate-spin text-primary opacity-20" />
        <Loader2 className="h-10 w-10 animate-spin text-primary absolute inset-0" style={{ animationDuration: '3s' }} />
      </div>
      <p className="text-sm font-medium text-muted-foreground animate-pulse">{message}</p>
    </div>
  );
}

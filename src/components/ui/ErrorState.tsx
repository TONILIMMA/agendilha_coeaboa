import { AlertCircle, RefreshCcw } from "lucide-react";
import { Button } from "./button";
import { cn } from "@/lib/utils";
import { Alert, AlertDescription, AlertTitle } from "./alert";

interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  className?: string;
}

export function ErrorState({
  title = "A conexão fugiu",
  message = "Não rolou carregar agora. Confere a internet e tenta de novo.",
  onRetry,
  className
}: ErrorStateProps) {
  return (
    <div className={cn("space-y-6 animate-fade-in", className)}>
      <Alert variant="destructive" className="bg-rose-50 border-rose-200">
        <AlertCircle className="h-5 w-5 text-rose-600" />
        <AlertTitle className="text-rose-800 font-bold">{title}</AlertTitle>
        <AlertDescription className="text-rose-700">
          {message}
        </AlertDescription>
      </Alert>
      
      {onRetry && (
        <div className="flex justify-center py-4">
          <Button onClick={onRetry} variant="outline" className="gap-2 rounded-full border-slate-200 hover:bg-slate-50">
            <RefreshCcw className="h-4 w-4" />
            Tentar novamente
          </Button>
        </div>
      )}
    </div>
  );
}

import React, { Component, ErrorInfo, ReactNode } from "react";
import { Button } from "./ui/button";
import { AlertCircle, RotateCcw } from "lucide-react";
import { logger } from "@/lib/logger";

interface Props {
  children: ReactNode;
  /** Título exibido no fallback. */
  title?: string;
  /** Mensagem exibida abaixo do título. */
  description?: string;
  /** Renderiza um fallback customizado ao invés do padrão. */
  fallback?: (args: { error: Error | null; reset: () => void }) => ReactNode;
  /** Callback pra reset custom (default: window.location.href = origin). */
  onReset?: () => void;
  /** Contexto pra facilitar log (ex: "AdminEvents"). */
  context?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class AppErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    logger.error(
      this.props.context ? `[${this.props.context}] Uncaught error:` : "Uncaught error:",
      error,
      errorInfo,
    );
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    if (this.props.onReset) {
      this.props.onReset();
    } else {
      window.location.href = window.location.origin;
    }
  };


  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback({ error: this.state.error, reset: this.handleReset });
      }
      const title = this.props.title ?? "Ops, algo travou aqui.";
      const description =
        this.props.description ??
        "Deu ruim carregando essa tela. Tenta recarregar — se persistir, chama a gente no WhatsApp.";
      return (
        <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-background text-foreground">
          <div className="max-w-md w-full space-y-6 text-center">
            <div className="flex justify-center">
              <div className="p-4 bg-destructive/10 rounded-full">
                <AlertCircle className="h-12 w-12 text-destructive" />
              </div>
            </div>
            <div className="space-y-2">
              <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
              <p className="text-muted-foreground text-sm">{description}</p>
            </div>
            {process.env.NODE_ENV === "development" && (
              <pre className="p-4 bg-muted rounded-lg text-left text-xs overflow-auto max-h-40">
                {this.state.error?.message}
              </pre>
            )}
            <Button onClick={this.handleReset} className="w-full gap-2" size="lg">
              <RotateCcw className="h-4 w-4" />
              Tentar de novo
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}


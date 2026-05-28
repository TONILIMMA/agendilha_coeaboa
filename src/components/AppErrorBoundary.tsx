import React, { Component, ErrorInfo, ReactNode } from "react";
import { Button } from "./ui/button";
import { AlertCircle, RotateCcw } from "lucide-react";

interface Props {
  children: ReactNode;
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
    console.error("Uncaught error:", error, errorInfo);
    // Here you could send the error to an analytics service like Sentry
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    // Try to navigate to home instead of full reload first, if that fails, full reload
    window.location.href = window.location.origin;
  };


  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-background text-foreground">
          <div className="max-w-md w-full space-y-6 text-center">
            <div className="flex justify-center">
              <div className="p-4 bg-destructive/10 rounded-full">
                <AlertCircle className="h-12 w-12 text-destructive" />
              </div>
            </div>
            <div className="space-y-2">
              <h1 className="text-2xl font-bold tracking-tight">Ops! Algo deu errado.</h1>
              <p className="text-muted-foreground text-sm">
                Ocorreu um erro inesperado na aplicação. Já notificamos nossa equipe técnica.
              </p>
            </div>
            {process.env.NODE_ENV === "development" && (
              <pre className="p-4 bg-muted rounded-lg text-left text-xs overflow-auto max-h-40">
                {this.state.error?.message}
              </pre>
            )}
            <Button onClick={this.handleReset} className="w-full gap-2" size="lg">
              <RotateCcw className="h-4 w-4" />
              Recarregar página
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}


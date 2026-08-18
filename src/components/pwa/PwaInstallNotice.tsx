import React, { useEffect, useState } from "react";
import { Download, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function PwaInstallNotice() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    const dismissed = localStorage.getItem("pwa-install-dismissed");
    if (dismissed) {
      setIsDismissed(true);
      return;
    }

    const handler = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsVisible(true);
    };

    window.addEventListener("beforeinstallprompt", handler);

    // Check if already installed
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setIsVisible(false);
    }

    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setIsVisible(false);
    }
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setIsVisible(false);
    setIsDismissed(true);
    localStorage.setItem("pwa-install-dismissed", "true");
  };

  if (!isVisible || isDismissed) return null;

  return (
    <div className="fixed bottom-20 left-4 right-4 z-50 animate-in fade-in slide-in-from-bottom-4 duration-500 md:max-w-sm md:left-auto">
      <div className="bg-card border border-border/60 shadow-xl rounded-2xl p-4 backdrop-blur-md">
        <div className="flex items-start gap-3">
          <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
            <Download className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0 pr-6">
            <h4 className="font-bold text-sm tracking-tight">Agenda na sua tela</h4>
            <p className="text-xs text-muted-foreground leading-relaxed mt-0.5">
              Tenha o AgendIlha sempre à mão. Instale agora no seu celular.
            </p>
          </div>
          <button 
            onClick={handleDismiss}
            className="absolute top-3 right-3 p-1 text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="flex gap-2 mt-4">
          <Button 
            size="sm" 
            className="flex-1 rounded-full h-9 font-bold text-xs"
            onClick={handleInstall}
          >
            Instalar agora
          </Button>
          <Button 
            size="sm" 
            variant="ghost" 
            className="rounded-full h-9 font-bold text-xs"
            onClick={handleDismiss}
          >
            Depois
          </Button>
        </div>
      </div>
    </div>
  );
}

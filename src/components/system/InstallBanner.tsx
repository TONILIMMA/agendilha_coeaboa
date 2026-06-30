import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Download, X } from "lucide-react";

const DISMISS_KEY = "agendilha_install_dismissed_until";
const SNOOZE_DAYS = 14;

interface BIPEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

function isStandalone(): boolean {
  if (typeof window === "undefined") return false;
  if (window.matchMedia?.("(display-mode: standalone)").matches) return true;
  // iOS Safari
  // @ts-expect-error - non-standard
  if (window.navigator.standalone === true) return true;
  return false;
}

function isSnoozed(): boolean {
  try {
    const until = localStorage.getItem(DISMISS_KEY);
    if (!until) return false;
    return Date.now() < Number(until);
  } catch {
    return false;
  }
}

/**
 * Banner discreto no rodapé: oferece instalar o app como PWA.
 * Usa `beforeinstallprompt` (Chrome/Edge/Android). Em iOS, mostra instrução manual.
 */
export function InstallBanner() {
  const [deferred, setDeferred] = useState<BIPEvent | null>(null);
  const [visible, setVisible] = useState(false);
  const [iosHint, setIosHint] = useState(false);

  useEffect(() => {
    if (isStandalone() || isSnoozed()) return;

    const onBIP = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BIPEvent);
      setVisible(true);
    };
    window.addEventListener("beforeinstallprompt", onBIP);

    // iOS fallback (Safari não dispara beforeinstallprompt)
    const ua = navigator.userAgent;
    const isIOS = /iPad|iPhone|iPod/.test(ua) && !/CriOS|FxiOS/.test(ua);
    if (isIOS) {
      const t = setTimeout(() => {
        setIosHint(true);
        setVisible(true);
      }, 4000);
      return () => {
        window.removeEventListener("beforeinstallprompt", onBIP);
        clearTimeout(t);
      };
    }

    return () => window.removeEventListener("beforeinstallprompt", onBIP);
  }, []);

  const dismiss = () => {
    try {
      const until = Date.now() + SNOOZE_DAYS * 24 * 60 * 60 * 1000;
      localStorage.setItem(DISMISS_KEY, String(until));
    } catch {
      /* ignore */
    }
    setVisible(false);
  };

  const install = async () => {
    if (!deferred) return;
    await deferred.prompt();
    await deferred.userChoice.catch(() => undefined);
    setVisible(false);
    setDeferred(null);
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-3 inset-x-3 z-[60] mx-auto max-w-md rounded-2xl border border-border bg-card/95 backdrop-blur-md shadow-lg p-3 flex items-center gap-3 animate-in slide-in-from-bottom-4">
      <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
        <Download className="h-5 w-5" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold leading-tight">Instale o AgendIlha no celular</p>
        <p className="text-xs text-muted-foreground leading-snug">
          {iosHint
            ? "No Safari, toque em Compartilhar e depois em 'Adicionar à Tela de Início'."
            : "Abre direto do ícone, sem precisar do navegador."}
        </p>
      </div>
      {!iosHint && deferred && (
        <Button size="sm" onClick={install} className="shrink-0">Instalar</Button>
      )}
      <Button
        variant="ghost"
        size="icon"
        onClick={dismiss}
        aria-label="Dispensar"
        className="h-8 w-8 shrink-0 text-muted-foreground"
      >
        <X className="h-4 w-4" />
      </Button>
    </div>
  );
}
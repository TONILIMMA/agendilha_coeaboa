import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Sparkles, CheckCircle2 } from "lucide-react";
import { APP_VERSION, UPDATES } from "@/lib/changelog";

const STORAGE_KEY = "agendilha_last_seen_version";

/**
 * Mostra um modal pequeno e amigável a cada nova versão (uma vez por usuário).
 */
export function UpdateAnnouncement() {
  const [open, setOpen] = useState(false);
  const { pathname } = useLocation();
  const current = UPDATES.find((u) => u.version === APP_VERSION) ?? UPDATES[0];

  // Nas telas de entrar/cadastrar o modal só atrapalha quem tá tentando criar conta.
  const blockedRoute = /^\/(auth|forgot-password|cadastro)/.test(pathname);

  useEffect(() => {
    if (blockedRoute) return;
    try {
      const last = localStorage.getItem(STORAGE_KEY);
      if (last !== APP_VERSION) {
        // Pequeno atraso para não bater junto com o load inicial
        const t = setTimeout(() => setOpen(true), 800);
        return () => clearTimeout(t);
      }
    } catch {
      /* ignore */
    }
  }, [blockedRoute]);

  const dismiss = () => {
    try {
      localStorage.setItem(STORAGE_KEY, APP_VERSION);
    } catch {
      /* ignore */
    }
    setOpen(false);
  };

  if (!current || blockedRoute) return null;

  return (
    <Dialog open={open} onOpenChange={(v) => (v ? setOpen(true) : dismiss())}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2 text-primary">
            <Sparkles className="h-5 w-5" />
            <span className="text-xs font-semibold uppercase tracking-wider">Atualização {current.date}</span>
          </div>
          <DialogTitle className="text-xl leading-tight">{current.title}</DialogTitle>
          <DialogDescription>
            Olha o que tá novo por aqui:
          </DialogDescription>
        </DialogHeader>

        <ul className="space-y-3 py-2 text-sm leading-relaxed">
          {current.items.map((item, i) => (
            <li key={i} className="flex gap-2.5">
              <CheckCircle2 className="h-4 w-4 mt-0.5 shrink-0 text-primary" />
              <span className="text-foreground/90">{item}</span>
            </li>
          ))}
        </ul>

        <DialogFooter>
          <Button onClick={dismiss} className="w-full sm:w-auto">Beleza, bora usar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
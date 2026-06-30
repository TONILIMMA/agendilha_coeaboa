import { useState } from "react";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { toast } from "sonner";

/**
 * Botão "Atualizar app" — força o navegador/PWA a buscar a versão mais nova.
 * Se houver Service Worker, dispara update + skipWaiting. Caso contrário,
 * limpa caches e recarrega ignorando cache.
 */
export function UpdateAppButton({ compact = false }: { compact?: boolean }) {
  const [loading, setLoading] = useState(false);

  const handleUpdate = async () => {
    setLoading(true);
    try {
      if ("serviceWorker" in navigator) {
        const regs = await navigator.serviceWorker.getRegistrations();
        await Promise.all(regs.map((r) => r.update().catch(() => undefined)));
        const waiting = regs.find((r) => r.waiting)?.waiting;
        if (waiting) waiting.postMessage({ type: "SKIP_WAITING" });
      }
      if ("caches" in window) {
        const keys = await caches.keys();
        await Promise.all(keys.map((k) => caches.delete(k)));
      }
      toast.success("Atualizando…");
      setTimeout(() => window.location.reload(), 400);
    } catch {
      window.location.reload();
    }
  };

  return (
    <Button
      variant="ghost"
      size={compact ? "icon" : "sm"}
      onClick={handleUpdate}
      disabled={loading}
      aria-label="Atualizar app"
      title="Atualizar app"
      className={compact ? "h-9 w-9" : ""}
    >
      <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
      {!compact && <span className="ml-1.5 text-xs font-semibold">Atualizar</span>}
    </Button>
  );
}
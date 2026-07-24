import { useState } from "react";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { runAppUpdate } from "@/pwa/updateApp";
import { useAuth } from "@/contexts/AuthContext";

/**
 * Botão "Atualizar app" — força o navegador/PWA a buscar a versão mais nova
 * de forma segura: respeita offline, prioriza troca de Service Worker via
 * `skipWaiting` (sem limpar caches à toa) e só invalida caches específicos
 * do app-shell quando de fato precisa reobter a build.
 */
export function UpdateAppButton({ compact = false }: { compact?: boolean }) {
  const [loading, setLoading] = useState(false);
  const { isAdmin } = useAuth();

  // Restrito a administradores (inclui Admin Master).
  if (!isAdmin) return null;

  const handleUpdate = async () => {
    if (loading) return;
    setLoading(true);
    const result = await runAppUpdate();
    if (result.status === "offline") {
      toast.error("Sem conexão", {
        description: "Conecte-se à internet pra atualizar o app.",
      });
      setLoading(false);
      return;
    }
    if (result.status === "unstable") {
      toast.warning("Conexão instável", {
        description: "Não deu pra checar a versão mais nova. Tenta de novo em instantes.",
      });
      setLoading(false);
      return;
    }
    toast.success(
      result.status === "sw-activated" ? "Nova versão pronta — recarregando…" : "Atualizando…",
    );
    // Deixa o toast aparecer antes de recarregar.
    setTimeout(() => window.location.reload(), 400);
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
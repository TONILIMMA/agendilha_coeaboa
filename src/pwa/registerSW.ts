import { registerSW } from "virtual:pwa-register";
import { toast } from "sonner";

const SW_PATH = "/sw.js";

function isPreviewOrDev(): boolean {
  if (!import.meta.env.PROD) return true;
  if (typeof window === "undefined") return true;
  try {
    if (window.self !== window.top) return true;
  } catch {
    return true;
  }
  const host = window.location.hostname;
  if (host === "localhost" || host === "127.0.0.1") return true;
  if (host.startsWith("id-preview--") || host.startsWith("preview--")) return true;
  if (host === "lovableproject.com" || host.endsWith(".lovableproject.com")) return true;
  if (host === "lovableproject-dev.com" || host.endsWith(".lovableproject-dev.com")) return true;
  if (host === "beta.lovable.dev" || host.endsWith(".beta.lovable.dev")) return true;
  if (new URLSearchParams(window.location.search).get("sw") === "off") return true;
  return false;
}

async function unregisterMatchingSWs() {
  if (!("serviceWorker" in navigator)) return;
  try {
    const regs = await navigator.serviceWorker.getRegistrations();
    await Promise.all(
      regs
        .filter((r) => {
          const url = r.active?.scriptURL || r.installing?.scriptURL || r.waiting?.scriptURL;
          return url ? new URL(url).pathname === SW_PATH : false;
        })
        .map((r) => r.unregister())
    );
  } catch {
    /* noop */
  }
}

export function setupPWA() {
  if (typeof window === "undefined") return;
  if (isPreviewOrDev()) {
    void unregisterMatchingSWs();
    return;
  }
  if (!("serviceWorker" in navigator)) return;

  const updateSW = registerSW({
    immediate: true,
    onNeedRefresh() {
      // New build available — ask the user before reloading.
      toast("Nova versão disponível", {
        description: "Atualize para receber as últimas melhorias.",
        duration: Infinity,
        action: {
          label: "Atualizar",
          onClick: () => {
            void updateSW(true);
          },
        },
        closeButton: true,
      });
    },
    onOfflineReady() {
      toast.success("App pronto para uso offline");
    },
    onRegistered(registration) {
      if (!registration) return;
      // Re-check for updates when the tab becomes visible again (mobile resume).
      const checkForUpdate = () => {
        if (document.visibilityState === "visible") {
          registration.update().catch(() => undefined);
        }
      };
      document.addEventListener("visibilitychange", checkForUpdate);
      window.addEventListener("focus", checkForUpdate);
      // Periodic check every 30 minutes for long-lived sessions.
      setInterval(() => registration.update().catch(() => undefined), 30 * 60 * 1000);
    },
  });
}
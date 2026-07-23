/**
 * Executa uma atualização segura do app.
 *
 * Regras:
 *  - Se estiver offline, aborta sem tocar em caches (não perde estado local).
 *  - Se houver Service Worker `waiting`, apenas ativa (SKIP_WAITING). O
 *    Workbox já limpa precaches antigas via `cleanupOutdatedCaches`, então
 *    NÃO apagamos caches manualmente — isso preserva assets ainda válidos
 *    (fontes, imagens hashadas etc.) e reduz o tempo de carregamento pós-update.
 *  - Caso não haja waiting, dispara `registration.update()` com timeout curto
 *    para detectar conexão instável. Se ainda assim não houver nova versão,
 *    limpa apenas caches conhecidos do app-shell (precache/runtime do próprio
 *    scope) — preservando fontes e outros recursos externos.
 */

export type UpdateResult =
  | { status: "offline" }
  | { status: "unstable" }
  | { status: "sw-activated" }
  | { status: "reload-only" };

// Caches que NUNCA devem ser invalidados manualmente pelo botão — são caros
// de reconstruir e não mudam entre builds do app.
const PRESERVED_CACHE_PREFIXES = [
  "google-fonts-cache",
  "gstatic-fonts-cache",
];

// Caches do próprio app-shell que podem ser descartados com segurança.
// `workbox-precache-*` e nosso `html-navigations` são regerados pelo SW.
function isAppShellCache(name: string): boolean {
  if (PRESERVED_CACHE_PREFIXES.some((p) => name.startsWith(p))) return false;
  return (
    name.startsWith("workbox-precache") ||
    name.startsWith("workbox-runtime") ||
    name === "html-navigations"
  );
}

async function withTimeout<T>(p: Promise<T>, ms: number): Promise<T | "timeout"> {
  return await Promise.race<Promise<T | "timeout">>([
    p.then((v) => v as T),
    new Promise<"timeout">((resolve) => setTimeout(() => resolve("timeout"), ms)),
  ]);
}

export interface UpdateDeps {
  onLine: boolean;
  serviceWorker?: ServiceWorkerContainer;
  caches?: CacheStorage;
  updateTimeoutMs?: number;
}

export async function runAppUpdate(deps?: Partial<UpdateDeps>): Promise<UpdateResult> {
  const onLine = deps?.onLine ?? (typeof navigator !== "undefined" ? navigator.onLine : true);
  const sw =
    deps?.serviceWorker ??
    (typeof navigator !== "undefined" && "serviceWorker" in navigator
      ? navigator.serviceWorker
      : undefined);
  const cacheStorage =
    deps?.caches ?? (typeof caches !== "undefined" ? caches : undefined);
  const timeoutMs = deps?.updateTimeoutMs ?? 4000;

  if (!onLine) return { status: "offline" };

  // Sem SW: apenas recarrega (sem mexer em caches para não invalidar assets).
  if (!sw) return { status: "reload-only" };

  let regs: readonly ServiceWorkerRegistration[] = [];
  try {
    regs = await sw.getRegistrations();
  } catch {
    return { status: "reload-only" };
  }

  // Já existe um SW aguardando ativação — só troca. Workbox faz o cleanup.
  const waitingReg = regs.find((r) => r.waiting);
  if (waitingReg?.waiting) {
    try {
      waitingReg.waiting.postMessage({ type: "SKIP_WAITING" });
    } catch {
      /* noop — recarregar ainda ajuda */
    }
    return { status: "sw-activated" };
  }

  // Dispara update() com timeout — conexão instável não pode travar o botão.
  const updateResults = await Promise.all(
    regs.map((r) => withTimeout(r.update().then(() => "ok" as const).catch(() => "err" as const), timeoutMs)),
  );
  const anyTimeout = updateResults.some((r) => r === "timeout");
  const allErrored = updateResults.length > 0 && updateResults.every((r) => r === "err");
  if (anyTimeout || allErrored) return { status: "unstable" };

  // Se após o update apareceu um waiting worker, ativa e evita tocar em caches.
  const refreshed = await sw.getRegistrations().catch(() => [] as ServiceWorkerRegistration[]);
  const nowWaiting = refreshed.find((r) => r.waiting);
  if (nowWaiting?.waiting) {
    try {
      nowWaiting.waiting.postMessage({ type: "SKIP_WAITING" });
    } catch {
      /* noop */
    }
    return { status: "sw-activated" };
  }

  // Fallback: sem nova versão detectada. Limpa APENAS caches do app-shell
  // (preserva fontes e demais recursos externos) e recarrega.
  if (cacheStorage) {
    try {
      const keys = await cacheStorage.keys();
      await Promise.all(keys.filter(isAppShellCache).map((k) => cacheStorage.delete(k)));
    } catch {
      /* noop */
    }
  }
  return { status: "reload-only" };
}

// Exportado para testes.
export const __test__ = { isAppShellCache, PRESERVED_CACHE_PREFIXES };
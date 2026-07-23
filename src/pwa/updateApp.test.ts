import { describe, it, expect, vi, beforeEach } from "vitest";
import { runAppUpdate, __test__ } from "./updateApp";

function makeReg(overrides: Partial<{ waiting: any; update: () => Promise<void> }> = {}) {
  return {
    waiting: overrides.waiting ?? null,
    update: overrides.update ?? vi.fn().mockResolvedValue(undefined),
  } as unknown as ServiceWorkerRegistration;
}

function makeSW(regs: ServiceWorkerRegistration[], afterUpdate?: ServiceWorkerRegistration[]) {
  let call = 0;
  return {
    getRegistrations: vi.fn().mockImplementation(async () => {
      call += 1;
      return call === 1 || !afterUpdate ? regs : afterUpdate;
    }),
  } as unknown as ServiceWorkerContainer;
}

function makeCaches(keys: string[]) {
  const deleted: string[] = [];
  return {
    storage: {
      keys: vi.fn().mockResolvedValue(keys),
      delete: vi.fn().mockImplementation(async (k: string) => {
        deleted.push(k);
        return true;
      }),
      match: vi.fn(),
      has: vi.fn(),
      open: vi.fn(),
    } as unknown as CacheStorage,
    deleted,
  };
}

describe("runAppUpdate", () => {
  beforeEach(() => vi.clearAllMocks());

  it("aborta com status 'offline' quando o usuário está sem conexão", async () => {
    const sw = makeSW([]);
    const c = makeCaches(["workbox-precache-v2-http://x/"]);
    const res = await runAppUpdate({ onLine: false, serviceWorker: sw, caches: c.storage });
    expect(res).toEqual({ status: "offline" });
    expect(sw.getRegistrations).not.toHaveBeenCalled();
    expect(c.deleted).toHaveLength(0);
  });

  it("apenas ativa o waiting worker sem apagar caches", async () => {
    const postMessage = vi.fn();
    const reg = makeReg({ waiting: { postMessage } });
    const sw = makeSW([reg]);
    const c = makeCaches(["workbox-precache-v2-http://x/", "google-fonts-cache"]);
    const res = await runAppUpdate({ onLine: true, serviceWorker: sw, caches: c.storage });
    expect(res).toEqual({ status: "sw-activated" });
    expect(postMessage).toHaveBeenCalledWith({ type: "SKIP_WAITING" });
    expect(c.deleted).toHaveLength(0);
  });

  it("marca 'unstable' quando registration.update() estoura o timeout", async () => {
    const reg = makeReg({ update: () => new Promise(() => {}) }); // pendura pra sempre
    const sw = makeSW([reg]);
    const c = makeCaches([]);
    const res = await runAppUpdate({
      onLine: true,
      serviceWorker: sw,
      caches: c.storage,
      updateTimeoutMs: 10,
    });
    expect(res).toEqual({ status: "unstable" });
    expect(c.deleted).toHaveLength(0);
  });

  it("marca 'unstable' quando todas as chamadas update() falham (conexão instável)", async () => {
    const reg = makeReg({ update: vi.fn().mockRejectedValue(new Error("net")) });
    const sw = makeSW([reg]);
    const c = makeCaches([]);
    const res = await runAppUpdate({
      onLine: true,
      serviceWorker: sw,
      caches: c.storage,
      updateTimeoutMs: 50,
    });
    expect(res).toEqual({ status: "unstable" });
  });

  it("após update(), se surgir waiting worker, ativa e preserva caches", async () => {
    const reg1 = makeReg();
    const postMessage = vi.fn();
    const reg2 = makeReg({ waiting: { postMessage } });
    const sw = makeSW([reg1], [reg2]);
    const c = makeCaches(["workbox-precache-v2-http://x/", "google-fonts-cache"]);
    const res = await runAppUpdate({ onLine: true, serviceWorker: sw, caches: c.storage });
    expect(res).toEqual({ status: "sw-activated" });
    expect(postMessage).toHaveBeenCalled();
    expect(c.deleted).toHaveLength(0);
  });

  it("no fallback, limpa só caches do app-shell e preserva fontes/externos", async () => {
    const reg = makeReg();
    const sw = makeSW([reg], [reg]);
    const c = makeCaches([
      "workbox-precache-v2-http://x/",
      "workbox-runtime-http://x/",
      "html-navigations",
      "google-fonts-cache",
      "gstatic-fonts-cache",
      "supabase-api-cache",
    ]);
    const res = await runAppUpdate({ onLine: true, serviceWorker: sw, caches: c.storage });
    expect(res).toEqual({ status: "reload-only" });
    expect(c.deleted.sort()).toEqual(
      ["html-navigations", "workbox-precache-v2-http://x/", "workbox-runtime-http://x/"].sort(),
    );
    // fontes e cache externo do supabase preservados
    expect(c.deleted).not.toContain("google-fonts-cache");
    expect(c.deleted).not.toContain("gstatic-fonts-cache");
    expect(c.deleted).not.toContain("supabase-api-cache");
  });

  it("isAppShellCache identifica corretamente os caches descartáveis", () => {
    const f = __test__.isAppShellCache;
    expect(f("workbox-precache-v2-http://x/")).toBe(true);
    expect(f("workbox-runtime-http://x/")).toBe(true);
    expect(f("html-navigations")).toBe(true);
    expect(f("google-fonts-cache")).toBe(false);
    expect(f("gstatic-fonts-cache")).toBe(false);
    expect(f("supabase-api-cache")).toBe(false);
    expect(f("qualquer-outro")).toBe(false);
  });
});
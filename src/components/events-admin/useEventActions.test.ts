import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";

// Mock Supabase client — captura updates sem tocar rede.
const updateMock = vi.fn();
vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from: () => ({
      update: (patch: unknown) => {
        updateMock(patch);
        return {
          eq: () => ({
            select: () => Promise.resolve({ data: [{ id: "evt-1" }], error: null }),
          }),
        };
      },
      insert: () => Promise.resolve({ error: null }),
    }),
  },
}));

vi.mock("sonner", () => ({ toast: { error: vi.fn(), success: vi.fn(), info: vi.fn() } }));
vi.mock("@/lib/notifications", () => ({ openWhatsappNotification: () => true }));
vi.mock("@/lib/logger", () => ({ logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn() } }));

import { useEventActions } from "./useEventActions";
import type { Submission } from "./types";

const baseSubmission = {
  id: "evt-1",
  event_title: "Show do Zé",
  date: "2026-08-01",
  start_time: "20:00",
  location: "Praça",
  image_url: "https://cdn/arte-do-promotor.jpg",
  editorial_status: "recebido",
} as unknown as Submission;

function setup(overrides: Record<string, unknown> = {}) {
  const sub = { ...(baseSubmission as unknown as Record<string, unknown>), ...overrides } as unknown as Submission;
  const setSubmissions = vi.fn();
  const onPublishBlocked = vi.fn();
  const hook = renderHook(() =>
    useEventActions({
      userId: "user-1",
      submissions: [sub],
      setSubmissions,
      onCollapse: vi.fn(),
      onPublishBlocked,
    }),
  );
  return { hook, setSubmissions, onPublishBlocked, sub };
}

beforeEach(() => {
  updateMock.mockClear();
});

describe("useEventActions – fluxos de publicar/agendar/aprovar", () => {
  it("bloqueia publicação quando faltam campos e chama onPublishBlocked com a lista exata", async () => {
    const { hook, onPublishBlocked } = setup({ location: null, start_time: null });
    let result: boolean | undefined;
    await act(async () => {
      result = await hook.result.current.handleEditorialChange("evt-1", "publicado");
    });
    expect(result).toBe(false);
    expect(onPublishBlocked).toHaveBeenCalledTimes(1);
    const info = onPublishBlocked.mock.calls[0][0];
    expect(info.action).toBe("publicar");
    expect(info.missing).toEqual(expect.arrayContaining(["horário", "local"]));
    expect(updateMock).not.toHaveBeenCalled();
  });

  it("bloqueia agendamento e informa 'agendar' quando falta data", async () => {
    const { hook, onPublishBlocked } = setup({ date: null });
    await act(async () => {
      await hook.result.current.handleEditorialChange("evt-1", "agendado");
    });
    expect(onPublishBlocked).toHaveBeenCalledWith(
      expect.objectContaining({ action: "agendar", missing: ["data"] }),
    );
    expect(updateMock).not.toHaveBeenCalled();
  });

  it("libera publicação e envia patch quando os 4 campos estão OK", async () => {
    const { hook, onPublishBlocked } = setup();
    let result: boolean | undefined;
    await act(async () => {
      result = await hook.result.current.handleEditorialChange("evt-1", "publicado");
    });
    expect(result).toBe(true);
    expect(onPublishBlocked).not.toHaveBeenCalled();
    expect(updateMock).toHaveBeenCalled();
    const patch = updateMock.mock.calls[0][0];
    expect(patch.editorial_status).toBe("publicado");
    // Preservação do flyer: nenhum patch deve mexer em image_url.
    expect(patch).not.toHaveProperty("image_url");
  });

  it("aprovação (handleStatusChange) não altera image_url — flyer da Fase 6 preservado", async () => {
    const { hook } = setup();
    await act(async () => {
      await hook.result.current.handleStatusChange("evt-1", "approved");
    });
    expect(updateMock).toHaveBeenCalled();
    for (const call of updateMock.mock.calls) {
      expect(call[0]).not.toHaveProperty("image_url");
    }
  });
});
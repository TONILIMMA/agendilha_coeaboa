import { afterEach, describe, expect, it, vi } from "vitest";
import { measureFlowOperation, startFlowMeasure } from "./flow-performance";

describe("flow-performance", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("publica uma medição sem incluir dados do formulário", () => {
    const listener = vi.fn();
    window.addEventListener("agendilha:flow-metric", listener);

    const metric = startFlowMeasure("event-submission", "step-validation", 1).finish({
      outcome: "blocked",
      fieldCount: 2,
    });

    expect(metric).toMatchObject({
      flow: "event-submission",
      operation: "step-validation",
      outcome: "blocked",
      step: 1,
      fieldCount: 2,
    });
    expect(metric?.durationMs).toBeGreaterThanOrEqual(0);
    expect(listener).toHaveBeenCalledOnce();
    window.removeEventListener("agendilha:flow-metric", listener);
  });

  it("marca operações rejeitadas como falha e preserva o erro", async () => {
    const error = Object.assign(new Error("falhou"), { code: "TEST_ERROR" });

    await expect(
      measureFlowOperation("event-submission", "submission-insert", async () => {
        throw error;
      }),
    ).rejects.toBe(error);
  });

  it("finaliza cada medição apenas uma vez", () => {
    const timer = startFlowMeasure("event-submission", "draft-save");
    expect(timer.finish()).not.toBeNull();
    expect(timer.finish()).toBeNull();
  });
});
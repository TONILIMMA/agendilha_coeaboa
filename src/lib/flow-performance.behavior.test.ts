import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { measureFlowOperation, startFlowMeasure } from "@/lib/flow-performance";

describe("flow performance instrumentation is behavior-neutral", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns the wrapped action result untouched", async () => {
    const payload = { id: "abc", nested: { ok: true } };
    const result = await measureFlowOperation("submission", "insert", async () => payload);
    expect(result).toBe(payload);
  });

  it("runs the action exactly once", async () => {
    const action = vi.fn(async () => 42);
    await measureFlowOperation("submission", "insert", action, 2);
    expect(action).toHaveBeenCalledTimes(1);
  });

  it("re-throws the original error object so callers keep their handling", async () => {
    const error = new Error("falha no envio");
    await expect(
      measureFlowOperation("submission", "insert", async () => {
        throw error;
      }),
    ).rejects.toBe(error);
  });

  it("preserves call order between instrumented steps", async () => {
    const order: string[] = [];
    await measureFlowOperation("submission", "step-1", async () => {
      order.push("step-1");
    });
    await measureFlowOperation("submission", "submit", async () => {
      order.push("submit");
    });
    expect(order).toEqual(["step-1", "submit"]);
  });

  it("never records form values, only safe metadata", async () => {
    const details: unknown[] = [];
    const listener = (event: Event) => details.push((event as CustomEvent).detail);
    window.addEventListener("agendilha:flow-metric", listener);

    const timer = startFlowMeasure("submission", "validate", 1);
    timer.finish({ outcome: "blocked", fieldCount: 7, step: 1 });

    window.removeEventListener("agendilha:flow-metric", listener);

    expect(details).toHaveLength(1);
    expect(Object.keys(details[0] as object).sort()).toEqual(
      ["durationMs", "errorCode", "fieldCount", "flow", "operation", "outcome", "step", "timestamp"].sort(),
    );
  });

  it("ignores duplicated finish calls so submission is not double counted", () => {
    const timer = startFlowMeasure("submission", "submit");
    expect(timer.finish()).not.toBeNull();
    expect(timer.finish()).toBeNull();
  });

  it("keeps working when the performance API misbehaves", async () => {
    vi.spyOn(performance, "measure").mockImplementation(() => {
      throw new Error("performance indisponível");
    });
    const timer = startFlowMeasure("submission", "upload");
    expect(() => timer.finish()).not.toThrow();

    await expect(
      measureFlowOperation("submission", "upload", async () => "ok"),
    ).resolves.toBe("ok");
  });
});

import { logger } from "@/lib/logger";

export type FlowMetricOutcome = "success" | "failure" | "blocked" | "cancelled";

export interface FlowMetricDetail {
  flow: string;
  operation: string;
  durationMs: number;
  outcome: FlowMetricOutcome;
  step?: number;
  fieldCount?: number;
  errorCode?: string;
  timestamp: string;
}

interface FinishOptions {
  outcome?: FlowMetricOutcome;
  step?: number;
  fieldCount?: number;
  error?: unknown;
}

const SLOW_OPERATION_MS = 1_000;
const MAX_MARKS = 120;
let sequence = 0;

function now(): number {
  return typeof performance !== "undefined" ? performance.now() : Date.now();
}

function safeErrorCode(error: unknown): string | undefined {
  if (!error || typeof error !== "object") return undefined;
  const candidate = error as { code?: unknown; status?: unknown; name?: unknown };
  if (typeof candidate.code === "string") return candidate.code.slice(0, 40);
  if (typeof candidate.status === "number") return String(candidate.status);
  if (typeof candidate.name === "string") return candidate.name.slice(0, 40);
  return undefined;
}

function publish(detail: FlowMetricDetail) {
  if (detail.outcome === "failure") {
    logger.error(`[performance:${detail.flow}] ${detail.operation} failed`, detail);
  } else if (detail.durationMs >= SLOW_OPERATION_MS) {
    logger.warn(`[performance:${detail.flow}] slow ${detail.operation}`, detail);
  } else {
    logger.info(`[performance:${detail.flow}] ${detail.operation}`, detail);
  }

  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("agendilha:flow-metric", { detail }));
  }
}

function trimPerformanceEntries() {
  if (typeof performance === "undefined" || sequence % MAX_MARKS !== 0) return;
  performance.clearMarks("agendilha-flow");
  performance.clearMeasures("agendilha-flow");
}

/**
 * Starts a privacy-safe flow timer. It records names, duration and outcome only;
 * form values and other personal data must never be passed to it.
 */
export function startFlowMeasure(flow: string, operation: string, initialStep?: number) {
  const startedAt = now();
  const id = ++sequence;
  const markPrefix = `agendilha-flow:${flow}:${operation}:${id}`;

  if (typeof performance !== "undefined") {
    performance.mark(`${markPrefix}:start`, { detail: { flow, operation, step: initialStep } });
  }

  let finished = false;
  return {
    finish(options: FinishOptions = {}): FlowMetricDetail | null {
      if (finished) return null;
      finished = true;

      const durationMs = Math.max(0, Math.round((now() - startedAt) * 10) / 10);
      const detail: FlowMetricDetail = {
        flow,
        operation,
        durationMs,
        outcome: options.outcome ?? "success",
        step: options.step ?? initialStep,
        fieldCount: options.fieldCount,
        errorCode: safeErrorCode(options.error),
        timestamp: new Date().toISOString(),
      };

      if (typeof performance !== "undefined") {
        performance.mark(`${markPrefix}:end`);
        performance.measure(`agendilha-flow:${flow}:${operation}`, `${markPrefix}:start`, `${markPrefix}:end`);
        trimPerformanceEntries();
      }

      publish(detail);
      return detail;
    },
  };
}

export async function measureFlowOperation<T>(
  flow: string,
  operation: string,
  action: () => Promise<T>,
  step?: number,
): Promise<T> {
  const timer = startFlowMeasure(flow, operation, step);
  try {
    const result = await action();
    timer.finish();
    return result;
  } catch (error) {
    timer.finish({ outcome: "failure", error });
    throw error;
  }
}
import { describe, expect, it } from "vitest";
import {
  highlightDaysLeft,
  highlightStatus,
  isHighlightActive,
  pickCarouselEvents,
} from "@/lib/highlights";

const now = new Date("2026-09-05T12:00:00Z");
const future = "2026-09-12T12:00:00Z";
const past = "2026-09-01T12:00:00Z";

describe("highlightStatus", () => {
  it("marca como ativo quando o prazo está no futuro", () => {
    expect(highlightStatus({ is_highlight: true, highlight_until: future }, now)).toBe("ativo");
  });

  it("marca como ativo quando não há prazo", () => {
    expect(highlightStatus({ is_highlight: true, highlight_until: null }, now)).toBe("ativo");
  });

  it("marca como expirado quando o prazo passou", () => {
    expect(highlightStatus({ is_highlight: true, highlight_until: past }, now)).toBe("expirado");
  });

  it("marca como escondido mesmo com prazo válido", () => {
    expect(
      highlightStatus({ is_highlight: true, highlight_hidden: true, highlight_until: future }, now),
    ).toBe("escondido");
  });

  it("marca como sem destaque quando a flag está desligada", () => {
    expect(highlightStatus({ is_highlight: false }, now)).toBe("sem_destaque");
  });
});

describe("isHighlightActive", () => {
  it("ignora highlight_active da view quando o prazo já venceu", () => {
    expect(
      isHighlightActive({ is_highlight: true, highlight_active: true, highlight_until: past }, now),
    ).toBe(false);
  });

  it("aceita destaque válido", () => {
    expect(
      isHighlightActive({ is_highlight: true, highlight_active: true, highlight_until: future }, now),
    ).toBe(true);
  });
});

describe("highlightDaysLeft", () => {
  it("conta os dias restantes", () => {
    expect(highlightDaysLeft({ highlight_until: future }, now)).toBe(7);
  });
  it("retorna 0 quando expirou", () => {
    expect(highlightDaysLeft({ highlight_until: past }, now)).toBe(0);
  });
  it("retorna null sem prazo", () => {
    expect(highlightDaysLeft({ highlight_until: null }, now)).toBeNull();
  });
});

describe("pickCarouselEvents", () => {
  it("coloca destaques ativos na frente e ordena o resto por data", () => {
    const events = [
      { id: "a", date: "2026-09-20" },
      { id: "b", date: "2026-09-30", is_highlight: true, highlight_until: future },
      { id: "c", date: "2026-09-10" },
      { id: "d", date: "2026-09-11", is_highlight: true, highlight_until: past },
      { id: "e", date: "2026-09-12", is_highlight: true, highlight_hidden: true },
    ];
    expect(pickCarouselEvents(events, 10, now).map((e) => e.id)).toEqual([
      "b",
      "c",
      "d",
      "e",
      "a",
    ]);
  });

  it("limita em 10 itens", () => {
    const events = Array.from({ length: 25 }, (_, i) => ({
      id: String(i),
      date: `2026-09-${String((i % 28) + 1).padStart(2, "0")}`,
    }));
    expect(pickCarouselEvents(events, 10, now)).toHaveLength(10);
  });
});

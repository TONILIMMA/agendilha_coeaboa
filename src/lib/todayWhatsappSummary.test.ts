import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  buildTodayWhatsAppSummary,
  buildWeekWhatsAppSummary,
  buildCoeaboaDailyReport,
  openWhatsAppWithText,
} from "./todayWhatsappSummary";

function isoAddDays(iso: string, days: number) {
  const [y, m, d] = iso.split("-").map(Number);
  const dt = new Date(y, m - 1, d);
  dt.setDate(dt.getDate() + days);
  const tz = dt.getTimezoneOffset() * 60000;
  return new Date(dt.getTime() - tz).toISOString().slice(0, 10);
}

function todayISO() {
  const d = new Date();
  const tz = d.getTimezoneOffset() * 60000;
  return new Date(d.getTime() - tz).toISOString().slice(0, 10);
}

describe("buildWeekWhatsAppSummary", () => {
  const base = {
    status: "aprovado" as const,
    event_title: "Show",
    atrativo_name: null,
    location: "Bar do Zé",
    address_neighborhood: "Cocotá",
    start_time: "20:00",
    end_time: null,
  };

  it("retorna vazio quando não há eventos na semana", () => {
    const { text, count } = buildWeekWhatsAppSummary([]);
    expect(count).toBe(0);
    expect(text).toBe("");
  });

  it("inclui cabeçalho, blocos por dia e rodapé no formato esperado", () => {
    const today = todayISO();
    const day3 = isoAddDays(today, 3);
    const submissions = [
      { ...base, event_title: "Samba", date: today, start_time: "19:00" },
      { ...base, event_title: "Roda", date: today, start_time: "22:00" },
      { ...base, atrativo_name: "Feijoada", date: day3, start_time: "13:00" },
    ];
    const { text, count } = buildWeekWhatsAppSummary(submissions);
    expect(count).toBe(3);
    // Cabeçalho
    expect(text).toContain("AGENDILHA — rolês desta semana na Ilha");
    expect(text).toContain("Agenda completa em:");
    expect(text).toContain("https://agendilha-divulgacao.lovable.app");
    // Bloco por dia com emoji e ordenação por horário
    expect(text).toMatch(/🗓️ \*[A-Za-zçãáéíóú-]+ \d{2}\/\d{2}\*/);
    const idxSamba = text.indexOf("Samba");
    const idxRoda = text.indexOf("Roda");
    expect(idxSamba).toBeGreaterThan(-1);
    expect(idxRoda).toBeGreaterThan(idxSamba);
    // Evento com atrativo_name é usado no lugar do event_title
    expect(text).toContain("Feijoada");
    // Local + bairro
    expect(text).toContain("👉 Bar do Zé – Cocotá");
    // Horário
    expect(text).toContain("🕒 19h");
    // Rodapé
    expect(text).toContain("Ver detalhes, mapa e mais rolês no app:");
  });

  it("inclui o último dia do período (hoje +6) e exclui hoje-1 e hoje+7", () => {
    const today = todayISO();
    const submissions = [
      { ...base, event_title: "Ontem", date: isoAddDays(today, -1) },
      { ...base, event_title: "Hoje", date: today },
      { ...base, event_title: "UltimoDia", date: isoAddDays(today, 6) },
      { ...base, event_title: "ForaDaSemana", date: isoAddDays(today, 7) },
    ];
    const { text, count } = buildWeekWhatsAppSummary(submissions);
    expect(count).toBe(2);
    expect(text).toContain("Hoje");
    expect(text).toContain("UltimoDia");
    expect(text).not.toContain("Ontem");
    expect(text).not.toContain("ForaDaSemana");
  });

  it("ignora eventos não aprovados", () => {
    const today = todayISO();
    const submissions = [
      { ...base, event_title: "Pendente", date: today, status: "pendente" },
      { ...base, event_title: "Aprovado", date: today },
    ];
    const { text, count } = buildWeekWhatsAppSummary(submissions);
    expect(count).toBe(1);
    expect(text).toContain("Aprovado");
    expect(text).not.toContain("Pendente");
  });
});

describe("buildTodayWhatsAppSummary", () => {
  it("filtra apenas aprovados de hoje", () => {
    const today = todayISO();
    const { text, count } = buildTodayWhatsAppSummary([
      { status: "aprovado", event_title: "Hoje", date: today, start_time: "20:00", location: "Bar", address_neighborhood: "Ilha" },
      { status: "aprovado", event_title: "Amanha", date: isoAddDays(today, 1), start_time: "20:00" },
    ]);
    expect(count).toBe(1);
    expect(text).toContain("Hoje");
    expect(text).not.toContain("Amanha");
    expect(text).toContain("AGENDILHA — Rolês de hoje na Ilha");
  });
});

describe("openWhatsAppWithText", () => {
  beforeEach(() => {
    vi.stubGlobal("open", vi.fn());
  });
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("abre wa.me com o texto codificado (emojis, acentos e quebras de linha)", () => {
    const text = "🎙️ Rolê da Ilha\nBar do Zé – Cocotá";
    openWhatsAppWithText(text);
    const spy = window.open as unknown as ReturnType<typeof vi.fn>;
    expect(spy).toHaveBeenCalledTimes(1);
    const url = spy.mock.calls[0][0] as string;
    expect(url.startsWith("https://wa.me/?text=")).toBe(true);
    // Decodifica de volta para garantir round-trip
    const decoded = decodeURIComponent(url.replace("https://wa.me/?text=", ""));
    expect(decoded).toBe(text);
    // Garante que emoji/acento/newline não vão crus na URL
    expect(url).not.toContain("🎙️");
    expect(url).not.toContain("\n");
    expect(url).not.toContain("é");
  });
});

describe("buildCoeaboaDailyReport", () => {
  it("gera o modelo diário com múltiplos atrativos e endereço completo", () => {
    const date = "2026-09-15";
    const { text, count } = buildCoeaboaDailyReport([
      {
        status: "aprovado",
        date,
        start_time: "18:00:00",
        event_title: "Noite de rock",
        location: "Aterro do Cocotá",
        address_street: "Parque Manoel Bandeira",
        address_number: "s/n",
        address_neighborhood: "Cocotá",
        submission_atrativos: [
          { name: "Linha Vermelha", display_order: 2 },
          { name: "Banda 4X Rock", display_order: 1 },
        ],
      },
    ], date);

    expect(count).toBe(1);
    expect(text).toBe(
      "Brasil - RJ - Rio de Janeiro\n\n" +
      "🗓️ 15/09/2026\n\n" +
      "🕒 18:00h * Banda 4X Rock - Linha Vermelha *\n" +
      "📍 Aterro do Cocotá – Parque Manoel Bandeira, s/n - Cocotá",
    );
  });

  it("ignora eventos não aprovados e ordena por horário", () => {
    const date = "2026-09-15";
    const { text, count } = buildCoeaboaDailyReport([
      { status: "aprovado", date, start_time: "22:00", event_title: "Mais tarde" },
      { status: "pendente", date, start_time: "17:00", event_title: "Pendente" },
      { status: "aprovado", date, start_time: "18:00", event_title: "Mais cedo" },
    ], date);

    expect(count).toBe(2);
    expect(text.indexOf("Mais cedo")).toBeLessThan(text.indexOf("Mais tarde"));
    expect(text).not.toContain("Pendente");
  });
});
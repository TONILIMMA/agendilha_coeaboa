import { asArray } from "@/lib/safe";

/**
 * Formato mínimo que os resumos precisam de um evento. Estrutural de propósito:
 * serve tanto para `Submission` quanto para linhas cruas do backend.
 */
export interface SummaryEvent {
  status?: string | null;
  date?: string | null;
  start_time?: string | null;
  end_time?: string | null;
  event_title?: string | null;
  atrativo_name?: string | null;
  location?: string | null;
  estabelecimento_name?: string | null;
  address_street?: string | null;
  address_number?: string | null;
  address_neighborhood?: string | null;
}

function todayISO(): string {
  const d = new Date();
  const tz = d.getTimezoneOffset() * 60000;
  return new Date(d.getTime() - tz).toISOString().slice(0, 10);
}

function formatTime(t?: string | null): string {
  if (!t) return "";
  const [h, m] = t.split(":");
  if (m && m !== "00") return `${h}h${m}`;
  return `${h}h`;
}

function shortAddress(s: SummaryEvent): string {
  const parts = [s.address_street, s.address_number].filter(Boolean).join(", ");
  const bairro = s.address_neighborhood;
  return [parts, bairro].filter(Boolean).join(" - ");
}

function addDaysISO(iso: string, days: number): string {
  const [y, m, d] = iso.split("-").map(Number);
  const dt = new Date(y, m - 1, d);
  dt.setDate(dt.getDate() + days);
  const tz = dt.getTimezoneOffset() * 60000;
  return new Date(dt.getTime() - tz).toISOString().slice(0, 10);
}

function formatDayLabel(iso: string): { weekday: string; date: string } {
  const [y, m, d] = iso.split("-").map(Number);
  const dt = new Date(y, m - 1, d);
  const weekday = dt.toLocaleDateString("pt-BR", { weekday: "long" });
  const date = dt.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
  return { weekday: weekday.charAt(0).toUpperCase() + weekday.slice(1), date };
}

function formatEventBlock(s: SummaryEvent): string {
  const nome = s.atrativo_name || s.event_title;
  const local = s.location || s.estabelecimento_name || "";
  const bairro = s.address_neighborhood || "";
  const linhaLocal = [local, bairro].filter(Boolean).join(" – ");
  const hora = formatTime(s.start_time) + (s.end_time ? ` às ${formatTime(s.end_time)}` : "");
  return [
    `🎙️ *${nome}*`,
    linhaLocal ? `👉 ${linhaLocal}` : null,
    hora ? `🕒 ${hora}` : null,
  ]
    .filter(Boolean)
    .join("\n");
}

/**
 * Monta o resumo de hoje pra colar no WhatsApp.
 * Formato por evento:
 *   🎙️ <NOME>
 *   👉 <LOCAL> – <ENDEREÇO>
 *   🕒 <HORÁRIO>
 */
export function buildTodayWhatsAppSummary(submissions: SummaryEvent[]): {
  text: string;
  count: number;
} {
  const today = todayISO();
  const items = asArray<SummaryEvent>(submissions)
    .filter((s) => s.status === "aprovado" && s.date === today)
    .sort((a, b) => (a.start_time || "").localeCompare(b.start_time || ""));

  if (items.length === 0) return { text: "", count: 0 };

  const header = `🌴 *AGENDILHA — Rolês de hoje na Ilha*`;
  const blocks = items.map((s) => {
    const nome = s.atrativo_name || s.event_title;
    const local = s.location || s.estabelecimento_name || "";
    const end = shortAddress(s);
    const linhaLocal = [local, end].filter(Boolean).join(" – ");
    const hora = formatTime(s.start_time) + (s.end_time ? ` às ${formatTime(s.end_time)}` : "");
    return [
      `🎙️ *${nome}*`,
      linhaLocal ? `👉 ${linhaLocal}` : null,
      hora ? `🕒 ${hora}` : null,
    ]
      .filter(Boolean)
      .join("\n");
  });

  const footer = `Ver detalhes e mais rolês de hoje no app:\nhttps://agendilha-divulgacao.lovable.app`;

  const text = [header, "", blocks.join("\n\n"), "", footer].join("\n");
  return { text, count: items.length };
}

export function openWhatsAppWithText(text: string) {
  const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
  window.open(url, "_blank");
}

export function buildCoeABoaSummary(submissions: SummaryEvent[]): { text: string; count: number } {
  const today = todayISO();
  const items = asArray<SummaryEvent>(submissions)
    .filter((s) => s.status === "aprovado" && s.date === today)
    .sort((a, b) => (a.start_time || "").localeCompare(b.start_time || ""));

  if (items.length === 0) return { text: "", count: 0 };

  const [y, m, d] = today.split("-");
  const dateStr = `🗓️ ${d}/${m}/${y}`;

  const header = `Brasil - RJ - Rio de Janeiro\n${dateStr}`;

  const blocks = items.map((s) => {
    const nome = s.atrativo_name || s.event_title;
    const horaBruta = s.start_time ? s.start_time.split(":") : [];
    const hora = horaBruta.length >= 2 ? `${horaBruta[0]}:${horaBruta[1]}h` : "";

    const local = s.location || s.estabelecimento_name || "";
    const street = [s.address_street, s.address_number].filter(Boolean).join(", ");
    const enderecoFull = [street, s.address_neighborhood].filter(Boolean).join(" - ");
    const linhaLocal = [local, enderecoFull].filter(Boolean).join(" – ");

    return `🕒 ${hora} * ${nome} *\n📍 ${linhaLocal}`;
  });

  const text = [header, "", blocks.join("\n\n")].join("\n");
  return { text, count: items.length };
}

/**
 * Monta o resumo da semana (hoje até +6 dias) agrupado por dia.
 */
export function buildWeekWhatsAppSummary(submissions: SummaryEvent[]): {
  text: string;
  count: number;
} {
  const start = todayISO();
  const end = addDaysISO(start, 6);

  const items = asArray<SummaryEvent>(submissions)
    .filter((s) => s.status === "aprovado" && s.date && s.date >= start && s.date <= end)
    .sort((a, b) => {
      const d = (a.date || "").localeCompare(b.date || "");
      if (d !== 0) return d;
      return (a.start_time || "").localeCompare(b.start_time || "");
    });

  if (items.length === 0) return { text: "", count: 0 };

  const byDay = new Map<string, SummaryEvent[]>();
  for (const s of items) {
    const arr = byDay.get(s.date!) || [];
    arr.push(s);
    byDay.set(s.date!, arr);
  }

  const header =
    `🌴 *AGENDILHA — rolês desta semana na Ilha*\n\n` +
    `Agenda completa em:\nhttps://agendilha-divulgacao.lovable.app`;

  const dayBlocks = Array.from(byDay.keys())
    .sort()
    .map((iso) => {
      const { weekday, date } = formatDayLabel(iso);
      const evs = byDay.get(iso)!.map(formatEventBlock).join("\n\n");
      return `🗓️ *${weekday} ${date}*\n\n${evs}`;
    });

  const footer = `Ver detalhes, mapa e mais rolês no app:\nhttps://agendilha-divulgacao.lovable.app`;

  const text = [header, "", dayBlocks.join("\n\n━━━━━━━━━━━━━━━\n\n"), "", footer].join("\n");
  return { text, count: items.length };
}
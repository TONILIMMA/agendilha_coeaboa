import type { Submission } from "@/components/events-admin/types";

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

function shortAddress(s: any): string {
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

function formatEventBlock(s: any): string {
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
export function buildTodayWhatsAppSummary(submissions: any[]): {
  text: string;
  count: number;
} {
  const today = todayISO();
  const items = submissions
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

/**
 * Monta o resumo da semana (hoje até +6 dias) agrupado por dia.
 */
export function buildWeekWhatsAppSummary(submissions: any[]): {
  text: string;
  count: number;
} {
  const start = todayISO();
  const end = addDaysISO(start, 6);

  const items = submissions
    .filter((s) => s.status === "aprovado" && s.date && s.date >= start && s.date <= end)
    .sort((a, b) => {
      const d = (a.date || "").localeCompare(b.date || "");
      if (d !== 0) return d;
      return (a.start_time || "").localeCompare(b.start_time || "");
    });

  if (items.length === 0) return { text: "", count: 0 };

  const byDay = new Map<string, any[]>();
  for (const s of items) {
    const arr = byDay.get(s.date) || [];
    arr.push(s);
    byDay.set(s.date, arr);
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
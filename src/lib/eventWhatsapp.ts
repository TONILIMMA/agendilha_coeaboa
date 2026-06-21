import { formatBrazilianDate } from "@/lib/date-utils";
import { categoryLabels, getDayOfWeek, getWeekRange, type Submission } from "@/components/events-admin/types";

export function buildWhatsAppMessage(sub: Submission): string {
  const dayOfWeek = getDayOfWeek(sub.date || "");
  const lines = [
    `*AGENDILHA* - sua agenda de eventos da Ilha do Governador`,
    `*Para mais informações:*`,
    `https://coeaboa.lovable.app/`,
    "",
    `🗓️ ${dayOfWeek ? dayOfWeek + " " : ""}${sub.date || ""}`,
    "",
    `🎙️ ${sub.start_time || ""}${sub.end_time ? ` às ${sub.end_time}` : ""} *${sub.event_title || "Evento"}*`,
    `👉 ${sub.location || ""}`,
    `✔️ Mais informações: https://coeaboa.lovable.app/`,
  ];
  return encodeURIComponent(lines.join("\n"));
}

export function buildBulkWhatsAppMessage(events: Submission[]): string {
  const { start } = getWeekRange();
  const endOfWeek = new Date(start);
  endOfWeek.setDate(start.getDate() + 6);
  const formatBR = (d: Date) => d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
  const highlights = events.filter(e => e.is_highlight);
  const lines: string[] = [
    `🌴 *AGENDILHA* - O que tem de bom na Ilha?`,
    `📅 Semana de ${formatBR(start)} a ${formatBR(endOfWeek)}`,
    ``,
  ];

  if (highlights.length > 0) {
    lines.push(`🔥 *DESTAQUES DA SEMANA*`);
    highlights.forEach(h => {
      lines.push(`• ${h.event_title} (${formatBrazilianDate(h.date)} às ${h.start_time})`);
    });
    lines.push(``);
  }

  lines.push(`👇 *AGENDA COMPLETA*`);
  const byDate = new Map<string, Submission[]>();
  events.forEach((ev) => {
    const key = ev.date || "Sem data";
    if (!byDate.has(key)) byDate.set(key, []);
    byDate.get(key)!.push(ev);
  });
  Array.from(byDate.keys()).sort().forEach((dateKey) => {
    const dayOfWeek = getDayOfWeek(dateKey);
    lines.push(`━━━━━━━━━━━━━━━`);
    lines.push(`🗓️ *${dayOfWeek ? dayOfWeek + " - " : ""}${formatBrazilianDate(dateKey)}*`);
    lines.push(``);
    byDate.get(dateKey)!.forEach((ev) => {
      lines.push(`🎙️ ${ev.start_time || ""}${ev.end_time ? ` às ${ev.end_time}` : ""} - *${ev.event_title}*`);
      if (ev.location) lines.push(`📍 ${ev.location}`);
      if (ev.category) lines.push(`🏷️ ${categoryLabels[ev.category] || ev.category}`);
      lines.push(``);
    });
  });
  lines.push(`✔️ Mais informações: https://coeaboa.lovable.app/`);
  return encodeURIComponent(lines.join("\n"));
}
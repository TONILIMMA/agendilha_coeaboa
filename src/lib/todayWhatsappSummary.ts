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
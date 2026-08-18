import {
  CheckCircle, XCircle, Clock3, type LucideIcon,
} from "lucide-react";

/**
 * Tipos e helpers puros da tela de Gestão de Eventos.
 * Ficam fora do componente pra manter a página enxuta e testável.
 */
export interface AdminSubmission {
  id: string;
  created_at: string;
  user_id: string;
  company_name: string | null;
  responsible_name: string | null;
  email: string | null;
  phone: string | null;
  event_title: string;
  date: string | null;
  start_time: string | null;
  end_time: string | null;
  location: string | null;
  address_street: string | null;
  address_number: string | null;
  address_neighborhood: string | null;
  address_city: string | null;
  address_state: string | null;
  address_zip: string | null;
  description: string | null;
  video_link: string | null;
  category: string | null;
  promotion_type: string | null;
  target_audience: string | null;
  promotion_rules: string | null;
  contact_social: string | null;
  additional_details: string | null;
  status: string;
  is_highlight?: boolean;
  views_count?: number;
  shares_count?: number;
  age_rating?: string;
  is_suitable_for_minors?: boolean;
  report_count?: number;
  moderation_status?: string;
  slug?: string;
  short_copy?: string;
  long_copy?: string;
  approved_at?: string;
  published_at?: string;
  image_url?: string | null;
}

export const categoryLabels: Record<string, string> = {
  musica: "Música / Show",
  gastronomia: "Gastronomia",
  cultura: "Cultura / Arte",
  esporte: "Esporte",
  turismo: "Turismo",
  promocoes: "Promoções / Ofertas",
  outros: "Outros",
};

export const statusConfig: Record<
  string,
  { label: string; color: string; icon: LucideIcon; bg: string; border: string }
> = {
  pendente:  { label: "Pendente",  color: "text-amber-700",   bg: "bg-amber-100",   border: "border-amber-200",   icon: Clock3 },
  aprovado:  { label: "Aprovado",  color: "text-emerald-700", bg: "bg-emerald-100", border: "border-emerald-200", icon: CheckCircle },
  rejeitado: { label: "Rejeitado", color: "text-rose-700",    bg: "bg-rose-100",    border: "border-rose-200",    icon: XCircle },
  ajuste:    { label: "Ajuste",     color: "text-orange-700", bg: "bg-orange-100", border: "border-orange-200", icon: History },
};

export function formatSubmissionDate(iso: string) {
  if (!iso) return "—";
  const date = new Date(iso);
  return (
    date.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" }) +
    " às " +
    date.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })
  );
}

export function formatEventDate(dateStr: string | null) {
  if (!dateStr) return "—";
  // Aceita ISO (YYYY-MM-DD) e DD/MM/YYYY
  if (dateStr.includes("-")) {
    const [y, m, d] = dateStr.split("-");
    return `${d}/${m}/${y}`;
  }
  return dateStr;
}

export function buildWhatsAppMessage(sub: AdminSubmission): string {
  if (sub.short_copy) return encodeURIComponent(sub.short_copy);
  const date = formatEventDate(sub.date);
  const url = sub.slug ? `${window.location.origin}/evento/${sub.slug}` : `${window.location.origin}/agenda`;
  const msg = `🗓️ *${sub.event_title}*\n⏰ ${date} às ${sub.start_time || "--:--"}\n📍 ${sub.location}\n\n🌴 Veja mais no AgendIlha: ${url}`;
  return encodeURIComponent(msg);
}

export function buildApprovalMessage(sub: AdminSubmission): string {
  const name = (sub.responsible_name || "").trim().split(" ")[0];
  const greeting = name ? `Olá, ${name}! 👋` : "Olá! 👋";
  const url = sub.slug
    ? `${window.location.origin}/evento/${sub.slug}`
    : `${window.location.origin}/agenda`;
  return (
    `${greeting}\n\n` +
    `✅ *Seu evento foi aprovado pela curadoria do AgendIlha!*\n\n` +
    `🎉 *${sub.event_title}*\n` +
    `📅 ${formatEventDate(sub.date)}${sub.start_time ? ` às ${sub.start_time}` : ""}\n` +
    (sub.location ? `📍 ${sub.location}\n` : "") +
    `\nJá está publicado na Agenda Cultural:\n${url}\n\n` +
    `Acompanhe seus envios em: ${window.location.origin}/meus-eventos`
  );
}

export function buildRejectionMessage(sub: AdminSubmission, reason?: string | null): string {
  const name = (sub.responsible_name || "").trim().split(" ")[0];
  const greeting = name ? `Olá, ${name}.` : "Olá.";
  const reasonLine = reason?.trim()
    ? `\n📝 *Observação da curadoria:* ${reason.trim()}\n`
    : "";
  return (
    `${greeting}\n\n` +
    `Sobre o evento *${sub.event_title}* enviado ao AgendIlha:\n\n` +
    `❌ Infelizmente ele *não foi aprovado* pela curadoria neste momento.${reasonLine}\n` +
    `Você pode revisar e reenviar a qualquer momento em:\n` +
    `${window.location.origin}/meus-eventos\n\n` +
    `Qualquer dúvida, é só responder por aqui. Obrigado!`
  );
}

export function buildTemplateVars(sub: AdminSubmission, reason?: string | null): Record<string, string> {
  const name = (sub.responsible_name || "").trim().split(" ")[0] || "";
  const url = sub.slug
    ? `${window.location.origin}/evento/${sub.slug}`
    : `${window.location.origin}/agenda`;
  return {
    nome: name,
    titulo: sub.event_title || "",
    data: formatEventDate(sub.date),
    hora: sub.start_time || "--:--",
    local: sub.location || "",
    url,
    motivo: (reason || "").trim(),
    meus_eventos_url: `${window.location.origin}/meus-eventos`,
  };
}

export interface AdminEventsKpiData {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
  ajuste: number;
}

export function computeKpis(submissions: AdminSubmission[]): AdminEventsKpiData {
  return {
    total: submissions.length,
    pending: submissions.filter((s) => s.status === "pendente").length,
    approved: submissions.filter((s) => s.status === "aprovado").length,
    rejected: submissions.filter((s) => s.status === "rejeitado").length,
    ajuste: submissions.filter((s) => s.status === "ajuste").length,
  };
}

export function filterSubmissions(
  submissions: AdminSubmission[],
  opts: { statusFilter: string; categoryFilter: string; search: string },
): AdminSubmission[] {
  let list = [...submissions];
  if (opts.statusFilter !== "all") list = list.filter((s) => s.status === opts.statusFilter);
  if (opts.categoryFilter !== "all") list = list.filter((s) => s.category === opts.categoryFilter);
  const q = opts.search.trim().toLowerCase();
  if (q) {
    list = list.filter(
      (s) =>
        s.event_title.toLowerCase().includes(q) ||
        (s.company_name || "").toLowerCase().includes(q) ||
        (s.location || "").toLowerCase().includes(q) ||
        (s.responsible_name || "").toLowerCase().includes(q),
    );
  }
  return list;
}

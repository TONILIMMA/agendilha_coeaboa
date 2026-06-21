import { formatBrazilianDate } from "@/lib/date-utils";

export interface NotifiableSubmission {
  event_title: string;
  responsible_name?: string | null;
  date?: string | null;
  start_time?: string | null;
  phone?: string | null;
}

/** Mensagem WhatsApp para aprovação/rejeição de eventos. */
export function buildNotificationMessage(
  sub: NotifiableSubmission,
  status: string
): string {
  if (status === "approved" || status === "aprovado") {
    return [
      `✅ *Evento Aprovado!*`,
      ``,
      `Olá${sub.responsible_name ? `, ${sub.responsible_name}` : ""}! Seu evento foi aprovado no *AgendIlha*! 🎉`,
      ``,
      `📌 *${sub.event_title}*`,
      sub.date
        ? `🗓️ ${formatBrazilianDate(sub.date)}${sub.start_time ? ` às ${sub.start_time}` : ""}`
        : "",
      ``,
      `Seu evento será divulgado na agenda cultural da Ilha do Governador.`,
      ``,
      `Acesse: https://coeaboa.lovable.app/`,
    ]
      .filter(Boolean)
      .join("\n");
  }

  return [
    `⚠️ *Atualização sobre seu evento*`,
    ``,
    `Olá${sub.responsible_name ? `, ${sub.responsible_name}` : ""}! Infelizmente seu evento não foi aprovado desta vez.`,
    ``,
    `📌 *${sub.event_title}*`,
    ``,
    `Entre em contato conosco para mais informações ou faça uma nova submissão.`,
    ``,
    `Acesse: https://coeaboa.lovable.app/`,
  ].join("\n");
}

/** Abre o WhatsApp com a mensagem de notificação para o telefone do submitter. */
export function openWhatsappNotification(
  sub: NotifiableSubmission,
  status: string
): boolean {
  if (!sub.phone) return false;
  const phone = sub.phone.replace(/\D/g, "");
  const fullPhone = phone.startsWith("55") ? phone : `55${phone}`;
  const message = encodeURIComponent(buildNotificationMessage(sub, status));
  window.open(`https://wa.me/${fullPhone}?text=${message}`, "_blank");
  return true;
}
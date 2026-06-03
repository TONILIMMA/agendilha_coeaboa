// Utilities to validate Brazilian WhatsApp numbers and build wa.me links.

export function onlyDigits(phone: string): string {
  return (phone ?? "").replace(/\D/g, "");
}

/**
 * Normalize to international format with country code 55 (no '+').
 * Accepts inputs with or without country code.
 */
export function normalizePhone(phone: string): string {
  const d = onlyDigits(phone);
  if (!d) return "";
  return d.startsWith("55") ? d : `55${d}`;
}

/**
 * Strict Brazilian mobile validation.
 * Rules:
 *  - 11 local digits: DDD (2) + 9 + 8 digits
 *  - DDD between 11 and 99
 *  - Mobile prefix MUST start with 9 (Brazilian mobile rule since 2016)
 *  - Optional country code 55
 */
export function isValidBrazilianMobile(phone: string): boolean {
  let d = onlyDigits(phone);
  if (d.startsWith("55")) d = d.slice(2);
  if (d.length !== 11) return false;
  const ddd = parseInt(d.slice(0, 2), 10);
  if (isNaN(ddd) || ddd < 11 || ddd > 99) return false;
  if (d[2] !== "9") return false;
  // No repeated-digit numbers (e.g. 99999999999)
  if (/^(\d)\1+$/.test(d)) return false;
  return true;
}

export function formatPhoneDisplay(value: string): string {
  let d = onlyDigits(value);
  if (d.startsWith("55") && d.length > 11) d = d.slice(2);
  if (d.length <= 2) return d;
  if (d.length <= 7) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7, 11)}`;
}

export interface TempPasswordMessageInput {
  recipientName?: string | null;
  tempPassword: string;
  loginUrl?: string;
  customNote?: string | null;
}

export function buildTempPasswordMessage({
  recipientName,
  tempPassword,
  loginUrl = "https://agendilha.lovable.app/auth",
  customNote,
}: TempPasswordMessageInput): string {
  const name = (recipientName ?? "").trim().split(" ")[0];
  const greeting = name ? `Olá, ${name}! 👋` : "Olá! 👋";
  const extra = customNote?.trim() ? `\n\n📝 ${customNote.trim()}` : "";
  return (
    `🔐 *AgendIlha — Senha temporária*\n\n` +
    `${greeting}\n\n` +
    `Sua nova senha de acesso é: *${tempPassword}*\n\n` +
    `👉 Acesse: ${loginUrl}\n` +
    `Por segurança, você precisará trocar esta senha logo após entrar.${extra}\n\n` +
    `Se você não solicitou esta redefinição, ignore esta mensagem.`
  );
}

export function buildWhatsappUrl(phone: string, message: string): string | null {
  if (!isValidBrazilianMobile(phone)) return null;
  return `https://wa.me/${normalizePhone(phone)}?text=${encodeURIComponent(message)}`;
}
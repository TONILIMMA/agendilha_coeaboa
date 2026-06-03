// Shared helpers for temporary password flows

const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789abcdefghijkmnpqrstuvwxyz";

export function generateTempPassword(length = 10): string {
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  let out = "";
  for (let i = 0; i < length; i++) {
    out += ALPHABET[bytes[i] % ALPHABET.length];
  }
  // Ensure complexity: at least 1 digit
  if (!/\d/.test(out)) {
    out = out.slice(0, -1) + "7";
  }
  return out;
}

export function normalizePhone(phone: string): string {
  const digits = (phone ?? "").replace(/\D/g, "");
  return digits.startsWith("55") ? digits : `55${digits}`;
}

/**
 * Strict Brazilian mobile validation.
 * 11 digits (DDD 11–99, mobile prefix 9), with optional country code 55.
 */
export function isValidBrazilianMobile(phone: string): boolean {
  let d = (phone ?? "").replace(/\D/g, "");
  if (d.startsWith("55")) d = d.slice(2);
  if (d.length !== 11) return false;
  const ddd = parseInt(d.slice(0, 2), 10);
  if (isNaN(ddd) || ddd < 11 || ddd > 99) return false;
  if (d[2] !== "9") return false;
  if (/^(\d)\1+$/.test(d)) return false;
  return true;
}

export interface BuildMessageInput {
  tempPassword: string;
  recipientName?: string | null;
  customNote?: string | null;
  loginUrl?: string;
}

export function buildTempPasswordMessage({
  tempPassword,
  recipientName,
  customNote,
  loginUrl = "https://agendilha.lovable.app/auth",
}: BuildMessageInput): string {
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

export function buildWhatsappUrl(
  phone: string,
  tempPassword: string,
  opts: { recipientName?: string | null; customNote?: string | null } = {},
): string | null {
  if (!isValidBrazilianMobile(phone)) return null;
  const normalized = normalizePhone(phone);
  const message = buildTempPasswordMessage({ tempPassword, ...opts });
  return `https://wa.me/${normalized}?text=${encodeURIComponent(message)}`;
}
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

export function buildWhatsappUrl(phone: string, tempPassword: string): string {
  const normalized = normalizePhone(phone);
  const message =
    `🔐 *AgendIlha — Senha temporária*\n\n` +
    `Sua nova senha de acesso é: *${tempPassword}*\n\n` +
    `Acesse: https://agendilha.lovable.app/auth\n` +
    `Por segurança, você precisará trocar essa senha logo após entrar.`;
  return `https://wa.me/${normalized}?text=${encodeURIComponent(message)}`;
}
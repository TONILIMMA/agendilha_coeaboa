// Utilities to validate Brazilian WhatsApp numbers and build wa.me links.

export function onlyDigits(phone: string): string {
  return (phone ?? "").replace(/\D/g, "");
}

// Lista oficial de DDDs brasileiros válidos (ANATEL).
const VALID_BR_DDDS = new Set<number>([
  11, 12, 13, 14, 15, 16, 17, 18, 19,
  21, 22, 24, 27, 28,
  31, 32, 33, 34, 35, 37, 38,
  41, 42, 43, 44, 45, 46, 47, 48, 49,
  51, 53, 54, 55,
  61, 62, 63, 64, 65, 66, 67, 68, 69,
  71, 73, 74, 75, 77, 79,
  81, 82, 83, 84, 85, 86, 87, 88, 89,
  91, 92, 93, 94, 95, 96, 97, 98, 99,
]);

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
export type PhoneValidation =
  | { valid: true; e164: string; display: string }
  | { valid: false; reason: string };

export function validateBrazilianMobile(phone: string | null | undefined): PhoneValidation {
  let d = onlyDigits(phone ?? "");
  if (!d) return { valid: false, reason: "Telefone não informado." };
  // Strip 00 / + leading
  if (d.startsWith("0055")) d = d.slice(4);
  if (d.startsWith("55") && d.length === 13) d = d.slice(2);
  if (d.length === 10) {
    return { valid: false, reason: "Número fixo não recebe WhatsApp — informe um celular com 11 dígitos (DDD + 9 + 8 dígitos)." };
  }
  if (d.length !== 11) {
    return { valid: false, reason: `Telefone com ${d.length} dígitos — esperado 11 (DDD + 9 + 8 dígitos).` };
  }
  const ddd = parseInt(d.slice(0, 2), 10);
  if (!VALID_BR_DDDS.has(ddd)) {
    return { valid: false, reason: `DDD ${d.slice(0, 2)} não é válido no Brasil.` };
  }
  if (d[2] !== "9") {
    return { valid: false, reason: "Celular brasileiro deve começar com 9 após o DDD." };
  }
  if (/^(\d)\1+$/.test(d)) {
    return { valid: false, reason: "Telefone com todos os dígitos iguais — inválido." };
  }
  return {
    valid: true,
    e164: `55${d}`,
    display: `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7, 11)}`,
  };
}

/** Backwards-compatible boolean helper. */
export function isValidBrazilianMobile(phone: string): boolean {
  return validateBrazilianMobile(phone).valid;
}

/**
 * Máscara de exibição para celular brasileiro.
 * Sanitiza qualquer coisa colada: espaços, hífens, parênteses, "+", "00",
 * prefixo internacional 55, e outros caracteres não numéricos.
 * Sempre devolve no formato "(XX) 9XXXX-XXXX", cortando dígitos excedentes.
 */
export function formatPhoneDisplay(value: string): string {
  if (!value) return "";
  // Remove tudo que não é dígito (isso já cuida de espaços, +, -, (, ), etc.)
  let d = onlyDigits(value);
  // Remove prefixo internacional 00 (ex.: "0055...") ou 55 quando o total
  // excede o comprimento local esperado (11 dígitos).
  if (d.startsWith("00")) d = d.slice(2);
  if (d.startsWith("55") && d.length > 11) d = d.slice(2);
  // Remove um eventual 0 de operadora antes do DDD (ex.: "021 99...")
  if (d.length === 12 && d.startsWith("0")) d = d.slice(1);
  // Limita ao tamanho local máximo (DDD + 9 + 8 = 11 dígitos).
  if (d.length > 11) d = d.slice(0, 11);
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
  const v = validateBrazilianMobile(phone);
  if (!v.valid) return null;
  return `https://wa.me/${v.e164}?text=${encodeURIComponent(message)}`;
}

/** Substitui {{var}} no template. Variáveis ausentes viram string vazia. */
export function renderTemplate(body: string, vars: Record<string, string | null | undefined>): string {
  return body.replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (_, key) => {
    const v = vars[key];
    return v == null ? "" : String(v);
  });
}

export const TEMPLATE_VARIABLES = [
  { key: "nome", desc: "Primeiro nome do responsável" },
  { key: "titulo", desc: "Título do evento" },
  { key: "data", desc: "Data do evento (DD/MM/AAAA)" },
  { key: "hora", desc: "Horário de início" },
  { key: "local", desc: "Local / endereço resumido" },
  { key: "url", desc: "URL pública do evento" },
  { key: "motivo", desc: "Motivo da rejeição (apenas no template de rejeição)" },
  { key: "meus_eventos_url", desc: "Link para /meus-eventos do divulgador" },
] as const;
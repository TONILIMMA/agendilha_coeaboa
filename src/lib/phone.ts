/**
 * Fonte única de verdade pra telefone/WhatsApp no AgendIlha.
 *
 * O WhatsApp é o identificador da conta: ele vira um e-mail sintético
 * (`55DDDNUMERO@phone.agendilha.app`). Se cadastro, login e recuperação
 * normalizarem o número de formas diferentes, a pessoa cria a conta e depois
 * não consegue entrar. Por isso TUDO passa por aqui.
 */

export const PHONE_EMAIL_DOMAIN = "phone.agendilha.app";

export function onlyDigits(value: string | null | undefined): string {
  return (value ?? "").replace(/\D/g, "");
}

/**
 * Devolve o número local (DDD + número, 10 ou 11 dígitos) ou null se inválido.
 * Trata prefixo internacional (+55 / 0055) por TAMANHO, não por "começa com 55" —
 * senão DDD 55 (Santa Maria/RS) era lido como código de país.
 */
export function normalizeBrPhone(value: string | null | undefined): string | null {
  let d = onlyDigits(value);
  if (!d) return null;
  if (d.startsWith("00")) d = d.slice(2);
  if (d.length > 11 && d.startsWith("55")) d = d.slice(2);
  if (d.length === 12 && d.startsWith("0")) d = d.slice(1);
  if (d.length === 11 && d.startsWith("0")) d = d.slice(1);
  if (d.length !== 10 && d.length !== 11) return null;
  return d;
}

/** Só celular serve como identificador de conta: 11 dígitos e 9 depois do DDD. */
export function validateWhatsappForAccount(value: string | null | undefined): string | null {
  const local = normalizeBrPhone(value);
  if (!local) return "Informe o WhatsApp com DDD. Ex: (21) 98765-4321";
  if (local.length === 10) return "Esse número parece fixo. Use o celular com 9 na frente: (21) 98765-4321";
  if (local[2] !== "9") return "Celular brasileiro tem 9 depois do DDD. Ex: (21) 98765-4321";
  if (/^(\d)\1+$/.test(local)) return "Esse número não parece real. Confere aí?";
  return null;
}

export function toE164Digits(value: string | null | undefined): string | null {
  const local = normalizeBrPhone(value);
  return local ? `55${local}` : null;
}

/** E-mail sintético usado no Supabase Auth. */
export function toAuthEmail(value: string | null | undefined): string | null {
  const e164 = toE164Digits(value);
  return e164 ? `${e164}@${PHONE_EMAIL_DOMAIN}` : null;
}

/**
 * Formato antigo (bug histórico): qualquer número começando com "55" era tratado
 * como já tendo código de país. Contas criadas assim ainda existem, então o login
 * tenta esse formato como segunda opção.
 */
export function toLegacyAuthEmail(value: string | null | undefined): string | null {
  const d = onlyDigits(value);
  if (!d) return null;
  const full = d.startsWith("55") ? d : `55${d}`;
  return `${full}@${PHONE_EMAIL_DOMAIN}`;
}

/** Máscara de digitação: (21) 98765-4321 */
export function maskBrPhone(value: string): string {
  let d = onlyDigits(value);
  if (d.startsWith("00")) d = d.slice(2);
  if (d.length > 11 && d.startsWith("55")) d = d.slice(2);
  d = d.slice(0, 11);
  if (d.length <= 2) return d;
  if (d.length <= 7) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}

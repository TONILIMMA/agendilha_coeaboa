/** PIN de 4 dígitos usado no acesso admin e na recuperação de senha. */
export const PIN_REGEX = /^\d{4}$/;

const WEAK_PINS = ["0000", "1111", "1234"];

export const onlyPinDigits = (value: string) => value.replace(/\D/g, "").slice(0, 4);

/** Retorna a mensagem de erro ou null quando o PIN é válido. */
export function validatePin(pin: string, confirmPin?: string): string | null {
  if (!PIN_REGEX.test(pin)) return "O PIN deve ter exatamente 4 números";
  if (WEAK_PINS.includes(pin)) return "Escolha um PIN menos previsível (evite 0000, 1111, 1234)";
  if (confirmPin !== undefined && pin !== confirmPin) return "Os PINs não coincidem";
  return null;
}

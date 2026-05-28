import { z } from "zod";

/**
 * Regex para validar telefones brasileiros com ou sem prefixo +55.
 * Aceita:
 * - +5511999999999
 * - 11999999999
 * - 1188888888 (fixo)
 */
export const PHONE_REGEX = /^(\+55)?\d{10,11}$/;

export const phoneSchema = z.string()
  .trim()
  .min(10, "Telefone deve ter pelo menos 10 dígitos")
  .max(16, "Telefone muito longo")
  .refine((val) => PHONE_REGEX.test(val.replace(/\s+/g, "")), {
    message: "Formato de telefone inválido (ex: 11999999999)",
  });

/**
 * Normaliza o número de telefone para salvar apenas dígitos.
 */
export const normalizePhone = (phone: string) => {
  return phone.replace(/\D/g, "");
};

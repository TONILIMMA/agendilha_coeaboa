import { z } from "zod";
import { isValidBrazilianMobile, normalizePhone } from "@/lib/whatsapp";

export const phoneSchema = z
  .string()
  .min(10, "Telefone obrigatório")
  .refine((v) => isValidBrazilianMobile(v), "Celular brasileiro inválido")
  .transform((v) => normalizePhone(v));

export const passwordSchema = z
  .string()
  .min(8, "Mínimo 8 caracteres")
  .max(72, "Máximo 72 caracteres");

export const loginSchema = z.object({
  phone: phoneSchema,
  password: passwordSchema,
});

export const resetPasswordSchema = z.object({
  phone: phoneSchema,
});

export type LoginInput = z.infer<typeof loginSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
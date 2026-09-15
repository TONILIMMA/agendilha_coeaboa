import { z } from "zod";
import { isValidBrazilianMobile, normalizePhone } from "@/lib/whatsapp";

// Telefone opcional no front-end: valida só o formato quando algo é digitado.
// A autenticação real ainda é feita pelo backend do Supabase, que rejeita
// credenciais vazias.
export const phoneSchema = z
  .string()
  .optional()
  .or(z.literal(""))
  .refine((v) => !v || isValidBrazilianMobile(v), "Celular brasileiro inválido")
  .transform((v) => (v ? normalizePhone(v) : ""));

export const passwordSchema = z
  .string()
  .max(72, "Máximo 72 caracteres")
  .optional()
  .or(z.literal(""));

export const loginSchema = z.object({
  phone: phoneSchema,
  password: passwordSchema,
});

export const resetPasswordSchema = z.object({
  phone: phoneSchema,
});

export type LoginInput = z.infer<typeof loginSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;

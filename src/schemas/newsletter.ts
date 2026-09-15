import { z } from "zod";
import { isValidBrazilianMobile, normalizePhone } from "@/lib/whatsapp";

export const newsletterSubscribeSchema = z.object({
  phone: z
    .string()
    .optional()
    .or(z.literal(""))
    .refine((v) => !v || isValidBrazilianMobile(v), "Informe um celular brasileiro válido")
    .transform((v) => (v ? normalizePhone(v) : "")),
  name: z.string().trim().min(2, "Nome muito curto").max(120).optional().or(z.literal("")),
  neighborhood: z.string().trim().max(80).optional().or(z.literal("")),
  whatsappConsent: z.boolean().optional().default(false),
});

export type NewsletterSubscribeInput = z.infer<typeof newsletterSubscribeSchema>;

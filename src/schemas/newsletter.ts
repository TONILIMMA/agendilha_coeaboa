import { z } from "zod";
import { isValidBrazilianMobile, normalizePhone } from "@/lib/whatsapp";

export const newsletterSubscribeSchema = z.object({
  phone: z
    .string()
    .min(10, "Telefone obrigatório")
    .refine((v) => isValidBrazilianMobile(v), "Informe um celular brasileiro válido")
    .transform((v) => normalizePhone(v)),
  name: z.string().trim().min(2, "Nome muito curto").max(120).optional().or(z.literal("")),
  neighborhood: z.string().trim().max(80).optional().or(z.literal("")),
  whatsappConsent: z
    .boolean()
    .refine((v) => v === true, "É necessário autorizar o contato pelo WhatsApp"),
});

export type NewsletterSubscribeInput = z.infer<typeof newsletterSubscribeSchema>;
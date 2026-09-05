import { useState } from "react";
import { UseFormReturn } from "react-hook-form";
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { MessageCircle, Copy, Check } from "lucide-react";
import { toast } from "sonner";
import { formatPhoneDisplay, validateBrazilianMobile, buildWhatsappUrl } from "@/lib/whatsapp";

/**
 * WhatsApp que vai receber as dúvidas do público.
 * Máscara automática, validação flexível e pré-visualização do link gerado.
 */
export function DuvidasWhatsappField({ form }: { form: UseFormReturn<any> }) {
  const value: string = form.watch("duvidasWhatsapp") || "";
  const validation = validateBrazilianMobile(value);
  const link = validation.valid ? buildWhatsappUrl(value, "") : null;

  return (
    <div className="space-y-3">
      <div className="space-y-1">
        <h2 className="text-xl font-bold text-primary flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500 text-white">
            <MessageCircle className="h-4 w-4" />
          </span>
          WhatsApp para dúvidas
        </h2>
        <p className="text-sm text-muted-foreground">
          É esse número que o público vai usar pra perguntar sobre o rolê.
        </p>
      </div>

      <FormField
        control={form.control}
        name="duvidasWhatsapp"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Número com DDD *</FormLabel>
            <FormControl>
              <Input
                placeholder="(21) 99999-9999"
                inputMode="tel"
                maxLength={16}
                className="h-12 text-base"
                {...field}
                value={field.value ?? ""}
                autoComplete="tel"
                onChange={(e) => field.onChange(formatPhoneDisplay(e.target.value))}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      {link && (
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-2">
          <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-700 dark:text-emerald-400">
            Link gerado
          </p>
          <p className="text-xs break-all text-emerald-800 dark:text-emerald-300">{link.split("?")[0]}</p>
        </div>
      )}
    </div>
  );
}

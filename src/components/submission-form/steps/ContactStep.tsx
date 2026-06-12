import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { UseFormReturn } from "react-hook-form";
import { User, Phone } from "lucide-react";
import { formatPhoneDisplay, validateBrazilianMobile } from "@/lib/whatsapp";

export function ContactStep({ form }: { form: UseFormReturn<any> }) {
  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="space-y-2">
        <h2 className="text-xl font-bold text-primary flex items-center gap-2">
          <User className="h-5 w-5" />
          Como podemos te identificar?
        </h2>
        <p className="text-sm text-muted-foreground">Esses dados nos ajudam a entrar em contato caso precise.</p>
      </div>

      <FormField
        control={form.control}
        name="nickName"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Seu nome ou apelido</FormLabel>
            <FormControl>
              <Input placeholder="Como quer ser chamado?" className="h-12" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="basicPhone"
        render={({ field }) => {
          const v = validateBrazilianMobile(field.value);
          const showOk = field.value && v.valid;
          return (
          <FormItem>
            <FormLabel className="flex items-center gap-2">
              <Phone className="h-4 w-4" />
              WhatsApp para contato
            </FormLabel>
            <FormControl>
              <Input 
                placeholder="(11) 99999-9999"
                inputMode="tel"
                maxLength={16}
                className="h-12" 
                {...field} 
                onChange={(e) => {
                  field.onChange(formatPhoneDisplay(e.target.value));
                }}
              />
            </FormControl>
            {showOk ? (
              <p className="text-xs text-emerald-600">✓ Celular válido para receber WhatsApp.</p>
            ) : (
              <p className="text-xs text-muted-foreground">
                Use DDD + 9 + 8 dígitos. Apenas celulares brasileiros recebem WhatsApp.
              </p>
            )}
            <FormMessage />
          </FormItem>
          );
        }}
      />
    </div>
  );
}

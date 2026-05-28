import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { UseFormReturn } from "react-hook-form";
import { User, Phone } from "lucide-react";

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
        render={({ field }) => (
          <FormItem>
            <FormLabel className="flex items-center gap-2">
              <Phone className="h-4 w-4" />
              WhatsApp para contato
            </FormLabel>
            <FormControl>
              <Input 
                placeholder="11999999999" 
                className="h-12" 
                {...field} 
                onChange={(e) => {
                  const val = e.target.value.replace(/[^\d+]/g, "");
                  field.onChange(val);
                }}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
}

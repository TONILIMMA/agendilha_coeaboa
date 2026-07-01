import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Checkbox } from "@/components/ui/checkbox";
import { UseFormReturn } from "react-hook-form";
import { Scale, Info } from "lucide-react";

export function LegalStep({ form }: { form: UseFormReturn<any> }) {
  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="space-y-2">
        <h2 className="text-xl font-bold text-primary flex items-center gap-2">
          <Scale className="h-5 w-5" />
          Termos e Responsabilidade
        </h2>
        <p className="text-sm text-muted-foreground">Leia com atenção antes de finalizar.</p>
      </div>

      <div className="p-4 bg-muted/50 rounded-lg border border-muted space-y-3 text-sm text-muted-foreground">
        <div className="flex gap-2 text-primary font-bold">
          <Info className="h-4 w-4 shrink-0 mt-0.5" />
          <span>Combinado antes de mandar</span>
        </div>
        <p>1. Você garante que as informações do rolê são verdadeiras.</p>
        <p>2. A gente dá uma olhada rápida antes de publicar no AgendIlha.</p>
        <p>3. Se rolar algo impróprio ou falso, tiramos do ar.</p>
      </div>

      <FormField
        control={form.control}
        name="legalAcceptance"
        render={({ field }) => (
          <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
            <FormControl>
              <Checkbox
                checked={field.value}
                onCheckedChange={field.onChange}
              />
            </FormControl>
            <div className="space-y-1 leading-none">
              <FormLabel className="cursor-pointer">
                Declaro que as informações deste evento são verdadeiras e que estou ciente das regras de divulgação do AgendIlha.
              </FormLabel>
              <FormMessage />
            </div>
          </FormItem>
        )}
      />
    </div>
  );
}

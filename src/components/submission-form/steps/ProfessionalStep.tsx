import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { UseFormReturn } from "react-hook-form";
import { Building2, Mail } from "lucide-react";
import { CepField } from "../FormFields";

export function ProfessionalStep({ form }: { form: UseFormReturn<any> }) {
  const onCepFound = (data: any) => {
    form.setValue("addressStreet", data.logradouro || "");
    form.setValue("addressNeighborhood", data.bairro || "");
    form.setValue("addressCity", data.localidade || "");
    form.setValue("addressState", data.uf || "");
  };

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="space-y-2">
        <h2 className="text-xl font-bold text-primary flex items-center gap-2">
          <Building2 className="h-5 w-5" />
          Dados da Empresa/Promotor
        </h2>
        <p className="text-sm text-muted-foreground">Informações para emissão e organização.</p>
      </div>

      <FormField
        control={form.control}
        name="companyName"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Nome da Empresa ou Produtor</FormLabel>
            <FormControl>
              <Input placeholder="Ex: Agência de Eventos LTDA" className="h-12" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="email"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="flex items-center gap-2">
              <Mail className="h-4 w-4" />
              E-mail (opcional)
            </FormLabel>
            <FormControl>
              <Input placeholder="seu@email.com" className="h-12" type="email" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <CepField control={form.control} onCepFound={onCepFound} />
        <FormField
          control={form.control}
          name="addressStreet"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Rua</FormLabel>
              <FormControl>
                <Input placeholder="Logradouro" className="h-12" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <FormField
        control={form.control}
        name="addressNumber"
        render={({ field }) => (
          <FormItem className="sm:w-1/3">
            <FormLabel>Número</FormLabel>
            <FormControl>
              <Input placeholder="123" className="h-12" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
}

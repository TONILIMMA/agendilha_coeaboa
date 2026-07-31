import { FormField, FormItem, FormLabel, FormControl, FormMessage, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { UseFormReturn } from "react-hook-form";
import { Building2, Mail, Info } from "lucide-react";
import { CepField } from "../FormFields";
import { Alert, AlertDescription } from "@/components/ui/alert";

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

      <Alert variant="default" className="bg-primary/5 border-primary/20">
        <Info className="h-4 w-4 text-primary" />
        <AlertDescription className="text-xs text-primary/80">
          Como promotor logado, seus dados foram vinculados automaticamente. Você pode alterá-los se este evento pertencer a outra organização.
        </AlertDescription>
      </Alert>

      <FormField
        control={form.control}
        name="companyName"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Nome da Empresa ou Produtor</FormLabel>
            <FormControl>
              <Input
                placeholder="Ex: Agência de Eventos LTDA"
                className="h-12"
                {...field}
                name="organization"
                autoComplete="organization"
              />
            </FormControl>
            <FormDescription className="text-[10px]">
              O promotor responsável será vinculado a este nome.
            </FormDescription>
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
              <Input
                placeholder="seu@email.com"
                className="h-12"
                type="email"
                {...field}
                name="email"
                autoComplete="email"
              />
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
                <Input
                  placeholder="Logradouro"
                  className="h-12"
                  {...field}
                  name="address-line1"
                  autoComplete="address-line1"
                />
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
              <Input
                placeholder="123"
                className="h-12"
                {...field}
                name="address-line2"
                autoComplete="address-line2"
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
}

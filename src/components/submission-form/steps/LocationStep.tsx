import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UseFormReturn } from "react-hook-form";
import { MapPin } from "lucide-react";
import {
  EstabelecimentoAutocomplete,
  type EstabelecimentoSuggestion,
} from "@/components/estabelecimentos/EstabelecimentoAutocomplete";

export function LocationStep({ form }: { form: UseFormReturn<any> }) {
  const handleSelectEstab = (s: EstabelecimentoSuggestion) => {
    form.setValue("locationName", s.nome, { shouldValidate: true });
    form.setValue("estabelecimentoId", s.id);
    const enderecoCompleto = [s.endereco, s.numero, s.bairro].filter(Boolean).join(", ");
    if (enderecoCompleto) form.setValue("eventAddress", enderecoCompleto, { shouldValidate: true });
    if (s.bairro) form.setValue("addressNeighborhood", s.bairro);
    if (s.tipo) form.setValue("locationType", s.tipo);
    if (s.contato) form.setValue("locationContact", s.contato);
  };

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="space-y-2">
        <h2 className="text-xl font-bold text-primary flex items-center gap-2">
          <MapPin className="h-5 w-5" />
          Local do Evento
        </h2>
        <p className="text-sm text-muted-foreground">
          Comece digitando o nome — se o local já existir, preenchemos o resto pra você.
        </p>
      </div>

      <FormField
        control={form.control}
        name="locationName"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Nome do Local</FormLabel>
            <FormControl>
              <EstabelecimentoAutocomplete
                value={field.value ?? ""}
                onChange={(v) => {
                  field.onChange(v);
                  // Se o usuário editar manualmente após selecionar, desfaz o vínculo
                  if (form.getValues("estabelecimentoId")) {
                    form.setValue("estabelecimentoId", "");
                  }
                }}
                onSelect={handleSelectEstab}
                placeholder="Nome da casa, bar, praça..."
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="eventAddress"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Endereço Completo</FormLabel>
            <FormControl>
              <Input placeholder="Rua, número, bairro, cidade" className="h-12" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FormField
          control={form.control}
          name="locationType"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tipo do Local</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger className="h-12">
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="commercial">Estabelecimento Comercial</SelectItem>
                  <SelectItem value="public">Espaço Público</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="locationContact"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Contato do Responsável</FormLabel>
              <FormControl>
                <Input placeholder="WhatsApp ou E-mail" className="h-12" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </div>
  );
}

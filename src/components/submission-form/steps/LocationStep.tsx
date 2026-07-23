import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UseFormReturn } from "react-hook-form";
import { MapPin } from "lucide-react";
import {
  EstabelecimentoAutocomplete,
  type EstabelecimentoSuggestion,
} from "@/components/estabelecimentos/EstabelecimentoAutocomplete";
import { BAIRROS, PLACEHOLDER_BAIRRO } from "@/lib/neighborhoods";

const LOCAL_TIPOS = [
  { v: "bar", l: "Bar" },
  { v: "restaurante", l: "Restaurante" },
  { v: "casa_show", l: "Casa de show" },
  { v: "praca", l: "Praça / espaço público" },
  { v: "clube", l: "Clube" },
  { v: "espaco_cultural", l: "Espaço cultural" },
  { v: "outro", l: "Outro" },
] as const;

export function LocationStep({ form }: { form: UseFormReturn<any> }) {
  const handleSelectEstab = (s: EstabelecimentoSuggestion) => {
    form.setValue("locationName", s.nome, { shouldValidate: true });
    form.setValue("estabelecimentoId", s.id);
    const enderecoCompleto = [s.endereco, s.numero, s.bairro].filter(Boolean).join(", ");
    if (enderecoCompleto) form.setValue("eventAddress", enderecoCompleto, { shouldValidate: true });
    if (s.bairro) form.setValue("addressNeighborhood", s.bairro, { shouldValidate: true });
    if (s.tipo) form.setValue("locationType", s.tipo);
    if (s.contato) form.setValue("locationContact", s.contato);
  };

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="space-y-2">
        <h2 className="text-xl font-bold text-primary flex items-center gap-2">
          <MapPin className="h-5 w-5" />
          Local/Estabelecimento
        </h2>
        <p className="text-sm text-muted-foreground">
          Onde o rolê vai acontecer? Comece pelo nome — se o local já estiver cadastrado, a gente preenche o resto.
        </p>
      </div>

      <FormField
        control={form.control}
        name="locationName"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Nome do local/estabelecimento *</FormLabel>
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
                placeholder="Ex.: Bar do Zé, Praça Jerusalém, Ilha Plaza..."
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FormField
          control={form.control}
          name="localTipo"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tipo de local *</FormLabel>
              <Select onValueChange={field.onChange} value={field.value || ""}>
                <FormControl>
                  <SelectTrigger className="h-12">
                    <SelectValue placeholder="Bar, restaurante, praça..." />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {LOCAL_TIPOS.map((t) => (
                    <SelectItem key={t.v} value={t.v}>{t.l}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="addressNeighborhood"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Bairro do local *</FormLabel>
              <Select onValueChange={field.onChange} value={field.value || ""}>
                <FormControl>
                  <SelectTrigger className="h-12">
                    <SelectValue placeholder={PLACEHOLDER_BAIRRO} />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {BAIRROS.map((b) => (
                    <SelectItem key={b} value={b}>{b}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <FormField
        control={form.control}
        name="eventAddress"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Endereço resumido *</FormLabel>
            <FormControl>
              <Input placeholder="Ex.: Rua X, 123 — próximo à Praça Y" className="h-12" {...field} />
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
              <FormLabel>Categoria do espaço</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger className="h-12">
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="commercial">Local/Estabelecimento comercial</SelectItem>
                  <SelectItem value="public">Espaço público</SelectItem>
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
              <FormLabel>Contato do local (opcional)</FormLabel>
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

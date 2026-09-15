import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { SuggestInput } from "@/components/ui/SuggestInput";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UseFormReturn } from "react-hook-form";
import { MapPin } from "lucide-react";
import {
  EstabelecimentoAutocomplete,
  type EstabelecimentoSuggestion,
} from "@/components/estabelecimentos/EstabelecimentoAutocomplete";
import { NovoEstabelecimentoDialog } from "@/components/estabelecimentos/NovoEstabelecimentoDialog";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { AutofillIssues } from "../AutofillIssues";
import { checkLocationAutofill, formatCep, cepDigits, validateCep } from "@/lib/autofillValidation";
import { formatPhoneDisplay } from "@/lib/whatsapp";

const LOCAL_TIPOS = [
  { v: "bar", l: "Bar" },
  { v: "restaurante", l: "Restaurante" },
  { v: "casa_show", l: "Casa de show" },
  { v: "quiosque", l: "Quiosque" },
  { v: "praca", l: "Praça / espaço público" },
  { v: "clube", l: "Clube" },
  { v: "espaco_cultural", l: "Espaço cultural" },
  { v: "outro", l: "Outro" },
] as const;

export function LocationStep({ form }: { form: UseFormReturn<any> }) {
  const [novoLocal, setNovoLocal] = useState(false);
  const [cepLoading, setCepLoading] = useState(false);
  const [novoLocalOpen, setNovoLocalOpen] = useState(false);
  const [novoLocalNome, setNovoLocalNome] = useState("");

  const watched = form.watch([
    "locationName",
    "localTipo",
    "addressNeighborhood",
    "eventAddress",
    "locationCep",
    "locationContact",
    "locationType",
  ]);
  const issues = checkLocationAutofill({
    locationName: watched[0],
    localTipo: watched[1],
    addressNeighborhood: watched[2],
    eventAddress: watched[3],
    locationCep: watched[4],
    locationContact: watched[5],
    locationType: watched[6],
  });

  const buscarCep = async (raw: string) => {
    const d = cepDigits(raw);
    if (d.length !== 8 || validateCep(d).valid === false) return;
    setCepLoading(true);
    try {
      const res = await fetch(`https://viacep.com.br/ws/${d}/json/`);
      const data = await res.json();
      if (data?.erro) return;
      const endereco = [data.logradouro, data.bairro].filter(Boolean).join(", ");
      if (endereco) form.setValue("eventAddress", endereco, { shouldValidate: true });
      if (data.bairro) form.setValue("addressNeighborhood", data.bairro, { shouldValidate: true });
      if (data.localidade) form.setValue("addressCity", data.localidade);
      if (data.uf) form.setValue("addressState", data.uf);

    } catch {
      /* silencioso — o usuário ainda pode digitar à mão */
    } finally {
      setCepLoading(false);
    }
  };

  const iniciarNovoLocal = (nome: string) => {
    // Abre o modal já com o que foi digitado — nada de redigitar.
    setNovoLocal(true);
    setNovoLocalNome(nome);
    form.setValue("locationName", nome, { shouldValidate: true });
    form.setValue("estabelecimentoId", "");
    setNovoLocalOpen(true);
  };

  const handleSelectEstab = (s: EstabelecimentoSuggestion) => {
    form.setValue("locationName", s.nome, { shouldValidate: true });
    form.setValue("estabelecimentoId", s.id);
    const enderecoCompleto = [s.endereco, s.numero, s.bairro].filter(Boolean).join(", ");
    if (enderecoCompleto) form.setValue("eventAddress", enderecoCompleto, { shouldValidate: true });
    if (s.bairro) form.setValue("addressNeighborhood", s.bairro, { shouldValidate: true });
    if (s.tipo) {
      form.setValue("localTipo", s.tipo, { shouldValidate: true });
      form.setValue(
        "locationType",
        ["praca", "outro"].includes(s.tipo) ? "public" : "commercial",
      );
    }
    if (s.contato) form.setValue("locationContact", formatPhoneDisplay(s.contato), { shouldValidate: true });
    if (s.cep) form.setValue("locationCep", formatCep(s.cep), { shouldValidate: true });
    setNovoLocal(false);
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
                onCreateNew={iniciarNovoLocal}
                placeholder="Ex.: Bar do Zé, Praça Jerusalém, Ilha Plaza..."
              />
            </FormControl>
            {novoLocal && !form.watch("estabelecimentoId") && (
              <Badge variant="secondary" className="mt-1" data-testid="novo-local-badge">
                Novo local — preencha os dados abaixo que a gente cadastra ao enviar
              </Badge>
            )}
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
              <FormLabel>Tipo de local <span className="text-xs font-normal text-muted-foreground">(opcional)</span></FormLabel>
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

      </div>

      <FormField
        control={form.control}
        name="locationCep"
        render={({ field }) => {
          const v = validateCep(field.value);
          const filled = (field.value ?? "").trim().length > 0;
          return (
            <FormItem>
              <FormLabel>CEP do local (opcional)</FormLabel>
              <FormControl>
                <Input
                  placeholder="00000-000"
                  inputMode="numeric"
                  maxLength={9}
                  className="h-12"
                  {...field}
                  name="postal-code"
                  autoComplete="postal-code"
                  value={field.value ?? ""}
                  onChange={(e) => {
                    const masked = formatCep(e.target.value);
                    field.onChange(masked);
                    if (cepDigits(masked).length === 8) buscarCep(masked);
                  }}
                />
              </FormControl>
              {cepLoading ? (
                <p className="text-xs text-muted-foreground">Buscando endereço...</p>
              ) : filled && v.valid ? (
                <p className="text-xs text-emerald-600">✓ CEP válido.</p>
              ) : filled && v.valid === false ? (
                <p className="text-xs text-destructive">{v.reason}</p>
              ) : (
                <p className="text-xs text-muted-foreground">Digitou o CEP? A gente preenche rua e bairro.</p>
              )}
              <FormMessage />
            </FormItem>
          );
        }}
      />

      <FormField
        control={form.control}
        name="eventAddress"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Endereço resumido *</FormLabel>
            <FormControl>
              <SuggestInput
                placeholder="Ex.: Rua X, 123 — próximo à Praça Y"
                className="h-12"
                suggestFrom="estabelecimentos_public"
                suggestColumn="endereco"
                {...field}
                name="street-address"
                autoComplete="street-address"
              />
            </FormControl>
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
            <FormControl>
              <SuggestInput
                placeholder="Ex.: Jardim Guanabara"
                className="h-12"
                suggestFrom="estabelecimentos_public"
                suggestColumn="bairro"
                {...field}
                value={field.value ?? ""}
                name="address-level3"
                autoComplete="address-level3"
              />
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
                <Input
                  placeholder="(21) 99999-9999"
                  inputMode="tel"
                  maxLength={16}
                  className="h-12"
                  {...field}
                  name="tel"
                  autoComplete="tel"
                  onChange={(e) => field.onChange(formatPhoneDisplay(e.target.value))}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <AutofillIssues
        issues={issues}
        okMessage="Dados do local conferidos — telefone, CEP/endereço e tipo estão ok."
      />
    </div>
  );
}

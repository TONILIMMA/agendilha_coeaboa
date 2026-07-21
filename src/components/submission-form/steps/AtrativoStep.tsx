import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UseFormReturn } from "react-hook-form";
import { Music, Search, Info, Lock } from "lucide-react";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { formatPhoneDisplay, validateBrazilianMobile } from "@/lib/whatsapp";

const CATEGORIES = [
  { value: "musica", label: "Música / Show" },
  { value: "gastronomia", label: "Gastronomia" },
  { value: "cultura", label: "Cultura / Arte" },
  { value: "esporte", label: "Esporte" },
  { value: "turismo", label: "Turismo" },
  { value: "outros", label: "Outros" },
];

export function AtrativoStep({ form }: { form: UseFormReturn<any> }) {
  const [suggestions, setSuggestions] = useState<any[]>([]);

  const searchAtrativo = async (query: string) => {
    if (query.trim().length < 2) {
      setSuggestions([]);
      return;
    }
    const q = query.trim();
    const [atrativosRes, artistsRes] = await Promise.all([
      supabase
        .from("atrativos")
        .select("id, name, type, tipo_atrativo, style, estilos, description, contact_whatsapp")
        .ilike("name", `%${q}%`)
        .eq("is_approved", true)
        .limit(6),
      supabase
        .from("artist_profiles")
        .select("id, name, artist_type, genre, bio, whatsapp, is_approved")
        .ilike("name", `%${q}%`)
        .eq("is_approved", true)
        .limit(4),
    ]);

    const merged = [
      ...((atrativosRes.data ?? []).map((a: any) => ({
        id: `atr-${a.id}`,
        name: a.name,
        type: a.tipo_atrativo || a.type || "",
        style: (Array.isArray(a.estilos) ? a.estilos.join(", ") : "") || a.style || "",
        description: a.description || "",
        contact: a.contact_whatsapp || "",
        category: "",
        approved: true,
      }))),
      ...((artistsRes.data ?? []).map((s: any) => ({
        id: `art-${s.id}`,
        name: s.name,
        type: s.artist_type || "",
        style: s.genre || "",
        description: s.bio || "",
        contact: s.whatsapp || "",
        category: "musica",
        approved: true,
      }))),
    ];
    setSuggestions(merged);
  };

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="space-y-2">
        <h2 className="text-xl font-bold text-primary flex items-center gap-2">
          <Music className="h-5 w-5" />
          Atrativo do Evento
        </h2>
        <p className="text-sm text-muted-foreground">Quem é a estrela do rolê?</p>
      </div>

      {/* 1. Nome do atrativo */}
      <div className="relative">
        <FormField
          control={form.control}
          name="atrativoName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nome do atrativo *</FormLabel>
              <FormControl>
                <div className="relative">
                  <Input
                    placeholder="Banda, DJ, artista, ponto turístico..."
                    className="h-12 pr-10"
                    {...field}
                    onChange={(e) => {
                      field.onChange(e);
                      searchAtrativo(e.target.value);
                    }}
                  />
                  <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground/50" />
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        {suggestions.length > 0 && (
          <div className="absolute z-50 w-full mt-1 bg-background border rounded-lg shadow-lg overflow-hidden">
            {suggestions.map((s) => (
              <button
                key={s.id}
                type="button"
                className="w-full px-4 py-2 text-left hover:bg-muted transition-colors text-sm"
                onClick={() => {
                  form.setValue("atrativoName", s.name);
                  form.setValue("atrativoType", s.type || "");
                  form.setValue("atrativoStyle", s.style || "");
                  form.setValue("atrativoDescription", s.description || "");
                  form.setValue("atrativoContact", s.contact || "");
                  if (s.category) form.setValue("atrativoCategory", s.category);
                  setSuggestions([]);
                }}
              >
                <span className="font-bold">{s.name}</span>
                {s.type && <span className="text-muted-foreground ml-2">({s.type})</span>}
              </button>
            ))}
          </div>
        )}
        <p className="text-[11px] text-muted-foreground mt-1 flex items-start gap-1">
          <Lock className="h-3 w-3 mt-0.5 shrink-0" />
          Depois de aprovado, o cadastro do atrativo só é alterado pela nossa equipe — abra um chamado se precisar mudar algo.
        </p>
      </div>

      {/* 2. Contato do atrativo */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FormField
          control={form.control}
          name="atrativoContact"
          render={({ field }) => {
            const v = validateBrazilianMobile(field.value);
            const showOk = field.value && v.valid;
            const showErr = field.value && !v.valid;
            return (
              <FormItem>
                <FormLabel>Celular / WhatsApp *</FormLabel>
                <FormControl>
                  <Input
                    placeholder="(21) 99999-9999"
                    inputMode="tel"
                    maxLength={16}
                    className="h-12"
                    {...field}
                    onChange={(e) => field.onChange(formatPhoneDisplay(e.target.value))}
                    onBlur={() => {
                      field.onBlur();
                      form.trigger("atrativoContact");
                    }}
                  />
                </FormControl>
                {showOk ? (
                  <p className="text-xs text-emerald-600">✓ Celular válido para receber WhatsApp.</p>
                ) : showErr && "reason" in v ? (
                  <p className="text-xs text-destructive">{v.reason}</p>
                ) : (
                  <p className="text-xs text-muted-foreground">DDD + 9 + 8 dígitos.</p>
                )}
                <FormMessage />
              </FormItem>
            );
          }}
        />
        <FormField
          control={form.control}
          name="atrativoEmail"
          render={({ field }) => (
            <FormItem>
              <FormLabel>E-mail (opcional)</FormLabel>
              <FormControl>
                <Input
                  type="email"
                  placeholder="contato@exemplo.com"
                  className="h-12"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      {/* 3. Categoria */}
      <FormField
        control={form.control}
        name="atrativoCategory"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Categoria *</FormLabel>
            <Select onValueChange={field.onChange} value={field.value || ""}>
              <FormControl>
                <SelectTrigger className="h-12">
                  <SelectValue placeholder="Selecione uma categoria" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {CATEGORIES.map((c) => (
                  <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Separador de opcionais */}
      <div className="pt-2">
        <div className="flex items-center gap-3">
          <div className="h-px flex-1 bg-border" />
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Campos opcionais
          </span>
          <div className="h-px flex-1 bg-border" />
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          Preencha se quiser dar mais contexto sobre o atrativo. Pode pular sem problema.
        </p>
      </div>

      {/* 4. Tipo / Estilo */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FormField
          control={form.control}
          name="atrativoType"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tipo</FormLabel>
              <FormControl>
                <Input placeholder="Ex: DJ, banda, guia, palestrante" className="h-12" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="atrativoStyle"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Estilo / Gênero</FormLabel>
              <FormControl>
                <Input placeholder="Ex: Sertanejo, Rock, Tech House" className="h-12" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      {/* 5. Descrição */}
      <FormField
        control={form.control}
        name="atrativoDescription"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="flex items-center gap-2">
              <Info className="h-4 w-4" />
              Descrição do atrativo
            </FormLabel>
            <FormControl>
              <Textarea
                placeholder="Conte um pouco sobre o trabalho do artista ou o atrativo..."
                className="min-h-[100px] resize-none"
                {...field}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
}
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { UseFormReturn } from "react-hook-form";
import { Music, Link2, Unlink, Check } from "lucide-react";
import { useEffect, useState } from "react";
import { onEntityCreated } from "@/lib/entityEvents";
import { formatPhoneDisplay, validateBrazilianMobile } from "@/lib/whatsapp";
import { QUICK_CATEGORIES, normalizeName } from "@/lib/atrativoLink";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { AtrativoAutocomplete } from "@/components/atrativos/AtrativoAutocomplete";

export const CATEGORIES = QUICK_CATEGORIES;

/**
 * Bloco "Atrativo responsável pelo evento".
 * Só os campos essenciais: nome (com busca), WhatsApp, e-mail (opcional) e categoria.
 * O vínculo (ou a criação automática) do atrativo acontece ao salvar o evento.
 */
export function AtrativoStep({ form }: { form: UseFormReturn<any> }) {
  const [refreshKey, setRefreshKey] = useState(0);
  useEffect(() => onEntityCreated("atrativo", () => setRefreshKey((k) => k + 1)), []);

  const sourceId: string | undefined = form.watch("atrativoSourceId");
  const linkedName: string | undefined = form.watch("atrativoLinkedName");

  const linkSuggestion = (row: any) => {
    const isArtist = row.__kind === "artist" || row.artist_type != null;
    form.setValue("atrativoName", row.name ?? "", { shouldDirty: true, shouldValidate: true });
    form.setValue("atrativoSourceId", row.id, { shouldDirty: true });
    form.setValue("atrativoSourceType", isArtist ? "artist" : "atrativo", { shouldDirty: true });
    form.setValue("atrativoLinkedName", row.name ?? "", { shouldDirty: true });
    form.setValue("atrativoLinkedAt", new Date().toISOString(), { shouldDirty: true });

    // Preenchimento automático dos dados do atrativo (tipo, estilo, descrição, contato).
    const tipo = isArtist ? row.artist_type : (row.tipo_atrativo || row.type);
    if (tipo && !form.getValues("atrativoType")) {
      form.setValue("atrativoType", tipo, { shouldDirty: true });
    }
    const estilo = isArtist
      ? row.genre
      : (Array.isArray(row.estilos) && row.estilos.length ? row.estilos.join(", ") : row.style);
    if (estilo && !form.getValues("atrativoStyle")) {
      form.setValue("atrativoStyle", estilo, { shouldDirty: true });
    }
    const desc = row.description || row.bio;
    if (desc && !form.getValues("atrativoDescription")) {
      form.setValue("atrativoDescription", desc, { shouldDirty: true });
    }
    const phone = row.contact_whatsapp || row.contact_info || row.whatsapp;
    if (phone && !form.getValues("atrativoContact")) {
      form.setValue("atrativoContact", isArtist ? formatPhoneDisplay(phone) : phone, { shouldDirty: true, shouldValidate: true });
    }
    const cat = row.tipo_atrativo || row.type || row.artist_type || "";
    if (cat && !form.getValues("atrativoCategory")) {
      const found = QUICK_CATEGORIES.find(
        (c) => normalizeName(c.value) === normalizeName(cat) || normalizeName(c.label) === normalizeName(cat),
      );
      if (found) {
        form.setValue("atrativoCategory", found.value, { shouldDirty: true });
      } else {
        form.setValue("atrativoCategory", "Outros", { shouldDirty: true });
        form.setValue("atrativoCategoryOther", cat, { shouldDirty: true });
      }
    }
    toast.success(`"${row.name}" vinculado ao evento.`);
  };

  const unlink = () => {
    form.setValue("atrativoSourceId", undefined, { shouldDirty: true });
    form.setValue("atrativoSourceType", undefined, { shouldDirty: true });
    form.setValue("atrativoLinkedName", undefined, { shouldDirty: true });
    form.setValue("atrativoLinkedAt", undefined, { shouldDirty: true });
  };

  return (
    <div className="space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="space-y-1">
        <h2 className="text-xl font-bold text-primary flex items-center gap-2">
          <Music className="h-5 w-5" />
          Atrativo responsável pelo evento
        </h2>
        <p className="text-sm text-muted-foreground">
          Digite o nome. Se já existir, a gente vincula; se for novo, cadastramos junto com o evento.
        </p>
      </div>

      {/* 1. Nome do atrativo ou artista */}
      <FormField
        control={form.control}
        name="atrativoName"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Nome do atrativo ou artista *</FormLabel>
            <FormControl>
              <AtrativoAutocomplete
                key={refreshKey}
                value={field.value || ""}
                onChange={(val) => {
                  field.onChange(val);
                  if (sourceId && normalizeName(val) !== normalizeName(linkedName)) unlink();
                }}
                onSelect={linkSuggestion}
                placeholder="Ex.: Banda X, Restaurante Y, Feira Cultural Z"
                selected={!!sourceId}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      {sourceId && (
        <div className="flex flex-wrap items-center gap-2 rounded-xl border border-primary/20 bg-primary/5 px-3 py-2 text-xs">
          <Link2 className="h-3.5 w-3.5 text-primary shrink-0" />
          <span className="font-semibold text-primary">Vinculado a: {linkedName}</span>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            className="ml-auto h-7 px-2 text-xs"
            onClick={unlink}
          >
            <Unlink className="h-3 w-3 mr-1" />
            Trocar
          </Button>
        </div>
      )}

      {/* 2. Celular / WhatsApp */}
      <FormField
        control={form.control}
        name="atrativoContact"
        render={({ field }) => {
          const v = validateBrazilianMobile(field.value);
          const showErr = field.value && !v.valid;
          return (
            <FormItem>
              <FormLabel>Celular / WhatsApp *</FormLabel>
              <FormControl>
                <Input
                  placeholder="(21) 99999-9999"
                  inputMode="tel"
                  maxLength={16}
                  className="h-12 text-base"
                  {...field}
                  autoComplete="tel"
                  onChange={(e) => field.onChange(formatPhoneDisplay(e.target.value))}
                  onBlur={() => {
                    field.onBlur();
                    form.trigger("atrativoContact");
                  }}
                />
              </FormControl>
              {showErr ? (
                <p className="text-xs text-destructive">Informe um WhatsApp válido com DDD.</p>
              ) : (
                <p className="text-xs text-muted-foreground">DDD + 9 + 8 dígitos.</p>
              )}
              <FormMessage />
            </FormItem>
          );
        }}
      />

      {/* 3. E-mail (opcional) */}
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
                className="h-12 text-base"
                {...field}
                value={field.value ?? ""}
                autoComplete="email"
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* 4. Categoria — botões grandes */}
      <FormField
        control={form.control}
        name="atrativoCategory"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Categoria *</FormLabel>
            <div className="grid grid-cols-2 gap-2">
              {QUICK_CATEGORIES.map((cat) => {
                const active = field.value === cat.value;
                return (
                  <button
                    key={cat.value}
                    type="button"
                    onClick={() => field.onChange(cat.value)}
                    aria-pressed={active}
                    className={cn(
                      "min-h-14 rounded-xl border px-3 py-3 text-sm font-semibold transition-colors text-left flex items-center gap-2",
                      active
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-input bg-background hover:bg-muted",
                    )}
                  >
                    {active && <Check className="h-4 w-4 shrink-0" />}
                    <span>{cat.label}</span>
                  </button>
                );
              })}
            </div>
            <FormMessage />
          </FormItem>
        )}
      />

      {form.watch("atrativoCategory") === "Outros" && (
        <FormField
          control={form.control}
          name="atrativoCategoryOther"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Qual categoria?</FormLabel>
              <FormControl>
                <Input placeholder="Ex.: Feira, Palestra, Teatro" className="h-12 text-base" {...field} value={field.value ?? ""} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      )}
    </div>
  );
}

import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { UseFormReturn } from "react-hook-form";
import { Music, Search, Info } from "lucide-react";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export function AtrativoStep({ form }: { form: UseFormReturn<any> }) {
  const [searching, setSearching] = useState(false);
  const [suggestions, setSuggestions] = useState<any[]>([]);

  const searchAtrativo = async (query: string) => {
    if (query.trim().length < 2) {
      setSuggestions([]);
      return;
    }
    setSearching(true);
    const q = query.trim();
    const [atrativosRes, artistsRes] = await Promise.all([
      supabase
        .from("atrativos")
        .select("id, name, type, tipo_atrativo, style, estilos, description, contact_whatsapp")
        .ilike("name", `%${q}%`)
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
        source: "atrativo" as const,
        name: a.name,
        type: a.tipo_atrativo || a.type || "",
        style: (Array.isArray(a.estilos) ? a.estilos.join(", ") : "") || a.style || "",
        description: a.description || "",
        contact: a.contact_whatsapp || "",
      }))),
      ...((artistsRes.data ?? []).map((s: any) => ({
        id: `art-${s.id}`,
        source: "artist" as const,
        name: s.name,
        type: s.artist_type || "",
        style: s.genre || "",
        description: s.bio || "",
        contact: s.whatsapp || "",
      }))),
    ];
    setSuggestions(merged);
    setSearching(false);
  };

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="space-y-2">
        <h2 className="text-xl font-bold text-primary flex items-center gap-2">
          <Music className="h-5 w-5" />
          Atrativo do Evento
        </h2>
        <p className="text-sm text-muted-foreground">Quem é a estrela do show?</p>
      </div>

      <div className="relative">
        <FormField
          control={form.control}
          name="atrativoName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nome do Atrativo</FormLabel>
              <FormControl>
                <div className="relative">
                  <Input 
                    placeholder="Banda, DJ, Artista..." 
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
                  setSuggestions([]);
                }}

              >
                <span className="font-bold">{s.name}</span>
                {s.type && <span className="text-muted-foreground ml-2">({s.type})</span>}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FormField
          control={form.control}
          name="atrativoType"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tipo</FormLabel>
              <FormControl>
                <Input placeholder="Ex: DJ, Cantor, Palestrante" className="h-12" {...field} />
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
              <FormLabel>Estilo Musical / Gênero</FormLabel>
              <FormControl>
                <Input placeholder="Ex: Sertanejo, Rock, Tech House" className="h-12" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <FormField
        control={form.control}
        name="atrativoDescription"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="flex items-center gap-2">
              <Info className="h-4 w-4" />
              Descrição do Atrativo (opcional)
            </FormLabel>
            <FormControl>
              <Textarea 
                placeholder="Conte um pouco sobre o trabalho do artista..." 
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

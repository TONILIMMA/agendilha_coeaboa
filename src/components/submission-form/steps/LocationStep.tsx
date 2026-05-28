import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UseFormReturn } from "react-hook-form";
import { MapPin, Search } from "lucide-react";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export function LocationStep({ form }: { form: UseFormReturn<any> }) {
  const [suggestions, setSuggestions] = useState<any[]>([]);

  const searchLocation = async (query: string) => {
    if (query.length < 3) {
      setSuggestions([]);
      return;
    }
    const { data } = await supabase
      .from("portal_locations")
      .select("*")
      .ilike("name", `%${query}%`)
      .limit(5);
    setSuggestions(data || []);
  };

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="space-y-2">
        <h2 className="text-xl font-bold text-primary flex items-center gap-2">
          <MapPin className="h-5 w-5" />
          Local do Evento
        </h2>
        <p className="text-sm text-muted-foreground">Onde a mágica vai acontecer?</p>
      </div>

      <div className="relative">
        <FormField
          control={form.control}
          name="locationName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nome do Local</FormLabel>
              <FormControl>
                <div className="relative">
                  <Input 
                    placeholder="Nome da casa, bar, praça..." 
                    className="h-12 pr-10" 
                    {...field} 
                    onChange={(e) => {
                      field.onChange(e);
                      searchLocation(e.target.value);
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
                  form.setValue("locationName", s.name);
                  form.setValue("eventAddress", s.address || "");
                  form.setValue("locationType", s.type === "public" ? "public" : "commercial");
                  form.setValue("locationContact", s.contact_responsible || "");
                  setSuggestions([]);
                }}
              >
                <span className="font-bold">{s.name}</span>
                <span className="text-muted-foreground ml-2">({s.address})</span>
              </button>
            ))}
          </div>
        )}
      </div>

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

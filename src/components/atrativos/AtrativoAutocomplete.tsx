import { useEffect, useRef, useState } from "react";
import { Search, AlertTriangle, Plus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { onEntityCreated } from "@/lib/entityEvents";

export interface AtrativoSuggestion {
  id: string;
  name: string;
  type: string | null;
  estabelecimento_id: string | null;
  tipo_atrativo?: string | null;
  style?: string | null;
  estilos?: string[] | null;
  description?: string | null;
  contact_whatsapp?: string | null;
  cidade_regiao?: string | null;
  estado?: string | null;
  pais?: string | null;
  logo_url?: string | null;
  fotos?: string[] | null;
}

interface Props {
  value: string;
  onChange: (v: string) => void;
  onSelect: (a: AtrativoSuggestion) => void;
  placeholder?: string;
  selected?: boolean;
}

/** Autocomplete por nome em public.atrativos (case-insensitive, debounce 250ms). */
export function AtrativoAutocomplete({ value, onChange, onSelect, placeholder, selected }: Props) {
  const [suggestions, setSuggestions] = useState<AtrativoSuggestion[]>([]);
  const [open, setOpen] = useState(false);
  const timer = useRef<number | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => onEntityCreated("atrativo", () => setRefreshKey((k) => k + 1)), []);

  useEffect(() => {
    if (timer.current) window.clearTimeout(timer.current);
    const q = value?.trim() ?? "";
    timer.current = window.setTimeout(async () => {
      let query = supabase
        .from("atrativos_public")
        .select(
          "id, name, type, tipo_atrativo, style, estilos, description, contact_whatsapp, cidade_regiao, estado, pais, logo_url, fotos, estabelecimento_id",
        )
        .order("name", { ascending: true })
        .limit(q.length >= 1 ? 12 : 30);
      if (q.length >= 1) query = query.ilike("name", `%${q}%`);
      const { data } = await query;
      setSuggestions((data ?? []) as AtrativoSuggestion[]);
    }, q.length ? 200 : 0);
    return () => {
      if (timer.current) window.clearTimeout(timer.current);
    };
  }, [value, refreshKey]);

  const exactMatch = suggestions.some(
    (s) => s.name.trim().toLowerCase() === value.trim().toLowerCase(),
  );
  const duplicateWarning = !selected && exactMatch && value.trim().length >= 2;
  const showNewHint = !exactMatch && value.trim().length >= 2;

  return (
    <div className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          placeholder={placeholder ?? "Título do atrativo"}
          className="pl-9"
        />
      </div>
      {open && suggestions.length > 0 && (
        <div className="absolute z-20 mt-1 w-full rounded-lg border bg-popover shadow-lg overflow-hidden max-h-72 overflow-y-auto">
          {value.trim().length < 1 && (
            <div className="px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground bg-muted/40">
              Atrativos já cadastrados
            </div>
          )}
          {suggestions.map((s) => (
            <button
              key={s.id}
              type="button"
              onMouseDown={(ev) => ev.preventDefault()}
              onClick={() => {
                onSelect(s);
                setOpen(false);
              }}
              className="w-full text-left px-3 py-2 hover:bg-accent text-sm flex items-center justify-between gap-2"
            >
              <span className="font-medium truncate">{s.name}</span>
              {s.type && (
                <span className="text-xs text-muted-foreground shrink-0">{s.type}</span>
              )}
            </button>
          ))}
          {showNewHint && (
            <div className="px-3 py-2 text-xs text-muted-foreground border-t bg-muted/30 flex items-center gap-2">
              <Plus className="h-3.5 w-3.5" />
              Novo atrativo — “{value.trim()}” será cadastrado ao salvar.
            </div>
          )}
        </div>
      )}
      {duplicateWarning && (
        <div
          role="alert"
          className="mt-1 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-md px-3 py-2 flex items-start gap-2"
          data-testid="atrativo-duplicate-alert"
        >
          <AlertTriangle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
          <span>Já existe um atrativo com esse nome — selecione da lista pra reaproveitar.</span>
        </div>
      )}
    </div>
  );
}
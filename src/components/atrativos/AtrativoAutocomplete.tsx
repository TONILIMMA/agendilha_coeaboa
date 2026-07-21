import { useEffect, useRef, useState } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";

export interface AtrativoSuggestion {
  id: string;
  name: string;
  type: string | null;
  estabelecimento_id: string | null;
}

interface Props {
  value: string;
  onChange: (v: string) => void;
  onSelect: (a: AtrativoSuggestion) => void;
  placeholder?: string;
}

/** Autocomplete por nome em public.atrativos (case-insensitive, debounce 250ms). */
export function AtrativoAutocomplete({ value, onChange, onSelect, placeholder }: Props) {
  const [suggestions, setSuggestions] = useState<AtrativoSuggestion[]>([]);
  const [open, setOpen] = useState(false);
  const timer = useRef<number | null>(null);

  useEffect(() => {
    if (timer.current) window.clearTimeout(timer.current);
    if (!value || value.trim().length < 2) {
      setSuggestions([]);
      return;
    }
    timer.current = window.setTimeout(async () => {
      const { data } = await supabase
        .from("atrativos_public")
        .select("id, name, type, estabelecimento_id")
        .ilike("name", `%${value.trim()}%`)
        .limit(6);
      setSuggestions((data ?? []) as AtrativoSuggestion[]);
    }, 250);
    return () => {
      if (timer.current) window.clearTimeout(timer.current);
    };
  }, [value]);

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
        <div className="absolute z-20 mt-1 w-full rounded-lg border bg-popover shadow-lg overflow-hidden">
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
        </div>
      )}
    </div>
  );
}
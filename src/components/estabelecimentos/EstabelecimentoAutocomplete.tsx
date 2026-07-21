import { useEffect, useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { Search, MapPin, Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export interface EstabelecimentoSuggestion {
  id: string;
  nome: string;
  endereco: string | null;
  bairro: string | null;
  cep: string | null;
  numero: string | null;
  complemento: string | null;
  tipo: string | null;
  contato: string | null;
}

interface Props {
  value: string;
  onChange: (value: string) => void;
  onSelect: (estab: EstabelecimentoSuggestion) => void;
  placeholder?: string;
  className?: string;
}

/**
 * Campo de texto com autocomplete buscando em public.estabelecimentos
 * por nome (case-insensitive). Se nada for selecionado, o valor digitado
 * é mantido — o caller decide se cria um novo estabelecimento ao salvar.
 */
export function EstabelecimentoAutocomplete({
  value,
  onChange,
  onSelect,
  placeholder = "Nome do estabelecimento",
  className,
}: Props) {
  const [suggestions, setSuggestions] = useState<EstabelecimentoSuggestion[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef<number | null>(null);

  useEffect(() => {
    if (debounceRef.current) window.clearTimeout(debounceRef.current);
    const q = value?.trim() ?? "";
    if (q.length < 2) {
      setSuggestions([]);
      setOpen(false);
      return;
    }
    debounceRef.current = window.setTimeout(async () => {
      setLoading(true);
      const { data } = await supabase
        .from("estabelecimentos_public")
        .select("id, nome, endereco, bairro, cep, numero, complemento, tipo, contato")
        .ilike("nome", `%${q}%`)
        .order("nome", { ascending: true })
        .limit(8);
      setSuggestions((data as EstabelecimentoSuggestion[]) ?? []);
      setOpen(true);
      setLoading(false);
    }, 250);
    return () => {
      if (debounceRef.current) window.clearTimeout(debounceRef.current);
    };
  }, [value]);

  const exactMatch = suggestions.some(
    (s) => s.nome.trim().toLowerCase() === value.trim().toLowerCase()
  );

  return (
    <div className={`relative ${className ?? ""}`}>
      <div className="relative">
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => suggestions.length > 0 && setOpen(true)}
          onBlur={() => window.setTimeout(() => setOpen(false), 150)}
          placeholder={placeholder}
          className="h-12 pr-10"
          autoComplete="off"
        />
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground/50" />
      </div>

      {open && (suggestions.length > 0 || (value.trim().length >= 2 && !loading)) && (
        <div className="absolute z-50 w-full mt-1 bg-popover border rounded-lg shadow-lg overflow-hidden">
          {suggestions.map((s) => (
            <button
              key={s.id}
              type="button"
              className="w-full px-4 py-2 text-left hover:bg-muted transition-colors text-sm flex items-start gap-2"
              onMouseDown={(e) => {
                e.preventDefault();
                onChange(s.nome);
                onSelect(s);
                setOpen(false);
              }}
            >
              <MapPin className="h-4 w-4 mt-0.5 text-primary shrink-0" />
              <span className="flex-1">
                <span className="font-semibold block">{s.nome}</span>
                {(s.endereco || s.bairro) && (
                  <span className="text-muted-foreground text-xs">
                    {[s.endereco, s.bairro].filter(Boolean).join(" — ")}
                  </span>
                )}
              </span>
            </button>
          ))}
          {value.trim().length >= 2 && !exactMatch && (
            <div className="px-4 py-2 text-xs text-muted-foreground border-t bg-muted/30 flex items-center gap-2">
              <Plus className="h-3.5 w-3.5" />
              Nenhum correspondente — &quot;{value.trim()}&quot; será cadastrado como novo estabelecimento ao salvar.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
import { useCallback, useEffect, useState } from "react";
import { Search, AlertTriangle, Plus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { onEntityCreated } from "@/lib/entityEvents";
import { useAutocompleteSearch } from "@/hooks/useAutocompleteSearch";

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
  /** Chamado quando o usuário opta por cadastrar um atrativo novo com o texto digitado. */
  onCreateNew?: (name: string) => void;
}

/** Autocomplete por nome em public.atrativos (case-insensitive, debounce 250ms). */
export function AtrativoAutocomplete({
  value,
  onChange,
  onSelect,
  placeholder,
  selected,
  onCreateNew,
}: Props) {
  const [open, setOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => onEntityCreated("atrativo", () => setRefreshKey((k) => k + 1)), []);

  const fetchPage = useCallback(
    async (q: string, from: number, to: number, signal: AbortSignal) => {
      // Todos os atrativos cadastrados (aprovados ou não) aparecem para quem
      // está logado, sem expor dados pessoais do responsável.
      const { data } = await supabase
        .rpc("search_atrativos_autocomplete", {
          _q: q || null,
          _limit: to - from + 1,
          _offset: from,
        })
        .abortSignal(signal);
      return (data ?? []) as AtrativoSuggestion[];
    },
    [],
  );

  const {
    items: suggestions,
    loading,
    loadingMore,
    hasMore,
    loadMore,
  } = useAutocompleteSearch<AtrativoSuggestion>({
    term: value,
    fetchPage,
    pageSize: 12,
    debounceMs: 150,
    refreshKey,
    enabled: open,
  });

  const exactMatch = suggestions.some(
    (s) => s.name.trim().toLowerCase() === value.trim().toLowerCase(),
  );
  const duplicateWarning = !selected && exactMatch && value.trim().length >= 2;
  const showNewHint = !exactMatch && value.trim().length >= 2;
  const showDropdown = open && (suggestions.length > 0 || loading || showNewHint);

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
      {showDropdown && (
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
          {loading && suggestions.length === 0 && (
            <div className="px-3 py-2 text-xs text-muted-foreground">Buscando atrativos...</div>
          )}
          {!loading && suggestions.length === 0 && showNewHint && (
            <div className="px-3 py-2 text-xs text-muted-foreground">
              Nenhum atrativo com esse nome ainda.
            </div>
          )}
          {hasMore && (
            <button
              type="button"
              onMouseDown={(ev) => ev.preventDefault()}
              onClick={() => loadMore()}
              className="w-full px-3 py-2 text-xs font-medium text-primary hover:bg-muted border-t"
            >
              {loadingMore ? "Carregando..." : "Carregar mais"}
            </button>
          )}
          {showNewHint && onCreateNew && (
            <button
              type="button"
              data-testid="atrativo-autocomplete-create-new"
              onMouseDown={(ev) => ev.preventDefault()}
              onClick={() => {
                onCreateNew(value.trim());
                setOpen(false);
              }}
              className="w-full px-3 py-2 text-left text-xs border-t bg-muted/30 hover:bg-muted flex items-center gap-2 text-primary font-semibold"
            >
              <Plus className="h-3.5 w-3.5" />
              Cadastrar novo atrativo: “{value.trim()}”
            </button>
          )}
          {showNewHint && !onCreateNew && (
            <div className="px-3 py-2 text-xs text-muted-foreground border-t bg-muted/30 flex items-center gap-2">
              <Info className="h-3.5 w-3.5" />
              Para novos atrativos, fale com um administrador.
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
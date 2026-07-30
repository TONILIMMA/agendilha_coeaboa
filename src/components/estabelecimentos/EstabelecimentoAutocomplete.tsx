import { useCallback, useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Search, MapPin, Plus, AlertTriangle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { onEntityCreated } from "@/lib/entityEvents";
import { useAutocompleteSearch } from "@/hooks/useAutocompleteSearch";

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
  selected?: boolean;
  /** Chamado quando o usuário opta por cadastrar um local novo com o texto digitado. */
  onCreateNew?: (name: string) => void;
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
  selected,
  onCreateNew,
}: Props) {
  const [open, setOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => onEntityCreated("estabelecimento", () => setRefreshKey((k) => k + 1)), []);

  const fetchPage = useCallback(
    async (q: string, from: number, to: number, signal: AbortSignal) => {
      let query = supabase
        .from("estabelecimentos_public")
        .select("id, nome, endereco, bairro, cep, numero, complemento, tipo, contato")
        .order("nome", { ascending: true })
        .range(from, to)
        .abortSignal(signal);
      if (q) query = query.ilike("nome", `%${q}%`);
      const { data } = await query;
      return (data ?? []) as EstabelecimentoSuggestion[];
    },
    [],
  );

  const {
    items: suggestions,
    loading,
    loadingMore,
    hasMore,
    loadMore,
  } = useAutocompleteSearch<EstabelecimentoSuggestion>({
    term: value,
    fetchPage,
    pageSize: 12,
    debounceMs: 150,
    refreshKey,
    enabled: open,
  });

  const exactMatch = suggestions.some(
    (s) => s.nome.trim().toLowerCase() === value.trim().toLowerCase()
  );
  const duplicateWarning = !selected && exactMatch && value.trim().length >= 2;

  return (
    <div className={`relative ${className ?? ""}`}>
      <div className="relative">
        <Input
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => window.setTimeout(() => setOpen(false), 150)}
          placeholder={placeholder}
          className="h-12 pr-10"
          autoComplete="off"
        />
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground/50" />
      </div>

      {open && (suggestions.length > 0 || (value.trim().length >= 2 && !loading)) && (
        <div className="absolute z-50 w-full mt-1 bg-popover border rounded-lg shadow-lg overflow-hidden max-h-72 overflow-y-auto">
          {value.trim().length < 1 && suggestions.length > 0 && (
            <div className="px-4 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground bg-muted/40">
              Locais já cadastrados
            </div>
          )}
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
          {loading && suggestions.length === 0 && (
            <div className="px-4 py-2 text-xs text-muted-foreground">Buscando locais...</div>
          )}
          {hasMore && (
            <button
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                loadMore();
              }}
              className="w-full px-4 py-2 text-xs font-medium text-primary hover:bg-muted border-t"
            >
              {loadingMore ? "Carregando..." : "Carregar mais"}
            </button>
          )}
          {value.trim().length >= 2 && !exactMatch && (
            <button
              type="button"
              data-testid="estabelecimento-create-new"
              onMouseDown={(e) => {
                e.preventDefault();
                onCreateNew?.(value.trim());
                setOpen(false);
              }}
              className="w-full px-4 py-2 text-left text-xs border-t bg-muted/30 hover:bg-muted flex items-center gap-2 text-primary font-semibold"
            >
              <Plus className="h-3.5 w-3.5" />
              Cadastrar novo local: &quot;{value.trim()}&quot;
            </button>
          )}
        </div>
      )}
      {duplicateWarning && (
        <div
          role="alert"
          className="mt-1 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-md px-3 py-2 flex items-start gap-2"
          data-testid="estabelecimento-duplicate-alert"
        >
          <AlertTriangle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
          <span>Esse estabelecimento já existe — selecione da lista pra reaproveitar o cadastro.</span>
        </div>
      )}
    </div>
  );
}
import { useCallback, useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Search, MapPin, Plus } from "lucide-react";
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
  placeholder = "Comece a digitar o nome do lugar. Se não aparecer, cadastre um novo.",
  className,
  onCreateNew,
}: Props) {
  const [open, setOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => onEntityCreated("estabelecimento", () => setRefreshKey((k) => k + 1)), []);

  const fetchPage = useCallback(
    async (q: string, from: number, to: number, signal: AbortSignal) => {
      // Busca todos os locais cadastrados (aprovados ou não) para facilitar o
      // preenchimento. A função no backend exige login e não devolve dados
      // pessoais do responsável.
      const { data } = await supabase
        .rpc("search_estabelecimentos_autocomplete", {
          _q: q || null,
          _limit: to - from + 1,
          _offset: from,
        })
        .abortSignal(signal);
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

  // Seleção = carregar dados. Buscamos o registro completo antes de preencher o
  // formulário; nenhuma validação de duplicidade acontece aqui.
  const selecionar = async (s: EstabelecimentoSuggestion) => {
    onChange(s.nome);
    onSelect(s);
    setOpen(false);
    try {
      const { data } = await supabase
        .from("estabelecimentos_public")
        .select("id, nome, endereco, bairro, cep, numero, complemento, tipo")
        .eq("id", s.id)
        .maybeSingle();
      if (data?.id) onSelect({ ...data, contato: s.contato ?? null } as EstabelecimentoSuggestion);
    } catch {
      /* mantém os dados da sugestão */
    }
  };

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
                void selecionar(s);
              }}
            >
              <MapPin className="h-4 w-4 mt-0.5 text-primary shrink-0" />
              <span className="flex-1">
                <span className="font-semibold block">
                  {s.nome}
                  {s.bairro && <span className="font-normal text-muted-foreground"> — {s.bairro}</span>}
                </span>
                {s.endereco && (
                  <span className="text-muted-foreground text-xs">{s.endereco}</span>
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
              Cadastrar novo estabelecimento: &quot;{value.trim()}&quot;
            </button>
          )}
        </div>
      )}
    </div>
  );
}
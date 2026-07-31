import * as React from "react";
import { Input } from "@/components/ui/input";
import { useFieldSuggestions } from "@/hooks/useFieldSuggestions";

let idSeq = 0;

export interface SuggestInputProps extends React.ComponentProps<typeof Input> {
  /** Tabela/view pública de onde vêm as sugestões. */
  suggestFrom: string;
  /** Coluna consultada. */
  suggestColumn: string;
  /** Lista extra (aparece antes das do banco). */
  extraSuggestions?: string[];
  suggestLimit?: number;
  /** Ajusta cada valor vindo do banco antes de virar opção (ex.: 20:00:00 -> 20:00). */
  normalizeOption?: (value: string) => string;
}

/**
 * Input com autocomplete alimentado pelo que já está cadastrado no banco.
 * Usa <datalist> nativo: funciona em Chrome, Safari e Firefox, no desktop e no
 * celular, sem mudar o visual do campo.
 */
export const SuggestInput = React.forwardRef<HTMLInputElement, SuggestInputProps>(
  (
    {
      suggestFrom,
      suggestColumn,
      extraSuggestions,
      suggestLimit = 8,
      normalizeOption,
      value,
      ...props
    },
    ref,
  ) => {
    const listId = React.useMemo(() => `suggest-${++idSeq}`, []);
    const term = typeof value === "string" ? value : "";
    const { suggestions } = useFieldSuggestions({
      from: suggestFrom,
      column: suggestColumn,
      term,
      limit: suggestLimit,
    });

    const options = React.useMemo(() => {
      const seen = new Set<string>();
      const normalized = normalizeOption ? suggestions.map(normalizeOption) : suggestions;
      return [...(extraSuggestions ?? []), ...normalized].filter((opt) => {
        const key = opt.trim().toLowerCase();
        if (!key || seen.has(key)) return false;
        seen.add(key);
        return true;
      });
    }, [extraSuggestions, suggestions, normalizeOption]);

    return (
      <>
        <Input ref={ref} value={value} list={listId} {...props} />
        <datalist id={listId}>
          {options.map((opt) => (
            <option key={opt} value={opt} />
          ))}
        </datalist>
      </>
    );
  },
);
SuggestInput.displayName = "SuggestInput";
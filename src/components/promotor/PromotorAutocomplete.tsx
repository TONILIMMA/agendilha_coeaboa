import { useEffect, useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { Search, User, Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface PromotorSuggestion {
  nome: string;
  whatsapp: string | null;
  tipo: string | null;
}

interface Props {
  value: string;
  onChange: (value: string) => void;
  onSelect: (p: PromotorSuggestion) => void;
  placeholder?: string;
  disabled?: boolean;
}

/**
 * Autocomplete de Promotor/Divulgador baseado no histórico do próprio usuário.
 * Busca promotores distintos usados em submissões anteriores (por nome).
 * Se nada for selecionado, mantém o texto digitado — o caller decide o que fazer.
 */
export function PromotorAutocomplete({
  value,
  onChange,
  onSelect,
  placeholder = "Nome do promotor/divulgador",
  disabled,
}: Props) {
  const { user } = useAuth();
  const [suggestions, setSuggestions] = useState<PromotorSuggestion[]>([]);
  const [open, setOpen] = useState(false);
  const debounceRef = useRef<number | null>(null);

  useEffect(() => {
    if (debounceRef.current) window.clearTimeout(debounceRef.current);
    const q = value?.trim() ?? "";
    if (!user?.id || q.length < 1) {
      setSuggestions([]);
      setOpen(false);
      return;
    }
    debounceRef.current = window.setTimeout(async () => {
      const { data } = await supabase
        .from("submissions")
        .select("responsible_name, responsavel_duvidas_whatsapp, responsavel_tipo, created_at")
        .eq("user_id", user.id)
        .not("responsible_name", "is", null)
        .ilike("responsible_name", `%${q}%`)
        .order("created_at", { ascending: false })
        .limit(20);
      const seen = new Set<string>();
      const uniq: PromotorSuggestion[] = [];
      for (const row of (data as any[]) ?? []) {
        const nome = (row.responsible_name ?? "").trim();
        const whats = row.responsavel_duvidas_whatsapp ?? null;
        const key = `${nome.toLowerCase()}|${whats ?? ""}`;
        if (!nome || seen.has(key)) continue;
        seen.add(key);
        uniq.push({ nome, whatsapp: whats, tipo: row.responsavel_tipo ?? null });
        if (uniq.length >= 6) break;
      }
      setSuggestions(uniq);
      setOpen(uniq.length > 0);
    }, 250);
    return () => {
      if (debounceRef.current) window.clearTimeout(debounceRef.current);
    };
  }, [value, user?.id]);

  const exactMatch = suggestions.some(
    (s) => s.nome.trim().toLowerCase() === value.trim().toLowerCase(),
  );

  return (
    <div className="relative">
      <div className="relative">
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => suggestions.length > 0 && setOpen(true)}
          onBlur={() => window.setTimeout(() => setOpen(false), 150)}
          placeholder={placeholder}
          disabled={disabled}
          className="pr-10"
          autoComplete="off"
        />
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground/50" />
      </div>

      {open && suggestions.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-popover border rounded-lg shadow-lg overflow-hidden">
          {suggestions.map((s, idx) => (
            <button
              key={`${s.nome}-${idx}`}
              type="button"
              className="w-full px-4 py-2 text-left hover:bg-muted transition-colors text-sm flex items-start gap-2"
              onMouseDown={(e) => {
                e.preventDefault();
                onChange(s.nome);
                onSelect(s);
                setOpen(false);
              }}
            >
              <User className="h-4 w-4 mt-0.5 text-primary shrink-0" />
              <span className="flex-1">
                <span className="font-semibold block">{s.nome}</span>
                {s.whatsapp && (
                  <span className="text-muted-foreground text-xs">{s.whatsapp}</span>
                )}
              </span>
            </button>
          ))}
          {value.trim().length >= 1 && !exactMatch && (
            <div className="px-4 py-2 text-xs text-muted-foreground border-t bg-muted/30 flex items-center gap-2">
              <Plus className="h-3.5 w-3.5" />
              Novo promotor — “{value.trim()}” será salvo neste evento.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
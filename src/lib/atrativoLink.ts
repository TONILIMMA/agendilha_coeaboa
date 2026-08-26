import { supabase } from "@/integrations/supabase/client";
import { normalizePhone } from "@/lib/whatsapp";

/** Categorias rápidas do bloco "Atrativo responsável pelo evento". */
export const QUICK_CATEGORIES = [
  { value: "Música", label: "Música / Show" },
  { value: "Gastronomia", label: "Gastronomia" },
  { value: "Cultura", label: "Cultura / Arte" },
  { value: "Esporte", label: "Esporte" },
  { value: "Outros", label: "Outra categoria" },
] as const;

/** Normaliza nome: sem acento, minúsculo, espaços colapsados. */
export function normalizeName(value: string | null | undefined): string {
  return (value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

export interface AtrativoCandidate {
  id: string;
  name: string;
  category: string | null;
}

export interface ResolveInput {
  name: string;
  whatsapp?: string | null;
  email?: string | null;
  category?: string | null;
  categoryOther?: string | null;
  userId?: string | null;
  /** Atrativo já escolhido nas sugestões — vincula direto, sem consultar. */
  selectedId?: string | null;
  selectedName?: string | null;
}

export type ResolveResult =
  | { status: "linked"; id: string; name: string }
  | { status: "created"; id: string; name: string }
  | { status: "ambiguous"; candidates: AtrativoCandidate[] }
  | { status: "skipped" };

/** Busca atrativos por nome (aprovados ou não) e devolve candidatos normalizados. */
export async function searchAtrativoCandidates(name: string): Promise<AtrativoCandidate[]> {
  const q = (name ?? "").trim();
  if (!q) return [];
  const { data, error } = await supabase.rpc("search_atrativos_autocomplete", {
    _q: q,
    _limit: 10,
    _offset: 0,
  });
  if (error) throw error;
  const rows = Array.isArray(data) ? data : [];
  return rows.map((r: any) => ({
    id: r.id,
    name: r.name,
    category: r.tipo_atrativo || r.type || null,
  }));
}

/**
 * Vincula um atrativo existente ou cria um novo (não aprovado) automaticamente.
 * Nunca lança por ambiguidade: devolve os candidatos pra tela escolher.
 */
export async function resolveOrCreateAtrativo(input: ResolveInput): Promise<ResolveResult> {
  const name = (input.name ?? "").trim();
  if (!name) return { status: "skipped" };

  if (input.selectedId) {
    return { status: "linked", id: input.selectedId, name: input.selectedName || name };
  }

  const target = normalizeName(name);
  const candidates = await searchAtrativoCandidates(name).catch(() => [] as AtrativoCandidate[]);

  const exact = candidates.filter((c) => normalizeName(c.name) === target);
  if (exact.length === 1) {
    return { status: "linked", id: exact[0].id, name: exact[0].name };
  }
  if (exact.length > 1) {
    return { status: "ambiguous", candidates: exact };
  }

  const similar = candidates.filter((c) => {
    const n = normalizeName(c.name);
    return n.includes(target) || target.includes(n);
  });
  if (similar.length === 1) {
    return { status: "linked", id: similar[0].id, name: similar[0].name };
  }
  if (similar.length > 1) {
    return { status: "ambiguous", candidates: similar };
  }

  return createAtrativo(input);
}

/** Cria o atrativo já vinculável (entra como não aprovado para a curadoria). */
export async function createAtrativo(input: ResolveInput): Promise<ResolveResult> {
  const name = (input.name ?? "").trim();
  const category =
    input.category === "Outros" && input.categoryOther?.trim()
      ? input.categoryOther.trim()
      : input.category?.trim() || null;
  const whatsapp = input.whatsapp ? normalizePhone(input.whatsapp) : null;

  const { data, error } = await supabase
    .from("atrativos")
    .insert({
      name,
      type: category,
      tipo_atrativo: category,
      category_other: input.category === "Outros" ? input.categoryOther?.trim() || null : null,
      contact_whatsapp: whatsapp,
      contact_info: whatsapp,
      responsavel_telefone: whatsapp,
      responsavel_email: input.email?.trim() || null,
      created_by: input.userId ?? null,
      responsavel_id: input.userId ?? null,
      is_approved: false,
    })
    .select("id, name")
    .maybeSingle();

  if (error) throw error;
  if (!data) return { status: "skipped" };
  return { status: "created", id: data.id, name: data.name };
}

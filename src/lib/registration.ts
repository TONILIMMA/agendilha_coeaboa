import { supabase } from "@/integrations/supabase/client";
import { normalizePhone } from "@/lib/validations";

export type TipoPerfil = "publico" | "divulgador" | "artista";

interface ContatoBase {
  tipo_perfil: TipoPerfil;
  nome: string;
  whatsapp?: string;
  bairro: string;
  endereco?: string | null;
}

async function insertContato(base: ContatoBase) {
  const { data: userData } = await supabase.auth.getUser();
  const { data, error } = await supabase
    .from("contatos")
    .insert({
      tipo_perfil: base.tipo_perfil,
      nome: base.nome.trim(),
      whatsapp: base.whatsapp?.trim() ? normalizePhone(base.whatsapp) : null,
      bairro: base.bairro,
      endereco: base.endereco?.trim() || null,
      user_id: userData.user?.id ?? null,
    })
    .select("id")
    .single();
  if (error) throw error;
  return data.id as string;
}

export interface PublicoPayload {
  nome: string;
  whatsapp: string;
  bairro: string;
  interesses: string[];
  aceita_notificacoes: boolean;
  frequencia_notificacao: string;
}

export async function saveUsuarioPublico(p: PublicoPayload) {
  const contato_id = await insertContato({
    tipo_perfil: "publico",
    nome: p.nome,
    whatsapp: p.whatsapp,
    bairro: p.bairro,
  });
  const { error } = await supabase.from("usuarios_publicos").insert({
    contato_id,
    interesses: p.interesses,
    aceita_notificacoes: p.aceita_notificacoes,
    frequencia_notificacao: p.frequencia_notificacao,
    origem_cadastro: "web",
  });
  if (error) throw error;
  return contato_id;
}

export interface DivulgadorPayload {
  nome: string;
  whatsapp: string;
  cpf: string;
  endereco: string;
  bairro: string;
  nome_projeto?: string;
  instagram?: string;
  observacoes?: string;
}

export async function saveDivulgador(p: DivulgadorPayload) {
  const contato_id = await insertContato({
    tipo_perfil: "divulgador",
    nome: p.nome,
    whatsapp: p.whatsapp,
    bairro: p.bairro,
    endereco: p.endereco,
  });
  const { error } = await supabase.from("divulgadores").insert({
    contato_id,
    cpf: p.cpf.replace(/\D/g, ""),
    nome_projeto: p.nome_projeto?.trim() || null,
    instagram: p.instagram?.trim() || null,
    observacoes: p.observacoes?.trim() || null,
  });
  if (error) throw error;
  return contato_id;
}

export interface ArtistaPayload {
  nome_responsavel: string;
  nome_artistico: string;
  whatsapp?: string;
  endereco: string;
  bairro: string;
  quantidade_integrantes: number;
  categoria: string;
  genero?: string;
  instagram?: string;
  portfolio_url?: string;
  release_curto?: string;
  tempo_apresentacao?: string;
  possui_estrutura?: boolean | null;
  necessidades_tecnicas?: string;
  cache_faixa?: string;
}

export async function saveArtista(p: ArtistaPayload) {
  const contato_id = await insertContato({
    tipo_perfil: "artista",
    nome: p.nome_responsavel,
    whatsapp: p.whatsapp,
    bairro: p.bairro,
    endereco: p.endereco,
  });
  const { error } = await supabase.from("artistas").insert({
    contato_id,
    nome_artistico: p.nome_artistico.trim(),
    categoria: p.categoria || null,
    genero: p.genero?.trim() || null,
    quantidade_integrantes: p.quantidade_integrantes,
    release_curto: p.release_curto?.trim() || null,
    instagram: p.instagram?.trim() || null,
    portfolio_url: p.portfolio_url?.trim() || null,
    tempo_apresentacao: p.tempo_apresentacao?.trim() || null,
    possui_estrutura: p.possui_estrutura ?? null,
    necessidades_tecnicas: p.necessidades_tecnicas?.trim() || null,
    cache_faixa: p.cache_faixa?.trim() || null,
  });
  if (error) throw error;
  return contato_id;
}

export const INTERESSES = [
  "Shows",
  "Gastronomia",
  "Infantil",
  "Religioso",
  "Esportes",
  "Feiras",
  "Cultura",
] as const;

export const FREQUENCIAS = [
  { value: "diaria", label: "Diária" },
  { value: "semanal", label: "Semanal" },
  { value: "mensal", label: "Mensal" },
] as const;

export const CATEGORIAS_ARTISTA = [
  "Solo",
  "Dupla",
  "Banda",
  "DJ",
  "Dança",
  "Humor",
  "Teatro",
  "Infantil",
  "Outra",
] as const;

// Máscaras simples
export const maskPhone = (v: string) => {
  const d = v.replace(/\D/g, "").slice(0, 11);
  if (d.length <= 2) return d;
  if (d.length <= 7) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
};

export const maskCpf = (v: string) => {
  const d = v.replace(/\D/g, "").slice(0, 11);
  if (d.length <= 3) return d;
  if (d.length <= 6) return `${d.slice(0, 3)}.${d.slice(3)}`;
  if (d.length <= 9) return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6)}`;
  return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}`;
};

export const isCpfValido = (v: string) => {
  const d = v.replace(/\D/g, "");
  if (d.length !== 11 || /^(\d)\1{10}$/.test(d)) return false;
  const calc = (base: number) => {
    let s = 0;
    for (let i = 0; i < base - 1; i++) s += parseInt(d[i]) * (base - i);
    const r = (s * 10) % 11;
    return r === 10 ? 0 : r;
  };
  return calc(10) === parseInt(d[9]) && calc(11) === parseInt(d[10]);
};

export const isWhatsappValido = (v: string) => {
  const d = v.replace(/\D/g, "");
  return d.length === 10 || d.length === 11;
};
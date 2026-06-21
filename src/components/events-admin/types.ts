export interface Submission {
  id: string;
  created_at: string;
  user_id: string;
  company_name: string | null;
  responsible_name: string | null;
  email: string | null;
  phone: string | null;
  event_title: string;
  date: string | null;
  start_time: string | null;
  end_time: string | null;
  location: string | null;
  address_street: string | null;
  address_number: string | null;
  address_neighborhood: string | null;
  address_city: string | null;
  address_state: string | null;
  address_zip: string | null;
  description: string | null;
  video_link: string | null;
  category: string | null;
  promotion_type: string | null;
  target_audience: string | null;
  promotion_rules: string | null;
  contact_social: string | null;
  additional_details: string | null;
  status: string;
  sale_price: string | null;
  maintenance_cost: string | null;
  subscription_info: string | null;
  commission: string | null;
  stage: string;
  concept_description: string | null;
  responsible_person: string | null;
  is_highlight: boolean;
  views_count: number;
  shares_count: number;
  deleted_at: string | null;
  editorial_status?: EditorialStatus | null;
  flyer_aprovado?: boolean | null;
  scheduled_channel?: string | null;
  scheduled_at?: string | null;
  published_channels?: string[] | null;
  checklist_publ_canal?: boolean | null;
  checklist_visivel_agenda?: boolean | null;
  checklist_envio_registrado?: boolean | null;
  rejection_reason?: string | null;
}

export type EditorialStatus =
  | "recebido"
  | "em_revisao"
  | "flyer_aprovado"
  | "pronto_divulgar"
  | "agendado"
  | "publicado"
  | "confirmado"
  | "rejeitado";

export const EDITORIAL_STAGES: { key: EditorialStatus; label: string; nextStep: string; color: string }[] = [
  { key: "recebido",        label: "Recebido",         nextStep: "Validar dados básicos",     color: "bg-slate-100 text-slate-700 border-slate-300 dark:bg-slate-800/40 dark:text-slate-200" },
  { key: "em_revisao",      label: "Em revisão",       nextStep: "Curar conteúdo e flyer",    color: "bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-900/30 dark:text-amber-200" },
  { key: "flyer_aprovado",  label: "Flyer aprovado",   nextStep: "Marcar pronto p/ divulgar", color: "bg-yellow-100 text-yellow-800 border-yellow-300 dark:bg-yellow-900/30 dark:text-yellow-200" },
  { key: "pronto_divulgar", label: "Pronto p/ divulgar", nextStep: "Agendar canal e horário", color: "bg-orange-100 text-orange-800 border-orange-300 dark:bg-orange-900/30 dark:text-orange-200" },
  { key: "agendado",        label: "Agendado",         nextStep: "Publicar no canal",         color: "bg-sky-100 text-sky-800 border-sky-300 dark:bg-sky-900/30 dark:text-sky-200" },
  { key: "publicado",       label: "Publicado",        nextStep: "Confirmar publicação",      color: "bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-900/30 dark:text-emerald-200" },
  { key: "confirmado",      label: "Confirmado",       nextStep: "Acompanhar engajamento",    color: "bg-green-200 text-green-900 border-green-400 dark:bg-green-900/40 dark:text-green-100" },
  { key: "rejeitado",       label: "Rejeitado",        nextStep: "Encerrado",                 color: "bg-red-100 text-red-800 border-red-300 dark:bg-red-900/30 dark:text-red-200" },
];

export const editorialMeta = Object.fromEntries(EDITORIAL_STAGES.map(s => [s.key, s])) as Record<EditorialStatus, typeof EDITORIAL_STAGES[number]>;

export interface AuditLogEntry {
  action: string;
  created_at: string;
  user_name: string;
}

export const categoryLabels: Record<string, string> = {
  musica: "Música / Show",
  gastronomia: "Gastronomia",
  cultura: "Cultura / Arte",
  esporte: "Esporte",
  promocoes: "Promoções / Ofertas",
  outros: "Outros",
};

export const stageLabels: Record<string, string> = {
  development: "Em desenvolvimento",
  confirmed: "Confirmado",
  update: "Atualização",
};

export const stageBadgeVariant: Record<string, "default" | "secondary" | "outline"> = {
  development: "secondary",
  confirmed: "default",
  update: "outline",
};

export function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("pt-BR", {
    day: "2-digit", month: "2-digit", year: "2-digit", hour: "2-digit", minute: "2-digit",
  });
}

export function getDayOfWeek(dateStr: string): string {
  if (!dateStr) return "";
  const parts = dateStr.split("/");
  if (parts.length === 3) {
    const [dd, mm, yyyy] = parts;
    const d = new Date(`${yyyy}-${mm}-${dd}`);
    if (!isNaN(d.getTime())) {
      return d.toLocaleDateString("pt-BR", { weekday: "long" }).replace(/^\w/, c => c.toUpperCase());
    }
  }
  return "";
}

export function parseEventDate(dateStr: string): Date | null {
  const parts = dateStr.split("/");
  if (parts.length === 3) {
    const [dd, mm, yyyy] = parts;
    const d = new Date(`${yyyy}-${mm}-${dd}`);
    if (!isNaN(d.getTime())) return d;
  }
  return null;
}

export function getWeekRange(): { start: Date; end: Date } {
  const now = new Date();
  const day = now.getDay();
  const diffToMonday = day === 0 ? -6 : 1 - day;
  const monday = new Date(now);
  monday.setHours(0, 0, 0, 0);
  monday.setDate(now.getDate() + diffToMonday);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);
  return { start: monday, end: sunday };
}
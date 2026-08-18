export interface AgendaEvent {
  id: string;
  event_title: string | null;
  date: string | null;
  start_time: string | null;
  end_time: string | null;
  location: string | null;
  address_neighborhood: string | null;
  address_street: string | null;
  description: string | null;
  category: string | null;
  company_name: string | null;
  is_highlight: boolean;
  status?: string;
  image_url?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  age_rating?: string;
  is_suitable_for_minors?: boolean;
  moderation_status?: string;
  views_count?: number;
}

export const categoryLabels: Record<string, string> = {
  musica: "Música / Show",
  gastronomia: "Gastronomia",
  cultura: "Cultura / Arte",
  esporte: "Esporte",
  promocoes: "Promoções",
  outros: "Outros",
};

export const categoryIcons: Record<string, string> = {
  musica: "🎸",
  gastronomia: "🍻",
  cultura: "🎭",
  esporte: "⚽",
  promocoes: "🏷️",
  outros: "📌",
};
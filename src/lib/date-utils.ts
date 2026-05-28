import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

/**
 * Formats a date string (YYYY-MM-DD) to Brazilian format (DD/MM/YYYY)
 */
export function formatBrazilianDate(dateStr: string | null | undefined): string {
  if (!dateStr) return "Data não definida";
  try {
    // If it's already in DD/MM/YYYY, return as is
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(dateStr)) return dateStr;
    
    const date = parseISO(dateStr);
    return format(date, "dd/MM/yyyy");
  } catch (e) {
    return dateStr || "Data não definida";
  }
}

/**
 * Formats a date string to a long format (Sexta-feira, 25 de Maio)
 */
export function formatLongDate(dateStr: string | null | undefined): string {
  if (!dateStr) return "Sem data definida";
  try {
    const date = parseISO(dateStr);
    const formatted = format(date, "EEEE · d 'de' MMMM", { locale: ptBR });
    return formatted.charAt(0).toUpperCase() + formatted.slice(1);
  } catch (e) {
    return dateStr || "Sem data definida";
  }
}

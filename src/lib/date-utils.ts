import { format, parseISO, isValid } from "date-fns";
import { ptBR } from "date-fns/locale";

/**
 * Parses a date string into a Date object safely.
 * Handles both DD/MM/YYYY and YYYY-MM-DD formats.
 */
function parseDateSafely(dateStr: string): Date | null {
  if (!dateStr) return null;

  // Handle DD/MM/YYYY
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(dateStr)) {
    const [day, month, year] = dateStr.split("/").map(Number);
    const date = new Date(year, month - 1, day);
    return isValid(date) ? date : null;
  }

  // Handle YYYY-MM-DD (ISO)
  try {
    const date = parseISO(dateStr);
    return isValid(date) ? date : null;
  } catch {
    return null;
  }
}

/**
 * Formats a date string to Brazilian format (DD/MM/YYYY)
 */
export function formatBrazilianDate(dateStr: string | null | undefined): string {
  if (!dateStr) return "Data não definida";
  
  const date = parseDateSafely(dateStr);
  if (!date) return dateStr || "Data não definida";

  return format(date, "dd/MM/yyyy");
}

/**
 * Formats a date string to a long format (Sexta-feira, 25 de Maio)
 */
export function formatLongDate(dateStr: string | null | undefined): string {
  if (!dateStr) return "Sem data definida";
  
  const date = parseDateSafely(dateStr);
  if (!date) return dateStr || "Sem data definida";

  const formatted = format(date, "EEEE · d 'de' MMMM", { locale: ptBR });
  return formatted.charAt(0).toUpperCase() + formatted.slice(1);
}

/**
 * Returns the weekday name in pt-BR (e.g. "segunda-feira").
 */
export function getWeekdayFromDate(dateStr: string | null | undefined): string {
  if (!dateStr) return "";

  const date = parseDateSafely(dateStr);
  if (!date) return "";

  return format(date, "EEEE", { locale: ptBR });
}

/**
 * Formats a date string with its weekday appended.
 * E.g. "15/05/2024" → "15/05/2024 (quarta-feira)"
 */
export function formatDateWithWeekday(dateStr: string): string {
  if (!dateStr) return "";
  const weekday = getWeekdayFromDate(dateStr);
  return weekday ? `${dateStr} (${weekday})` : dateStr;
}

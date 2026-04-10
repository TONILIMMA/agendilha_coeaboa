/**
 * Given a date string in DD/MM/YYYY or YYYY-MM-DD format,
 * returns the weekday name in pt-BR (e.g. "segunda-feira").
 * Returns empty string if the date is invalid.
 */
export function getWeekdayFromDate(dateStr: string): string {
  if (!dateStr) return "";

  let day: number, month: number, year: number;

  if (/^\d{2}\/\d{2}\/\d{4}$/.test(dateStr)) {
    // DD/MM/YYYY
    [day, month, year] = dateStr.split("/").map(Number);
  } else if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    // YYYY-MM-DD
    [year, month, day] = dateStr.split("-").map(Number);
  } else {
    return "";
  }

  const date = new Date(year, month - 1, day);
  if (isNaN(date.getTime())) return "";

  return date.toLocaleDateString("pt-BR", { weekday: "long" });
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

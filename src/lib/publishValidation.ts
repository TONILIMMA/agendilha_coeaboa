// Regras mínimas pra um evento poder ser aprovado, publicado ou agendado.
// Se qualquer um faltar, bloqueamos com mensagem clara.
export interface PublishableEvent {
  event_title?: string | null;
  date?: string | null;
  start_time?: string | null;
  location?: string | null;
}

export function missingPublishFields(sub: PublishableEvent | null | undefined): string[] {
  if (!sub) return ["dados do evento"];
  const missing: string[] = [];
  const has = (v: unknown) => typeof v === "string" && v.trim().length > 0;
  if (!has(sub.event_title)) missing.push("título");
  if (!has(sub.date)) missing.push("data");
  if (!has(sub.start_time)) missing.push("horário");
  if (!has(sub.location)) missing.push("local");
  return missing;
}

export function assertPublishable(sub: PublishableEvent | null | undefined): {
  ok: boolean;
  missing: string[];
  message: string;
} {
  const missing = missingPublishFields(sub);
  return {
    ok: missing.length === 0,
    missing,
    message: missing.length
      ? `Falta preencher: ${missing.join(", ")}.`
      : "",
  };
}
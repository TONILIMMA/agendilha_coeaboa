// Regras mínimas pra um evento poder ser aprovado, publicado ou agendado.
// Se qualquer um faltar, bloqueamos com mensagem clara.
export interface PublishableEvent {
  event_title?: string | null;
  date?: string | null;
  start_time?: string | null;
  location?: string | null;
  image_url?: string | null;
}

export const PUBLISH_FIELD_LABELS: Record<string, string> = {
  date: "data",
  start_time: "horário",
  location: "local",
};

export function missingPublishFields(sub: PublishableEvent | null | undefined): string[] {
  if (!sub) return ["dados do evento"];
  const missing: string[] = [];
  const has = (v: unknown) => typeof v === "string" && v.trim().length > 0;
  if (!has(sub.date)) missing.push(PUBLISH_FIELD_LABELS.date);
  if (!has(sub.start_time)) missing.push(PUBLISH_FIELD_LABELS.start_time);
  if (!has(sub.location)) missing.push(PUBLISH_FIELD_LABELS.location);
  return missing;
}

// True quando o promotor NÃO mandou arte própria — só aí oferecemos o flyer genérico.
// Garante que uma imagem enviada na Fase 6 nunca seja substituída.
export function shouldOfferGenericFlyer(sub: PublishableEvent | null | undefined): boolean {
  if (!sub) return false;
  return !(typeof sub.image_url === "string" && sub.image_url.trim().length > 0);
}

// Cards, prévias e copies só devem ser gerados quando os 4 campos mínimos estão OK.
export function canGenerateEventCard(sub: PublishableEvent | null | undefined): boolean {
  return missingPublishFields(sub).length === 0;
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
export interface Event {
  id: string;
  event_title: string;
  date: string | null;
  start_time: string | null;
  end_time: string | null;
  location: string | null;
  address_neighborhood: string | null;
  address_street: string | null;
  description: string | null;
  category: string | null;
}

export function buildFullAddress(ev: Event): string {
  const parts = [
    ev.location,
    ev.address_street,
    ev.address_neighborhood,
  ].filter(Boolean);
  return parts.join(" – ");
}

export const getShareUrl = (eventId?: string) => {
  const base = `${window.location.origin}/agenda`;
  return eventId ? `${base}?event=${eventId}` : base;
};

// URL que gera OG preview no WhatsApp/Facebook (edge function server-side)
// e redireciona o usuário real para /evento/:slug na SPA.
export const getEventOgShareUrl = (slug: string) => {
  const projectRef =
    import.meta.env?.VITE_SUPABASE_PROJECT_ID || "xwuyzqahfoyhdbmtspwf";
  return `https://${projectRef}.supabase.co/functions/v1/evento-og?slug=${encodeURIComponent(slug)}`;
};

export const getShareData = (ev?: Event) => {
  const isAgenda = !ev;
  const title = isAgenda ? "Agenda Cultural da Ilha" : `Evento: ${ev.event_title}`;
  const url = getShareUrl(ev?.id);
  
  let text = isAgenda 
    ? "Confira a programação completa da Ilha do Governador!" 
    : `Confira este evento e a agenda completa no AgendIlha!`;

  if (ev) {
    const time = ev.start_time ? `${ev.start_time}` : "";
    const addr = buildFullAddress(ev);
    const eventDetails = `🗓️ *${ev.event_title}*${time ? `\n⏰ ${time}` : ""}${addr ? `\n📍 ${addr}` : ""}`;
    text = `${eventDetails}\n\n🌴 Veja os detalhes no AgendIlha:`;
  } else {
    text = `🌴 *Confira a Agenda Cultural da Ilha do Governador!* 🌴\n\nVeja a programação completa e atualizada em:`;
  }

  return { title, text, url };
};
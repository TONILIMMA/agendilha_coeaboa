import { toast } from "sonner";
import { getShareData, buildFullAddress } from "@/lib/sharing";
import type { AgendaEvent } from "./types";

export function parseDateToObj(dateStr: string | null): Date | null {
  if (!dateStr) return null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    const [y, m, d] = dateStr.split("-").map(Number);
    return new Date(y, m - 1, d);
  }
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(dateStr)) {
    const [d, m, y] = dateStr.split("/").map(Number);
    return new Date(y, m - 1, d);
  }
  return null;
}

export function formatDayLabel(dateStr: string | null): string {
  const d = parseDateToObj(dateStr);
  if (!d || isNaN(d.getTime())) return "Sem data definida";
  const wd = d.toLocaleDateString("pt-BR", { weekday: "long" });
  const dayMonth = d.toLocaleDateString("pt-BR", { day: "numeric", month: "long" });
  return `${wd.charAt(0).toUpperCase()}${wd.slice(1)} · ${dayMonth}`;
}

export function buildWhatsAppShare(ev?: AgendaEvent) {
  const { text, url } = getShareData(ev as any);
  const msg = `${text}\n${url}`;
  return `https://wa.me/?text=${encodeURIComponent(msg)}`;
}

export function handleSocialShare(
  platform: "whatsapp" | "instagram" | "facebook" | "twitter" | "copy",
  ev?: AgendaEvent,
) {
  const { text, url } = getShareData(ev as any);
  const fullText = `${text}\n${url}`;

  switch (platform) {
    case "whatsapp":
      window.open(`https://wa.me/?text=${encodeURIComponent(fullText)}`, "_blank");
      break;
    case "facebook":
      window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, "_blank");
      break;
    case "twitter":
      window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(fullText)}`, "_blank");
      break;
    case "copy":
      navigator.clipboard.writeText(url);
      toast.success("Link copiado!");
      break;
    case "instagram":
      navigator.clipboard.writeText(url);
      toast.success("Link copiado para os Stories!", {
        description: "Agora cole o link no sticker do Instagram.",
      });
      break;
  }
}

export function buildUberLink(ev: AgendaEvent): string {
  const destinationName = encodeURIComponent(ev.location || "Evento");
  const address = buildFullAddress(ev as any);
  const destinationAddress = encodeURIComponent(address);

  let url = `https://m.uber.com/ul/?action=setPickup&pickup=my_location`;

  if (ev.latitude && ev.longitude) {
    url += `&dropoff[latitude]=${ev.latitude}&dropoff[longitude]=${ev.longitude}&dropoff[nickname]=${destinationName}&dropoff[formatted_address]=${destinationAddress}`;
  } else {
    url += `&dropoff[nickname]=${destinationName}&dropoff[formatted_address]=${destinationAddress}`;
  }

  return url;
}
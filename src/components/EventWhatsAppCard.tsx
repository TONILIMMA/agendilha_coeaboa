import { forwardRef, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Download, Share2, Loader2 } from "lucide-react";
import { toPng } from "html-to-image";
import { toast } from "sonner";
import { handleError } from "@/lib/error-handler";
import { formatBrazilianDate } from "@/lib/date-utils";
import { getEventFallbackImage, normalizeText } from "@/lib/event-utils";

export interface FlyerEvent {
  id: string;
  event_title: string;
  artist_name?: string | null;
  date: string | null;
  start_time: string | null;
  location: string | null;
  address_street?: string | null;
  address_number?: string | null;
  address_neighborhood?: string | null;
  music_style?: string | null;
  category?: string | null;
  image_url?: string | null;
  tagline?: string | null;
  description?: string | null;
}

/** Map a music style / category to an emoji */
function styleEmoji(style?: string | null, category?: string | null): string {
  const s = normalizeText(`${style || ""} ${category || ""}`);
  if (/rock|metal|punk/.test(s)) return "🎸";
  if (/forro|sertanej|country/.test(s)) return "🪗";
  if (/dj|eletro|techno|house/.test(s)) return "🎧";
  if (/pop|acust/.test(s)) return "🎤";
  if (/samba|pagode|roda/.test(s)) return "🥁";
  if (/mpb|jazz|blues|bossa/.test(s)) return "🎷";
  if (/funk|hip.?hop|rap/.test(s)) return "🎙️";
  if (/gastr|comida|food|chef/.test(s)) return "🍽️";
  if (/teatro|peca|stand|comedia/.test(s)) return "🎭";
  if (/esport|jogo|corrida/.test(s)) return "🏆";
  return "🎶";
}

function buildTagline(e: FlyerEvent): string {
  if (e.tagline) return e.tagline;
  const style = e.music_style?.trim();
  const place = e.address_neighborhood || e.location || "Ilha do Governador";
  if (style) return `${style} em ${place}!`;
  if (e.description) {
    const s = e.description.replace(/\s+/g, " ").trim();
    return s.length > 60 ? s.slice(0, 57) + "…" : s;
  }
  return `Vem viver o melhor de ${place}!`;
}

/* ---------- Visual card (exportable) ---------- */

export const EventWhatsAppCard = forwardRef<HTMLDivElement, { event: FlyerEvent }>(
  ({ event }, ref) => {
    const img = event.image_url || getEventFallbackImage(event.category);
    const artist = event.artist_name || event.event_title;
    const fullAddress = [event.address_street, event.address_number, event.address_neighborhood]
      .filter(Boolean)
      .join(", ");
    const emoji = styleEmoji(event.music_style, event.category);
    const tagline = buildTagline(event);

    return (
      <div
        ref={ref}
        className="relative w-[1080px] h-[1080px] overflow-hidden flex flex-col"
        style={{
          fontFamily: "'Figtree', system-ui, sans-serif",
          background: "#faf8f5",
          color: "#2b2622",
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-14 py-10"
          style={{ background: "#2b2622", color: "#faf8f5" }}
        >
          <div className="flex items-center gap-4">
            <div
              className="h-14 w-14 rounded-full flex items-center justify-center text-2xl font-black"
              style={{ background: "#c9b99a", color: "#2b2622" }}
            >
              A
            </div>
            <div className="leading-none">
              <div className="text-[34px] font-black tracking-tight">AGENDILHA informa:</div>
              <div className="text-[16px] uppercase tracking-[0.3em] mt-2" style={{ color: "#c9b99a" }}>
                Curadoria local da Ilha
              </div>
            </div>
          </div>
          <div className="text-[18px] font-semibold uppercase tracking-[0.22em]" style={{ color: "#c9b99a" }}>
            coé a boa?
          </div>
        </div>

        {/* Photo */}
        <div className="relative w-full" style={{ height: 560 }}>
          <img
            src={img}
            alt={artist}
            crossOrigin="anonymous"
            className="w-full h-full object-cover"
          />
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(to top, rgba(43,38,34,0.55) 0%, rgba(43,38,34,0) 45%)",
            }}
          />
          {/* Time chip — big & loud */}
          <div
            className="absolute bottom-8 left-14 px-8 py-5 rounded-full shadow-lg"
            style={{ background: "#faf8f5", color: "#2b2622" }}
          >
            <div className="flex items-baseline gap-3">
              <span className="text-[18px] font-semibold uppercase tracking-[0.22em]" style={{ color: "#8b7355" }}>
                {formatBrazilianDate(event.date || "")}
              </span>
              <span className="text-[56px] font-black leading-none tracking-tight">
                {event.start_time || "—"}
              </span>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 flex flex-col justify-between px-14 pt-10 pb-12">
          <div>
            <div className="text-[18px] font-semibold uppercase tracking-[0.3em]" style={{ color: "#8b7355" }}>
              {emoji} {event.music_style || event.category || "Programe-se"}
            </div>

            <h1
              className="font-black tracking-[-0.02em] leading-[0.95] mt-5"
              style={{ fontSize: 88, fontFamily: "'Outfit', sans-serif" }}
            >
              {artist}
            </h1>

            <p className="text-[30px] mt-7 leading-snug" style={{ color: "#4a423d", maxWidth: 920 }}>
              {tagline}
            </p>
          </div>

          <div className="mt-10 flex items-end justify-between gap-8">
            <div className="flex items-start gap-4 max-w-[680px]">
              <span className="text-[34px] leading-none mt-1">📍</span>
              <div>
                <div className="text-[28px] font-bold leading-tight">{event.location || "Local a confirmar"}</div>
                {fullAddress && (
                  <div className="text-[20px] mt-1.5" style={{ color: "#6b625b" }}>
                    {fullAddress}
                  </div>
                )}
              </div>
            </div>

            <div className="text-right shrink-0">
              <div
                className="inline-block px-7 py-4 rounded-full text-[22px] font-bold"
                style={{ background: "#2b2622", color: "#faf8f5" }}
              >
                Chame os amigos 🎉
              </div>
              <div className="text-[16px] uppercase tracking-[0.28em] mt-3" style={{ color: "#8b7355" }}>
                agendilha.app
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
);
EventWhatsAppCard.displayName = "EventWhatsAppCard";

/* ---------- Preview + export actions ---------- */

export function EventWhatsAppCardExport({ event }: { event: FlyerEvent }) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [busy, setBusy] = useState<"download" | "share" | null>(null);

  async function render(): Promise<{ blob: Blob; dataUrl: string } | null> {
    if (!cardRef.current) return null;
    const dataUrl = await toPng(cardRef.current, {
      pixelRatio: 1, // node is already 1080px
      cacheBust: true,
      backgroundColor: "#faf8f5",
    });
    const blob = await (await fetch(dataUrl)).blob();
    return { blob, dataUrl };
  }

  async function handleDownload() {
    try {
      setBusy("download");
      const res = await render();
      if (!res) return;
      const a = document.createElement("a");
      a.href = res.dataUrl;
      a.download = `agendilha-${event.id.slice(0, 8)}.png`;
      a.click();
      toast.success("Card baixado!");
    } catch (e) {
      handleError(e, { context: "EventWhatsAppCard.download", fallback: "Não deu pra gerar o card. Tenta de novo." });
    } finally {
      setBusy(null);
    }
  }

  async function handleShare() {
    try {
      setBusy("share");
      const res = await render();
      if (!res) return;
      const file = new File([res.blob], `agendilha-${event.id.slice(0, 8)}.png`, { type: "image/png" });
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: event.event_title,
          text: `${event.event_title} — via AgendIlha`,
        });
      } else {
        const a = document.createElement("a");
        a.href = res.dataUrl;
        a.download = `agendilha-${event.id.slice(0, 8)}.png`;
        a.click();
        toast.success("Card salvo — envie no seu WhatsApp");
      }
    } catch (e: any) {
      handleError(e, { context: "EventWhatsAppCard.share", fallback: "Não deu pra compartilhar. Tenta de novo." });
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="space-y-4">
      {/* Preview shrunk to fit screen */}
      <div className="w-full overflow-hidden rounded-2xl ring-1 ring-foreground/10 bg-foreground/[0.03]">
        <div className="origin-top-left" style={{ transform: "scale(var(--flyer-scale, 0.32))", width: 1080 }}>
          <EventWhatsAppCard ref={cardRef} event={event} />
        </div>
        <style>{`@media (min-width: 640px){ :root{ --flyer-scale: 0.4; } }`}</style>
      </div>

      <div className="flex gap-2">
        <Button
          className="flex-1 h-11 rounded-full bg-foreground text-background hover:bg-foreground/90 font-semibold tracking-tight shadow-none"
          onClick={handleShare}
          disabled={!!busy}
        >
          {busy === "share" ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Share2 className="h-4 w-4 mr-2" strokeWidth={2} />}
          Compartilhar card
        </Button>
        <Button
          variant="outline"
          className="h-11 rounded-full border-foreground/15 bg-transparent hover:bg-foreground/5 font-medium"
          onClick={handleDownload}
          disabled={!!busy}
          aria-label="Baixar imagem"
        >
          {busy === "download" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" strokeWidth={2} />}
        </Button>
      </div>
    </div>
  );
}
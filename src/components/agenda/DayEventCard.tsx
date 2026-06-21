import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  CalendarDays,
  Clock,
  MapPin,
  MessageCircle,
  Music as MusicIcon,
  Share2,
  Tag,
  Trophy,
  Utensils,
} from "lucide-react";
import { FavoriteButton } from "@/components/FavoriteButton";
import { EventImage } from "./EventImage";
import { buildWhatsAppShare } from "./agenda-utils";
import { categoryIcons, categoryLabels, type AgendaEvent } from "./types";
import { buildFullAddress, getShareData } from "@/lib/sharing";

interface DayEventCardProps {
  event: AgendaEvent;
  onSelect: (ev: AgendaEvent) => void;
  onShare: (title: string, text: string, url: string, eventId?: string) => void;
  trackView: (id: string) => void;
  trackShare: (id: string) => void;
}

export function DayEventCard({
  event: ev,
  onSelect,
  onShare,
  trackView,
  trackShare,
}: DayEventCardProps) {
  const icon = categoryIcons[ev.category || ""] || "📌";
  const IconComp = (ev.category === "musica"
    ? MusicIcon
    : ev.category === "gastronomia"
      ? Utensils
      : ev.category === "esporte"
        ? Trophy
        : ev.category === "promocoes"
          ? Tag
          : CalendarDays) as any;

  return (
    <Card
      className="overflow-hidden border-border/60 bg-card/50 hover:shadow-elevated transition-all group cursor-pointer rounded-[2.5rem] event-card"
      data-event-id={ev.id}
      onClick={() => {
        trackView(ev.id);
        onSelect(ev);
      }}
    >
      <CardContent className="p-0">
        <div className="flex flex-col lg:flex-row min-h-[320px]">
          <div className="w-full lg:w-72 xl:w-80 h-48 sm:h-64 lg:h-auto shrink-0 relative overflow-hidden group">
            <EventImage
              src={ev.image_url}
              alt={ev.event_title}
              category={ev.category}
              className="absolute inset-0 w-full h-full event-image"
              icon={IconComp}
            />

            <div className="absolute top-4 right-4 z-30 flex flex-col gap-2">
              <FavoriteButton eventId={ev.id} className="h-10 w-10" />
              <Button
                variant="ghost"
                size="icon"
                className="h-10 w-10 rounded-full backdrop-blur-md border border-white/20 bg-black/20 text-white hover:bg-white/20 shadow-sm"
                onClick={(e) => {
                  e.stopPropagation();
                  const data = getShareData(ev as any);
                  onShare(data.title, data.text, data.url, ev.id);
                }}
              >
                <Share2 className="h-5 w-5" />
              </Button>
            </div>

            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent lg:hidden" />

            <div className="absolute bottom-4 left-4 lg:hidden">
              <Badge className="bg-white/95 text-primary border-none font-black text-[10px] tracking-widest px-3 py-1 shadow-lg backdrop-blur-sm">
                {categoryLabels[ev.category!]?.split(" ")[0] || ev.category}
              </Badge>
            </div>
          </div>

          <div className="flex-1 p-5 sm:p-8 lg:p-10 flex flex-col justify-between space-y-5 sm:space-y-6">
            <div className="space-y-4 sm:space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div className="space-y-2 flex-1 min-w-0">
                  <div className="hidden lg:flex items-center gap-2 mb-2">
                    <span className="text-2xl">{icon}</span>
                    <Badge
                      variant="secondary"
                      className="bg-[#F6EEEA] text-[#2F5D46] text-[10px] font-semibold uppercase tracking-[0.15em] border-[#E6D6CF] border px-2.5 py-1 rounded-full shadow-sm"
                    >
                      {categoryLabels[ev.category!] || ev.category}
                    </Badge>
                  </div>
                  <h3 className="text-xl sm:text-3xl lg:text-4xl font-black text-foreground leading-[1.2] tracking-tight group-hover:text-primary transition-colors">
                    {ev.event_title}
                  </h3>
                </div>

                <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-start gap-2 shrink-0">
                  <div className="flex items-center gap-2 text-primary font-black bg-primary/5 px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl border border-primary/10 shadow-sm">
                    <Clock className="h-4 w-4 sm:h-5 sm:w-5" />
                    <span className="text-lg sm:text-2xl tracking-tighter">
                      {ev.start_time || "--:--"}
                    </span>
                  </div>
                  <div className="text-[10px] sm:text-[11px] font-bold text-muted-foreground/70 uppercase tracking-[0.15em]">
                    {ev.address_neighborhood || "Ilha do Gv."}
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-2.5 sm:gap-3 text-xs sm:text-base text-muted-foreground bg-muted/30 p-3.5 sm:p-4 rounded-xl sm:rounded-2xl border border-border/40">
                <MapPin className="h-4 w-4 sm:h-5 sm:w-5 text-primary/60 shrink-0 mt-0.5" />
                <span className="font-semibold leading-snug line-clamp-2">
                  {buildFullAddress(ev as any)}
                </span>
              </div>

              {ev.description && (
                <p className="text-muted-foreground/80 line-clamp-2 sm:line-clamp-3 leading-relaxed text-sm sm:text-base font-medium max-w-2xl">
                  {ev.description}
                </p>
              )}
            </div>

            <div className="pt-2 sm:pt-4 flex flex-wrap items-center gap-2 sm:gap-3 lg:gap-4">
              <Button
                size="sm"
                className="rounded-full h-11 sm:h-14 px-5 sm:px-8 font-black uppercase tracking-widest gradient-sunset text-white shadow-md sm:shadow-lg hover:scale-[1.03] active:scale-95 transition-all text-[11px] sm:text-xs flex-1 sm:flex-initial"
                onClick={(e) => {
                  e.stopPropagation();
                  trackShare(ev.id);
                  window.open(buildWhatsAppShare(ev), "_blank");
                }}
              >
                <MessageCircle className="h-4 w-4 mr-2" /> WhatsApp
              </Button>

              <Button
                size="sm"
                variant="outline"
                className="rounded-full h-11 sm:h-14 px-4 sm:px-6 font-bold text-primary border-2 border-primary/20 hover:bg-primary hover:text-white active:scale-95 transition-all text-[11px] sm:text-xs flex-1 sm:flex-initial"
                onClick={(e) => {
                  e.stopPropagation();
                  const data = getShareData(ev as any);
                  onShare(data.title, data.text, data.url, ev.id);
                }}
              >
                <Share2 className="h-4 w-4 mr-2" /> Compartilhar
              </Button>

              <Button
                size="sm"
                variant="ghost"
                className="rounded-full h-11 sm:h-14 px-4 sm:px-6 font-bold text-muted-foreground/60 hover:text-primary transition-all active:scale-95 text-[11px] sm:text-xs hidden xs:flex items-center"
                onClick={(e) => {
                  e.stopPropagation();
                  const addr = buildFullAddress(ev as any);
                  window.open(
                    `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(addr)}`,
                    "_blank",
                  );
                }}
              >
                <MapPin className="h-4 w-4 mr-2" /> Ver Mapa
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
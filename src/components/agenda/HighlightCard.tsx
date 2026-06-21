import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CalendarDays, MapPin, Share2, Sparkles } from "lucide-react";
import { FavoriteButton } from "@/components/FavoriteButton";
import { EventImage } from "./EventImage";
import { categoryLabels, type AgendaEvent } from "./types";
import { getShareData } from "@/lib/sharing";

interface HighlightCardProps {
  event: AgendaEvent;
  onSelect: (ev: AgendaEvent) => void;
  onShare: (title: string, text: string, url: string, eventId?: string) => void;
  trackView: (id: string) => void;
}

export function HighlightCard({ event: ev, onSelect, onShare, trackView }: HighlightCardProps) {
  return (
    <Card
      className="min-w-[300px] sm:min-w-[350px] snap-start border-orange-500/30 bg-gradient-to-br from-orange-500/10 to-transparent hover:shadow-lg transition-all cursor-pointer overflow-hidden group event-card"
      data-event-id={ev.id}
      data-nome={ev.event_title}
      onClick={() => {
        trackView(ev.id);
        onSelect(ev);
      }}
    >
      <div className="relative overflow-hidden group">
        <EventImage
          src={ev.image_url}
          alt={ev.event_title}
          category={ev.category}
          className="h-48 w-full event-image"
          icon={Sparkles}
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
      </div>
      <CardContent className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <Badge className="bg-orange-500 hover:bg-orange-600 text-white border-0">
            DESTAQUE 🔥
          </Badge>
          <span className="text-xs font-medium text-orange-600/70">
            {categoryLabels[ev.category!] || ev.category}
          </span>
        </div>
        <h3 className="font-display font-bold text-2xl leading-tight line-clamp-2 group-hover:text-primary transition-colors">
          {ev.event_title}
        </h3>
        <div className="space-y-2 text-sm text-muted-foreground font-medium">
          <div className="flex items-center gap-2">
            <CalendarDays className="h-4 w-4 text-orange-500" />
            <span>
              {ev.date} {ev.start_time ? `• ${ev.start_time}` : ""}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-orange-500" />
            <span className="line-clamp-1">{ev.location}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
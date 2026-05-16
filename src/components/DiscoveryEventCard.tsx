import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Calendar, Star, Clock, Heart, Share2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface Event {
  id: string;
  event_title: string;
  date: string | null;
  start_time: string | null;
  location: string | null;
  address_neighborhood: string | null;
  category: string | null;
  image_url?: string | null;
  rating?: { average: number; total: number };
}

const categoryIcons: Record<string, string> = {
  musica: "🎸",
  gastronomia: "🍻",
  cultura: "🎭",
  esporte: "⚽",
  promocoes: "🏷️",
  outros: "📌",
};

export function DiscoveryEventCard({ 
  event, 
  onClick, 
  variant = "large",
  isFavorite = false,
  onFavoriteToggle
}: { 
  event: Event; 
  onClick: () => void; 
  variant?: "large" | "small" | "horizontal";
  isFavorite?: boolean;
  onFavoriteToggle?: (e: React.MouseEvent) => void;
}) {
  const isLarge = variant === "large";
  const isHorizontal = variant === "horizontal";

  return (
    <Card 
      onClick={onClick}
      className={cn(
        "group cursor-pointer overflow-hidden border-none bg-transparent transition-all hover:scale-[1.02] active:scale-95",
        isLarge ? "w-[280px] sm:w-[320px]" : isHorizontal ? "w-full" : "w-[200px]"
      )}
    >
      <div className={cn(
        "relative aspect-[4/5] w-full overflow-hidden rounded-[2rem] shadow-xl",
        isHorizontal && "aspect-[16/9]"
      )}>
        <img 
          src={event.image_url || "/placeholder.svg"} 
          alt={event.event_title}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
        
        {/* Category Badge */}
        <div className="absolute left-4 top-4">
          <Badge className="bg-white/20 backdrop-blur-md border-white/30 text-white font-bold py-1 px-3 rounded-full">
            {categoryIcons[event.category || "outros"]} {event.category}
          </Badge>
        </div>

        {/* Quick Actions */}
        <div className="absolute right-4 top-4 flex flex-col gap-2">
          <Button 
            variant="ghost" 
            size="icon" 
            className={cn(
              "h-10 w-10 rounded-full backdrop-blur-md border border-white/20 transition-all active:scale-90",
              isFavorite ? "bg-primary text-white" : "bg-black/20 text-white hover:bg-white/20"
            )}
            onClick={(e) => {
              e.stopPropagation();
              onFavoriteToggle?.(e);
            }}
          >
            <Heart className={cn("h-5 w-5", isFavorite && "fill-current")} />
          </Button>
          
          {event.rating && event.rating.total > 0 && (
            <Badge className="bg-yellow-400/90 text-black font-black py-1 px-3 rounded-full flex items-center gap-1 h-10">
              <Star className="h-3 w-3 fill-current" />
              {event.rating.average.toFixed(1)}
            </Badge>
          )}
        </div>
        {event.rating && event.rating.total > 0 && (
          <div className="absolute right-4 top-4">
            <Badge className="bg-yellow-400/90 text-black font-black py-1 px-3 rounded-full flex items-center gap-1">
              <Star className="h-3 w-3 fill-current" />
              {event.rating.average.toFixed(1)}
            </Badge>
          </div>
        )}

        <div className="absolute bottom-6 left-6 right-6 text-white">
          <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-white/70 mb-2">
            <Calendar className="h-3 w-3" />
            {event.date} {event.start_time && `• ${event.start_time}`}
          </div>
          <h3 className={cn(
            "font-display font-black leading-tight mb-2 group-hover:text-primary transition-colors",
            isLarge ? "text-2xl" : "text-lg"
          )}>
            {event.event_title}
          </h3>
          <div className="flex items-center gap-1.5 text-sm font-medium text-white/60">
            <MapPin className="h-4 w-4 text-primary" />
            <span className="truncate">{event.location} • {event.address_neighborhood}</span>
          </div>
        </div>
      </div>
    </Card>
  );
}
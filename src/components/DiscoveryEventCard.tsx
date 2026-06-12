import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, Calendar, Star, Heart, Share2, Music, Utensils, Theater, Trophy, Tag, MoreHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useMemo, memo } from "react";
import { getEventFallbackImage } from "@/lib/event-utils";
import { Skeleton } from "@/components/ui/skeleton";
import { useThumbnailCache } from "@/hooks/useThumbnailCache";
import { formatBrazilianDate } from "@/lib/date-utils";

interface Event {
  id: string;
  event_title: string;
  date: string | null;
  start_time: string | null;
  location: string | null;
  address_neighborhood: string | null;
  category: string | null;
  image_url?: string | null;
  imageUrl?: string | null;
  rating?: { average: number; total: number };
  age_rating?: string;
  is_suitable_for_minors?: boolean;
}

const CATEGORY_MAP: Record<string, { label: string; icon: any }> = {
  musica:      { label: "Música",      icon: Music },
  gastronomia: { label: "Gastronomia", icon: Utensils },
  cultura:     { label: "Cultura",     icon: Theater },
  esporte:     { label: "Esporte",     icon: Trophy },
  promocoes:   { label: "Promoções",   icon: Tag },
  outros:      { label: "Outros",      icon: MoreHorizontal },
};

function isToday(d?: string | null) {
  if (!d) return false;
  const today = new Date().toISOString().slice(0, 10);
  return d.slice(0, 10) === today;
}

export const DiscoveryEventCard = memo(({
  event,
  onClick,
  variant = "large",
  isFavorite = false,
  onFavoriteToggle,
   onShare,
   className
 }: {
   event: Event;
   onClick: () => void;
   variant?: "large" | "small" | "horizontal" | "compact";
   isFavorite?: boolean;
   onFavoriteToggle?: (e: React.MouseEvent) => void;
   onShare?: (e: React.MouseEvent) => void;
   className?: string;
 }) => {
  const isLarge = variant === "large";
  const isHorizontal = variant === "horizontal";
  const isCompact = variant === "compact";
  const isSmall = variant === "small";
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  const fallbackImage = useMemo(() => getEventFallbackImage(event.category), [event.category]);
  const officialImage = event.image_url || event.imageUrl;
  const sourceImage = hasError ? fallbackImage : (officialImage || fallbackImage);
  const cachedThumb = useThumbnailCache(event.id, isCompact ? sourceImage : undefined);
  const finalImage = isCompact ? (cachedThumb || sourceImage) : sourceImage;

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "50px" }}
      transition={{ duration: 0.35 }}
    >
      <Card
        onClick={onClick}
        className={cn(
          "group cursor-pointer overflow-hidden border-none bg-transparent transition-all duration-300 hover:-translate-y-0.5 focus-visible:ring-2 focus-visible:ring-foreground/20 focus-visible:ring-offset-2 outline-none",
          isHorizontal ? "w-full" : 
            !className?.includes('w-') && (
              isLarge ? "w-[260px] xs:w-[280px] sm:w-[320px]" :
              isCompact ? "w-[180px] xs:w-[220px]" :
              isSmall ? "w-[150px] xs:w-[180px]" : "w-[150px] xs:w-[180px]"
            ),
          className
        )}
      >
         <div className={cn(
           "relative aspect-[4/5] w-full overflow-hidden rounded-[1.5rem] shadow-card bg-muted ring-1 ring-foreground/[0.04]",
           isHorizontal && "aspect-[16/9]",
          isCompact && "aspect-square h-[220px] xs:h-[240px]"
         )}>
          <AnimatePresence>
            {!isLoaded && (
              <motion.div
                initial={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-muted/10 animate-pulse z-10 p-4"
              >
                <Skeleton className="h-full w-full rounded-2xl" />
              </motion.div>
            )}
          </AnimatePresence>

            <img
              src={finalImage}
              alt={event.event_title}
              loading="lazy"
              decoding="async"
              onLoad={() => setIsLoaded(true)}
              onError={() => {
                setHasError(true);
                setIsLoaded(true);
              }}
              className={cn(
               "h-full w-full object-cover transition-all duration-[1200ms] ease-out group-hover:scale-[1.06]",
                !isLoaded ? "opacity-0 scale-105 blur-sm" : "opacity-100 scale-100 blur-0"
              )}
            />
           <div className="absolute inset-0 bg-gradient-to-t from-foreground/90 from-[12%] via-foreground/30 via-[45%] to-transparent to-[78%] pointer-events-none" />
           
           {/* Top Badges Left */}
           <div className="absolute left-4 top-4 flex flex-wrap gap-2 z-20">
             {(() => {
               const cat = CATEGORY_MAP[event.category || "outros"] || CATEGORY_MAP.outros;
               const Icon = cat.icon;
               return (
                 <Badge className="bg-background/90 backdrop-blur-md text-foreground border border-foreground/5 text-[10px] font-semibold uppercase tracking-[0.18em] py-1 px-3 rounded-full flex items-center gap-1.5 shadow-none">
                   <Icon className="h-3 w-3" strokeWidth={2} />
                   {cat.label}
                 </Badge>
               );
             })()}
             
             {event.age_rating === '18+' && (
               <Badge className="bg-destructive/90 text-destructive-foreground backdrop-blur-md font-semibold text-[10px] py-1 px-2.5 rounded-full border-none">
                 18+
               </Badge>
             )}
             {isToday(event.date) && (
               <Badge className="bg-foreground text-background backdrop-blur-md font-semibold text-[10px] uppercase tracking-[0.18em] py-1 px-3 rounded-full border-none">
                 Hoje
               </Badge>
             )}
           </div>
  
           {/* Quick Actions Right */}
           <div className="absolute right-4 top-4 flex flex-col gap-2 z-20">
             <Button 
                variant="ghost" 
                size="icon" 
                className={cn(
                  "h-9 w-9 rounded-full backdrop-blur-md border-none transition-all active:scale-90",
                  isFavorite ? "bg-background text-foreground" : "bg-background/70 text-foreground hover:bg-background"
                )}
                onClick={(e) => {
                  e.stopPropagation();
                  onFavoriteToggle?.(e);
                }}
             >
               <Heart className={cn("h-4 w-4", isFavorite && "fill-current")} strokeWidth={2} />
             </Button>
  
             <Button 
                variant="ghost" 
                size="icon" 
                className="h-9 w-9 rounded-full backdrop-blur-md border-none bg-background/70 text-foreground hover:bg-background transition-all active:scale-90"
                onClick={(e) => {
                  e.stopPropagation();
                  onShare?.(e);
                }}
             >
               <Share2 className="h-4 w-4" strokeWidth={2} />
             </Button>
  
             {event.rating && event.rating.total > 0 && (
               <Badge className="bg-background/90 backdrop-blur-md text-foreground font-semibold py-1 px-2.5 rounded-full flex items-center gap-1 h-9 border-none">
                 <Star className="h-3 w-3 fill-current text-foreground" />
                 {event.rating.average.toFixed(1)}
               </Badge>
             )}
           </div>
             <div className={cn(
               "absolute bottom-0 left-0 right-0 p-5 xs:p-6 text-background",
               isCompact && "p-3 xs:p-4"
             )}>
              <div className={cn(
                "flex items-center gap-2 text-[10px] xs:text-[11px] font-semibold uppercase tracking-[0.24em] text-background/80 mb-2.5",
                isCompact && "mb-1.5 tracking-[0.18em]"
              )}>
                <Calendar className="h-3 w-3" strokeWidth={2} />
                <span>{formatBrazilianDate(event.date)}</span>
                {event.start_time && (
                  <>
                    <span className="h-px w-3 bg-background/40" aria-hidden />
                    <span className="tracking-[0.18em]">{event.start_time}</span>
                  </>
                )}
              </div>
               <h3 className={cn(
                 "font-display font-semibold tracking-[-0.01em] leading-[1.12] mb-2.5 line-clamp-2 text-background",
                 isLarge ? "text-[22px] xs:text-2xl" : "text-base xs:text-lg",
                 isCompact && "text-sm xs:text-base mb-1"
               )}>
                 {event.event_title}
               </h3>
               <div className="flex items-center gap-1.5 text-[11px] xs:text-sm font-normal text-background/70">
                 <MapPin className="h-3 w-3 xs:h-3.5 xs:w-3.5 shrink-0" strokeWidth={2} />
                 <span className="truncate">{event.location}</span>
               </div>
             </div>
         </div>
       </Card>
    </motion.div>
  );
});

DiscoveryEventCard.displayName = "DiscoveryEventCard";
 import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, Calendar, Star, Heart, Share2, Music, Utensils, Theater, Trophy, Tag, MoreHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useMemo } from "react";
import { getEventFallbackImage } from "@/lib/event-utils";
import { Skeleton } from "@/components/ui/skeleton";
import { useThumbnailCache } from "@/hooks/useThumbnailCache";

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

const CATEGORY_MAP: Record<string, { label: string; icon: any; color: string; bg: string; border: string }> = {
  musica: { label: "Música / Show", icon: Music, color: "#2F5D46", bg: "#F6EEEA", border: "#E6D6CF" },
  gastronomia: { label: "Gastronomia", icon: Utensils, color: "#7C2D12", bg: "#FFF7ED", border: "#FFEDD5" },
  cultura: { label: "Cultura / Arte", icon: Theater, color: "#4C1D95", bg: "#F5F3FF", border: "#EDE9FE" },
  esporte: { label: "Esporte", icon: Trophy, color: "#1E3A8A", bg: "#EFF6FF", border: "#DBEAFE" },
  promocoes: { label: "Promoções", icon: Tag, color: "#991B1B", bg: "#FEF2F2", border: "#FEE2E2" },
  outros: { label: "Outros", icon: MoreHorizontal, color: "#374151", bg: "#F9FAFB", border: "#F3F4F6" },
};

export function DiscoveryEventCard({
  event,
  onClick,
  variant = "large",
  isFavorite = false,
  onFavoriteToggle,
  onShare
}: {
  event: Event;
  onClick: () => void;
  variant?: "large" | "small" | "horizontal" | "compact";
  isFavorite?: boolean;
  onFavoriteToggle?: (e: React.MouseEvent) => void;
  onShare?: (e: React.MouseEvent) => void;
}) {
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
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <Card
        onClick={onClick}
        className={cn(
          "group cursor-pointer overflow-hidden border-none bg-transparent transition-all hover:scale-[1.02] active:scale-95 focus-within:ring-2 focus-within:ring-primary focus-within:ring-offset-2",
          isLarge ? "w-[260px] xs:w-[280px] sm:w-[320px]" :
            isHorizontal ? "w-full" :
              isCompact ? "w-[220px]" :
                isSmall ? "w-[160px] xs:w-[200px]" : "w-[160px] xs:w-[200px]"
        )}
      >
         <div className={cn(
           "relative aspect-[4/5] w-full overflow-hidden rounded-[2rem] shadow-xl bg-muted/20",
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

            {officialImage && (
              <link rel="prefetch" href={officialImage} as="image" />
            )}
            <img
              src={finalImage}
              alt={event.event_title}
              loading="eager"
              onLoad={() => setIsLoaded(true)}
              onError={() => {
                setHasError(true);
                setIsLoaded(true);
              }}
              className={cn(
                "h-full w-full object-cover transition-all duration-700 group-hover:scale-110",
                !isLoaded ? "opacity-0 scale-105 blur-sm" : "opacity-100 scale-100 blur-0"
              )}
            />
           <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent pointer-events-none" />
           
           {/* Top Badges Left */}
           <div className="absolute left-4 top-4 flex flex-wrap gap-2 z-20">
             {(() => {
               const cat = CATEGORY_MAP[event.category || "outros"] || CATEGORY_MAP.outros;
               const Icon = cat.icon;
               return (
                 <Badge 
                   style={{ backgroundColor: cat.bg, color: cat.color, borderColor: cat.border }}
                   className="border shadow-sm text-[10px] font-bold uppercase tracking-wider py-1.5 px-3.5 rounded-full flex items-center gap-1.5"
                 >
                   <Icon className="h-3 w-3" strokeWidth={2.5} />
                   {cat.label}
                 </Badge>
               );
             })()}
             
             {event.age_rating && (
               <Badge className={cn(
                 "backdrop-blur-md text-white font-black text-[10px] py-1 px-3 rounded-full border border-white/30 shadow-sm",
                 event.age_rating === '18+' ? "bg-red-500/60" : "bg-green-500/60"
               )}>
                 {event.age_rating}
               </Badge>
             )}
           </div>
 
           {/* Quick Actions Right */}
           <div className="absolute right-4 top-4 flex flex-col gap-2 z-20">
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
 
             <Button 
               variant="ghost" 
               size="icon" 
               className="h-10 w-10 rounded-full backdrop-blur-md border border-white/20 bg-black/20 text-white hover:bg-white/20 transition-all active:scale-90"
               onClick={(e) => {
                 e.stopPropagation();
                 onShare?.(e);
               }}
             >
               <Share2 className="h-5 w-5" />
             </Button>
 
             {event.rating && event.rating.total > 0 && (
               <Badge className="bg-yellow-400/90 text-black font-black py-1 px-3 rounded-full flex items-center gap-1 h-10">
                 <Star className="h-3 w-3 fill-current" />
                 {event.rating.average.toFixed(1)}
               </Badge>
             )}
           </div>
            <div className={cn(
              "absolute bottom-0 left-0 right-0 p-4 xs:p-6 text-white bg-gradient-to-t from-black/90 via-black/40 to-transparent",
              isCompact && "p-3 xs:p-4"
            )}>
              <div className={cn(
                "flex items-center gap-2 text-[10px] xs:text-xs font-mono uppercase tracking-widest text-white/70 mb-1 xs:mb-2",
                isCompact && "mb-1"
              )}>
                <Calendar className="h-3 w-3" />
                {event.date} {event.start_time && `• ${event.start_time}`}
              </div>
              <h3 className={cn(
                "font-display font-black leading-tight mb-1 xs:mb-2 group-hover:text-primary transition-colors line-clamp-2",
                isLarge ? "text-xl xs:text-2xl" : "text-base xs:text-lg",
                isCompact && "text-sm xs:text-base mb-1"
              )}>
                {event.event_title}
              </h3>
              <div className="flex items-center gap-1.5 text-[10px] xs:text-sm font-medium text-white/60">
                <MapPin className="h-3 w-3 xs:h-4 xs:w-4 text-primary shrink-0" />
                <span className="truncate">{event.location}</span>
              </div>
            </div>
         </div>
       </Card>
     </motion.div>
   );
}
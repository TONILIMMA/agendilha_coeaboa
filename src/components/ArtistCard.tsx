  import { Link } from "react-router-dom";
  import { memo } from "react";
 import { Badge } from "@/components/ui/badge";
 import { MapPin, Music, CheckCircle2, Heart } from "lucide-react";
 import { cn } from "@/lib/utils";
 
 interface ArtistCardProps {
   artist: {
     id: string;
     name: string;
     cover_url?: string;
     avatar_url?: string;
     genre?: string;
     neighborhood?: string;
     artist_type?: string;
     is_approved?: boolean;
   };
   className?: string;
 }
 
 const ArtistCard = memo(({ artist, className }: ArtistCardProps) => {
   return (
     <Link 
       to={`/artista/${artist.id}`}
       className={cn(
         "group relative bg-card rounded-2xl overflow-hidden border border-border transition-all duration-300 hover:shadow-xl hover:-translate-y-1",
         className
       )}
     >
       {/* Cover Image */}
       <div className="aspect-[16/9] w-full overflow-hidden">
         <img 
           src={artist.cover_url || 'https://images.unsplash.com/photo-1501612780327-45045538702b?auto=format&fit=crop&q=80'} 
           alt={artist.name}
           className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
         />
         <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60 group-hover:opacity-80 transition-opacity" />
       </div>
 
       {/* Avatar */}
       <div className="absolute top-1/2 left-4 -translate-y-1/2">
         <div className="h-16 w-16 rounded-full border-4 border-card overflow-hidden shadow-lg bg-muted">
           <img 
             src={artist.avatar_url || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&q=80'} 
             alt={artist.name}
             className="h-full w-full object-cover"
           />
         </div>
         {artist.is_approved && (
           <div className="absolute bottom-0 right-0 bg-primary text-white p-0.5 rounded-full border-2 border-card">
             <CheckCircle2 className="h-3 w-3" />
           </div>
         )}
       </div>
 
       {/* Content */}
       <div className="p-4 pt-10 space-y-3">
         <div className="flex justify-between items-start">
           <div>
             <h3 className="font-display font-bold text-lg group-hover:text-primary transition-colors">
               {artist.name}
             </h3>
             <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
               <Music className="h-3 w-3" /> {artist.genre}
             </div>
           </div>
           <button className="p-2 rounded-full bg-muted/50 text-muted-foreground hover:bg-primary/10 hover:text-primary transition-all">
             <Heart className="h-4 w-4" />
           </button>
         </div>
 
         <div className="flex items-center gap-2 text-[10px] text-muted-foreground pt-2 border-t border-border/50">
           <span className="flex items-center gap-1">
             <MapPin className="h-2.5 w-2.5" /> {artist.neighborhood}
           </span>
           <span>•</span>
           <span className="capitalize">{artist.artist_type}</span>
         </div>
       </div>
     </Link>
   );
 });
 
 export default ArtistCard;
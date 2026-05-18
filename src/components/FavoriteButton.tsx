 import { Heart } from "lucide-react";
 import { Button } from "@/components/ui/button";
 import { cn } from "@/lib/utils";
 import { useFavorites } from "@/hooks/useFavorites";
 import { toast } from "sonner";

 interface FavoriteButtonProps {
   eventId: string;
   className?: string;
   variant?: "default" | "ghost";
   size?: "default" | "sm" | "lg" | "icon";
 }

 export function FavoriteButton({ eventId, className, variant = "ghost", size = "icon" }: FavoriteButtonProps) {
   const { isFavorite, toggleFavorite } = useFavorites();
   const active = isFavorite(eventId);

   return (
     <Button
       variant={variant}
       size={size}
       className={cn(
         "rounded-full transition-all active:scale-90 shadow-sm",
         active ? "bg-primary text-white" : "bg-black/20 text-white hover:bg-white/20",
         className
       )}
       onClick={(e) => {
         e.stopPropagation();
         toggleFavorite(eventId);
         toast.success(active ? "Removido dos favoritos" : "Adicionado aos favoritos");
       }}
     >
       <Heart className={cn("h-4 w-4", active && "fill-current")} />
     </Button>
   );
 }
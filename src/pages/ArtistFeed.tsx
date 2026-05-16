 import { useState, useRef, useEffect } from "react";
 import { useQuery } from "@tanstack/react-query";
 import { supabase } from "@/integrations/supabase/client";
 import { Loader2, Music, Play, Pause, Volume2, VolumeX, User, ChevronUp, ChevronDown, Share2, Heart } from "lucide-react";
 import { Button } from "@/components/ui/button";
 import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
 import { cn } from "@/lib/utils";
 import { toast } from "sonner";
 import { Link } from "react-router-dom";
 
 interface MediaItem {
   id: string;
   url: string;
   media_type: string;
   thumbnail_url: string | null;
   artist_id: string;
   artist?: {
     id: string;
     name: string;
     genre: string;
     avatar_url: string | null;
   } | null;
 }
 
 function VideoItem({ item, isActive }: { item: MediaItem, isActive: boolean }) {
   const videoRef = useRef<HTMLVideoElement>(null);
   const [isPlaying, setIsPlaying] = useState(false);
   const [isMuted, setIsMuted] = useState(true);
 
   useEffect(() => {
     if (videoRef.current) {
       if (isActive) {
         videoRef.current.play().catch(() => setIsPlaying(false));
         setIsPlaying(true);
       } else {
         videoRef.current.pause();
         setIsPlaying(false);
       }
     }
   }, [isActive]);
 
   const togglePlay = () => {
     if (videoRef.current) {
       if (isPlaying) {
         videoRef.current.pause();
       } else {
         videoRef.current.play();
       }
       setIsPlaying(!isPlaying);
     }
   };
 
   return (
     <div className="relative h-screen w-full bg-black snap-start overflow-hidden flex flex-col items-center justify-center">
       <video
         ref={videoRef}
         src={item.url}
         className="h-full w-full object-cover sm:object-contain"
         loop
         muted={isMuted}
         playsInline
         onClick={togglePlay}
       />
       
       {/* Controls & Overlays */}
       <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/30 pointer-events-none" />
       
       {/* Artist Info Overlay */}
       <div className="absolute bottom-24 left-4 right-16 p-4 text-white z-10 pointer-events-auto">
         {item.artist ? (
           <Link to={`/artista/${item.artist_id}`} className="flex items-center gap-3 mb-3 group">
             <Avatar className="h-12 w-12 border-2 border-primary group-hover:scale-110 transition-transform">
               <AvatarImage src={item.artist.avatar_url || ""} />
               <AvatarFallback className="bg-primary/20"><User className="h-6 w-6" /></AvatarFallback>
             </Avatar>
             <div>
               <h3 className="font-display font-black text-xl leading-none">{item.artist.name}</h3>
               <p className="text-sm text-white/70 font-medium">#{item.artist.genre}</p>
             </div>
           </Link>
         ) : (
           <div className="flex items-center gap-3 mb-3 group opacity-50">
             <Avatar className="h-12 w-12 border-2 border-muted">
               <AvatarFallback className="bg-muted-foreground/20"><User className="h-6 w-6" /></AvatarFallback>
             </Avatar>
             <div>
               <h3 className="font-display font-black text-xl leading-none italic">Artista Removido</h3>
               <p className="text-sm text-white/70 font-medium">Desconhecido</p>
             </div>
           </div>
         )}
         <p className="text-sm line-clamp-2 text-white/90">Descubra novos sons locais no AgendIlha! 🎸✨</p>
       </div>
 
       {/* Interaction Sidebar */}
       <div className="absolute right-4 bottom-32 flex flex-col gap-6 z-10">
         <Button size="icon" variant="ghost" className="h-12 w-12 rounded-full bg-white/10 backdrop-blur-md text-white border border-white/20 hover:bg-white/20">
           <Heart className="h-6 w-6" />
         </Button>
         <Button 
           size="icon" 
           variant="ghost" 
           className="h-12 w-12 rounded-full bg-white/10 backdrop-blur-md text-white border border-white/20 hover:bg-white/20"
           onClick={() => {
             navigator.clipboard.writeText(`${window.location.origin}/artista/${item.artist_id}`);
             toast.success("Link do perfil copiado!");
           }}
         >
           <Share2 className="h-6 w-6" />
         </Button>
         <Button 
           size="icon" 
           variant="ghost" 
           className="h-12 w-12 rounded-full bg-white/10 backdrop-blur-md text-white border border-white/20 hover:bg-white/20"
           onClick={() => setIsMuted(!isMuted)}
         >
           {isMuted ? <VolumeX className="h-6 w-6" /> : <Volume2 className="h-6 w-6" />}
         </Button>
       </div>
 
       {/* Play/Pause Indicator */}
       {!isPlaying && (
         <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
           <div className="h-20 w-20 rounded-full bg-black/30 backdrop-blur-sm flex items-center justify-center border border-white/20">
             <Play className="h-10 w-10 text-white fill-current" />
           </div>
         </div>
       )}
     </div>
   );
 }
 
 export default function ArtistFeed() {
   const containerRef = useRef<HTMLDivElement>(null);
   const [activeIndex, setActiveIndex] = useState(0);
 
   const { data: mediaItems, isLoading } = useQuery({
     queryKey: ["artist-feed"],
     queryFn: async () => {
       const { data, error } = await supabase
         .from("artist_media")
         .select(`
           *,
           artist:artist_profiles(id, name, genre, avatar_url)
         `)
         .eq("media_type", "video")
         .order("created_at", { ascending: false });
       
       if (error) throw error;
       return data as any as MediaItem[];
     }
   });
 
   const handleScroll = () => {
     if (containerRef.current) {
       const index = Math.round(containerRef.current.scrollTop / window.innerHeight);
       setActiveIndex(index);
     }
   };
 
   if (isLoading) {
     return (
       <div className="h-[calc(100vh-64px)] flex flex-col items-center justify-center bg-black">
         <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
         <p className="text-white font-medium">Carregando feed de talentos...</p>
       </div>
     );
   }
 
   if (!mediaItems || mediaItems.length === 0) {
     return (
       <div className="h-[calc(100vh-64px)] flex flex-col items-center justify-center bg-zinc-950 p-6 text-center">
         <Music className="h-16 w-16 text-muted-foreground mb-4" />
         <h2 className="text-2xl font-bold text-white mb-2">Nenhum vídeo ainda</h2>
         <p className="text-muted-foreground max-w-xs">Os artistas locais em breve mostrarão seus talentos aqui!</p>
         <Button className="mt-6 rounded-full" onClick={() => window.location.href = "/"}>Explorar Agenda</Button>
       </div>
     );
   }
 
   return (
     <div 
       ref={containerRef}
       className="h-[calc(100vh-64px)] overflow-y-scroll snap-y snap-mandatory bg-black scroll-smooth"
       onScroll={handleScroll}
     >
       {mediaItems.map((item, index) => (
         <VideoItem key={item.id} item={item} isActive={index === activeIndex} />
       ))}
       
       {/* Help Overlay (visible on first load) */}
       {activeIndex === 0 && (
         <div className="fixed bottom-32 left-1/2 -translate-x-1/2 flex flex-col items-center animate-bounce text-white/50 pointer-events-none z-20">
           <ChevronDown className="h-6 w-6" />
           <span className="text-[10px] font-bold uppercase tracking-widest mt-1">Role para descobrir</span>
         </div>
       )}
     </div>
   );
 }
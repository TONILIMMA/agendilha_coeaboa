 import { useParams, Link } from "react-router-dom";
 import { useQuery } from "@tanstack/react-query";
 import { supabase } from "@/integrations/supabase/client";
 import { Button } from "@/components/ui/button";
 import { Badge } from "@/components/ui/badge";
 import { 
   Globe, 
   Play, 
   Video, 
   Calendar, 
   MapPin, 
   Users, 
   Music,
   MessageCircle,
   ChevronLeft,
   CheckCircle2,
   Share2,
   Heart
 } from "lucide-react";
 import { cn } from "@/lib/utils";
 import Header from "@/components/Header";
 
 export default function ArtistProfile() {
   const { id } = useParams();
 
   const { data: artist, isLoading } = useQuery({
     queryKey: ["artist", id],
     queryFn: async () => {
       const { data, error } = await supabase
         .from("artist_profiles")
         .select(`
           *,
           artist_media (*)
         `)
         .eq("id", id)
         .single();
       if (error) throw error;
       return data;
     },
   });
 
   if (isLoading) return <div className="min-h-screen flex items-center justify-center">Carregando...</div>;
   if (!artist) return <div className="min-h-screen flex items-center justify-center">Artista não encontrado.</div>;
 
   const videos = artist.artist_media?.filter(m => m.media_type === "video") || [];
   const images = artist.artist_media?.filter(m => m.media_type === "image") || [];
 
   return (
     <div className="min-h-screen bg-background pb-20">
       <Header />
       
       {/* Hero Section */}
       <div className="relative h-[40vh] md:h-[50vh] w-full overflow-hidden">
         <div 
           className="absolute inset-0 bg-cover bg-center transition-transform duration-700 hover:scale-105"
           style={{ backgroundImage: `url(${artist.cover_url || 'https://images.unsplash.com/photo-1501612780327-45045538702b?auto=format&fit=crop&q=80'})` }}
         />
         <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
         
         <Link to="/agenda" className="absolute top-4 left-4 z-10 p-2 bg-black/20 backdrop-blur-md rounded-full text-white hover:bg-black/40 transition-all">
           <ChevronLeft className="h-5 w-5" />
         </Link>
 
         <div className="absolute bottom-6 left-6 right-6 flex flex-col md:flex-row md:items-end gap-6">
           <div className="relative group">
             <div className="h-24 w-24 md:h-32 md:w-32 rounded-full border-4 border-background overflow-hidden shadow-xl">
               <img 
                 src={artist.avatar_url || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&q=80'} 
                 alt={artist.name}
                 className="h-full w-full object-cover"
               />
             </div>
             {artist.is_approved && (
               <div className="absolute -bottom-1 -right-1 bg-primary text-white p-1 rounded-full border-2 border-background">
                 <CheckCircle2 className="h-4 w-4" />
               </div>
             )}
           </div>
 
           <div className="flex-1 space-y-2">
             <div className="flex items-center gap-2 flex-wrap">
               <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20">
                 {artist.genre || 'Estilo Musical'}
               </Badge>
               <Badge variant="outline" className="capitalize">
                 {artist.artist_type === 'both' ? 'Cover & Autoral' : artist.artist_type}
               </Badge>
             </div>
             <h1 className="text-3xl md:text-5xl font-display font-bold text-foreground drop-shadow-sm">
               {artist.name}
             </h1>
             <div className="flex items-center gap-4 text-muted-foreground text-sm font-medium">
               <span className="flex items-center gap-1">
                 <MapPin className="h-4 w-4" /> {artist.neighborhood}, {artist.city}
               </span>
               <span className="flex items-center gap-1">
                 <Users className="h-4 w-4" /> {artist.member_count} {artist.member_count === 1 ? 'Integrante' : 'Integrantes'}
               </span>
             </div>
           </div>
 
           <div className="flex gap-3">
             <Button className="rounded-full gap-2 px-6 shadow-lg shadow-primary/20">
               <Heart className="h-4 w-4" /> Seguir
             </Button>
             <Button variant="outline" size="icon" className="rounded-full">
               <Share2 className="h-4 w-4" />
             </Button>
           </div>
         </div>
       </div>
 
       {/* Content */}
       <div className="max-w-7xl mx-auto px-6 mt-12 grid grid-cols-1 lg:grid-cols-3 gap-12">
         {/* Left Column: Bio & Info */}
         <div className="lg:col-span-2 space-y-12">
           <section>
             <h2 className="text-xl font-display font-bold mb-4 flex items-center gap-2">
               <Music className="h-5 w-5 text-primary" /> Sobre o Artista
             </h2>
             <p className="text-muted-foreground leading-relaxed">
               {artist.bio || "Este artista ainda não adicionou uma biografia."}
             </p>
           </section>
 
           {videos.length > 0 && (
             <section>
               <h2 className="text-xl font-display font-bold mb-4 flex items-center gap-2">
                 <Video className="h-5 w-5 text-primary" /> Vídeos Curtos
               </h2>
               <div className="flex gap-4 overflow-x-auto pb-4 snap-x no-scrollbar">
                 {videos.map((video) => (
                   <div key={video.id} className="relative min-w-[160px] aspect-[9/16] rounded-xl overflow-hidden bg-muted snap-start shadow-md hover:scale-[1.02] transition-transform">
                     <img src={video.thumbnail_url} className="w-full h-full object-cover" alt="Video thumbnail" />
                     <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/40 transition-colors">
                       <Play className="h-8 w-8 text-white drop-shadow-lg" />
                     </div>
                   </div>
                 ))}
               </div>
             </section>
           )}
 
           <section>
             <h2 className="text-xl font-display font-bold mb-4 flex items-center gap-2">
               <Calendar className="h-5 w-5 text-primary" /> Agenda de Shows
             </h2>
             <div className="bg-card rounded-2xl p-8 border border-border shadow-sm text-center">
               <p className="text-muted-foreground mb-4">Nenhum show confirmado para os próximos dias.</p>
               <Button variant="outline" className="rounded-full">Ver Agenda Completa</Button>
             </div>
           </section>
         </div>
 
         {/* Right Column: Sidebar */}
         <div className="space-y-8">
           <div className="bg-card rounded-2xl p-6 border border-border shadow-sm space-y-6 sticky top-24">
             <h3 className="font-display font-bold text-lg">Contrate o Artista</h3>
             
             <div className="space-y-3">
                 {artist.instagram && (
                   <a href={`https://instagram.com/${artist.instagram.replace('@', '')}`} target="_blank" rel="noreferrer">
                     <Button variant="outline" className="w-full justify-start gap-3 rounded-xl border-pink-100 hover:bg-pink-50 hover:text-pink-600 transition-all">
                       <Globe className="h-4 w-4" /> Instagram
                     </Button>
                   </a>
                 )}
               {artist.whatsapp && (
                 <a href={`https://wa.me/55${artist.whatsapp.replace(/\D/g, '')}`} target="_blank" rel="noreferrer">
                   <Button variant="outline" className="w-full justify-start gap-3 rounded-xl border-green-100 hover:bg-green-50 hover:text-green-600 transition-all">
                     <MessageCircle className="h-4 w-4" /> WhatsApp
                   </Button>
                 </a>
               )}
               <Button variant="outline" className="w-full justify-start gap-3 rounded-xl border-blue-100 hover:bg-blue-50 hover:text-blue-600 transition-all">
                 <Share2 className="h-4 w-4" /> Compartilhar Perfil
               </Button>
             </div>
             
             <div className="pt-6 border-t border-border">
               <p className="text-xs text-muted-foreground text-center">
                 Membro desde {new Date(artist.created_at).toLocaleDateString('pt-BR')}
               </p>
             </div>
           </div>
         </div>
       </div>
     </div>
   );
 }
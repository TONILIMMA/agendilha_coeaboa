import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
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
  Heart,
  ArrowRight
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useMemo, useState } from "react";
import { formatBrazilianDate } from "@/lib/date-utils";
import { getEventFallbackImage } from "@/lib/event-utils";
import { SeoHead } from "@/components/seo/SeoHead";

type ShowFilter = "todos" | "semana" | "mes";

export default function ArtistProfile() {
  const { id } = useParams();
  const { user } = useAuth();

  const { data: artist, isLoading } = useQuery({
    queryKey: ["artist", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("public_artist_profiles")
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

  // WhatsApp contact is gated behind authentication to protect artists' personal data.
  const { data: contact } = useQuery({
    queryKey: ["artist-contact", id, user?.id],
    enabled: !!user && !!id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("public_artist_profiles")
        .select("whatsapp")
        .eq("id", id)
        .maybeSingle();
      if (error) return null;
      return data;
    },
  });

  // Shows futuros do artista (aprovados/publicados) — via view pública sem PII.
  const { data: shows = [] } = useQuery({
    queryKey: ["artist-shows", id],
    enabled: !!id,
    queryFn: async () => {
      const today = new Date().toISOString().slice(0, 10);
      const { data, error } = await supabase
        .from("public_submissions")
        .select(
          "id, slug, event_title, date, start_time, location, address_neighborhood, image_url, category"
        )
        .eq("artist_id", id!)
        .in("status", ["aprovado", "publicado"])
        .gte("date", today)
        .order("date", { ascending: true })
        .limit(50);
      if (error) throw error;
      return data || [];
    },
  });

  const [showFilter, setShowFilter] = useState<ShowFilter>("todos");

  const filteredShows = useMemo(() => {
    if (showFilter === "todos") return shows;
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const limit = new Date(now);
    limit.setDate(now.getDate() + (showFilter === "semana" ? 7 : 30));
    return shows.filter((s: any) => {
      if (!s.date) return false;
      const d = new Date(`${s.date}T00:00:00`);
      return d >= now && d <= limit;
    });
  }, [shows, showFilter]);

  if (isLoading) return <div className="min-h-screen flex items-center justify-center">Carregando...</div>;
  if (!artist) return <div className="min-h-screen flex items-center justify-center">Artista não encontrado.</div>;

  const sortedMedia = [...(artist.artist_media || [])].sort(
    (a: any, b: any) => (a.display_order ?? 0) - (b.display_order ?? 0)
  );
  const videos = sortedMedia.filter((m: any) => m.media_type === "video");
  const images = sortedMedia.filter((m: any) => m.media_type === "image");

  return (
    <div className="min-h-screen bg-background pb-20">
      <SeoHead
        title={`${artist.name} — Atrativo na Ilha | AgendIlha`}
        description={
          (artist.bio as string | null)?.trim() ||
          `Conheça ${artist.name}${artist.genre ? ` (${artist.genre})` : ""}, atrativo da Ilha do Governador, e veja os próximos shows na agenda do AgendIlha.`
        }
        path={`/artista/${artist.id}`}
        type="profile"
        image={(artist.avatar_url as string | null) || undefined}
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "MusicGroup",
          name: artist.name,
          genre: artist.genre || undefined,
          image: (artist.avatar_url as string | null) || undefined,
          description: (artist.bio as string | null) || undefined,
        }}
      />
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
            <Button variant="outline" size="icon" aria-label="Compartilhar perfil do artista" className="rounded-full">
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
              <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">
                {artist.work_description || artist.bio || "Este artista ainda não adicionou uma descrição detalhada."}
              </p>
              {artist.differentials && (
                <div className="mt-6 p-4 bg-primary/5 rounded-2xl border border-primary/10">
                  <h4 className="font-bold text-primary text-sm mb-2 flex items-center gap-2">
                    <span className="p-1 bg-white rounded-full shadow-sm">✨</span> Diferenciais
                  </h4>
                  <p className="text-sm text-muted-foreground">{artist.differentials}</p>
                </div>
              )}
            </section>

            {artist.styles && artist.styles.length > 0 && (
              <section>
                <h2 className="text-lg font-display font-bold mb-4">Estilos Musicais</h2>
                <div className="flex flex-wrap gap-2">
                  {artist.styles.map((style: string) => (
                    <Badge key={style} variant="outline" className="px-3 py-1 rounded-full bg-slate-50 border-slate-200 text-slate-600">
                      {style}
                    </Badge>
                  ))}
                </div>
              </section>
            )}

            {images.length > 0 && (
              <section>
                <h2 className="text-xl font-display font-bold mb-4 flex items-center gap-2">
                  <Video className="h-5 w-5 text-primary" /> Galeria de Mídia
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {images.map((img: any) => (
                    <div key={img.id} className="aspect-square rounded-xl overflow-hidden border border-border shadow-sm hover:scale-105 transition-transform">
                      <img loading="lazy" decoding="async" src={img.url} className="w-full h-full object-cover" alt="Artist media" />
                    </div>
                  ))}
                </div>
              </section>
            )}

            {videos.length > 0 && (
              <section>
                <h2 className="text-xl font-display font-bold mb-4 flex items-center gap-2">
                  <Video className="h-5 w-5 text-primary" /> Vídeos Curtos
                </h2>
                <div className="flex gap-4 overflow-x-auto pb-4 snap-x no-scrollbar">
                  {videos.map((video: any) => (
                    <div key={video.id} className="relative min-w-[160px] aspect-[9/16] rounded-xl overflow-hidden bg-muted snap-start shadow-md group">
                      <img loading="lazy" decoding="async" src={video.thumbnail_url || video.url} className="w-full h-full object-cover" alt="Video thumbnail" />
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
              <div className="flex flex-wrap gap-2 mb-4">
                {[
                  { id: "todos", label: "Todos" },
                  { id: "semana", label: "Próximos 7 dias" },
                  { id: "mes", label: "Próximos 30 dias" },
                ].map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setShowFilter(opt.id as ShowFilter)}
                    className={cn(
                      "text-xs font-semibold rounded-full px-3 py-1.5 border transition-all",
                      showFilter === opt.id
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-transparent text-foreground/70 border-foreground/15 hover:bg-foreground/5"
                    )}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
              {filteredShows.length === 0 ? (
                <div className="bg-card rounded-2xl p-8 border border-border shadow-sm text-center">
                  <p className="text-muted-foreground mb-4">
                    {shows.length === 0
                      ? "Nenhum show confirmado por aqui ainda."
                      : "Nenhum show nesse período. Ajusta o filtro."}
                  </p>
                  <Link to="/explorar">
                    <Button variant="outline" className="rounded-full">
                      Ver agenda completa
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {filteredShows.map((s: any) => {
                    const img = s.image_url || getEventFallbackImage(s.category);
                    return (
                      <Link
                        key={s.id}
                        to={`/evento/${s.slug}`}
                        className="group flex gap-3 items-center rounded-2xl border border-border bg-card p-3 hover:border-primary/40 hover:shadow-md transition"
                      >
                        <div className="h-16 w-16 rounded-xl overflow-hidden bg-muted shrink-0">
                          <img
                            src={img}
                            alt={s.event_title}
                            className="h-full w-full object-cover"
                            loading="lazy"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[10px] font-semibold uppercase tracking-widest text-primary">
                            {s.date ? formatBrazilianDate(s.date) : "Data a confirmar"}
                            {s.start_time ? ` · ${s.start_time}` : ""}
                          </p>
                          <h3 className="font-semibold text-sm truncate">
                            {s.event_title}
                          </h3>
                          <p className="text-xs text-muted-foreground truncate">
                            {[s.location, s.address_neighborhood]
                              .filter(Boolean)
                              .join(" · ") || "Local a confirmar"}
                          </p>
                        </div>
                        <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition" />
                      </Link>
                    );
                  })}
                </div>
              )}
            </section>
          </div>
 
         {/* Right Column: Sidebar */}
         <div className="space-y-8">
           <div className="bg-card rounded-2xl p-6 border border-border shadow-sm space-y-6 sticky top-24">
              <h3 className="font-display font-bold text-lg">Canais e Contato</h3>
              
              <div className="space-y-3">
                {artist.spotify_url && (
                    <a href={artist.spotify_url} target="_blank" rel="noreferrer">
                      <Button variant="outline" className="w-full justify-start gap-3 rounded-xl border-emerald-100 hover:bg-emerald-50 hover:text-emerald-600 transition-all mb-3">
                        <Music className="h-4 w-4" /> Spotify
                      </Button>
                    </a>
                  )}
                  {artist.youtube && (
                    <a href={artist.youtube.startsWith('http') ? artist.youtube : `https://youtube.com/${artist.youtube}`} target="_blank" rel="noreferrer">
                      <Button variant="outline" className="w-full justify-start gap-3 rounded-xl border-red-100 hover:bg-red-50 hover:text-red-600 transition-all mb-3">
                        <Video className="h-4 w-4" /> YouTube
                      </Button>
                    </a>
                  )}
                  {artist.website_url && (
                    <a href={artist.website_url.startsWith('http') ? artist.website_url : `https://${artist.website_url}`} target="_blank" rel="noreferrer">
                      <Button variant="outline" className="w-full justify-start gap-3 rounded-xl border-blue-100 hover:bg-blue-50 hover:text-blue-600 transition-all mb-3">
                        <Globe className="h-4 w-4" /> Site Oficial
                      </Button>
                    </a>
                  )}
                  {artist.instagram && (
                    <a href={`https://instagram.com/${artist.instagram.replace('@', '')}`} target="_blank" rel="noreferrer">
                      <Button variant="outline" className="w-full justify-start gap-3 rounded-xl border-pink-100 hover:bg-pink-50 hover:text-pink-600 transition-all mb-3">
                        <Globe className="h-4 w-4" /> Instagram
                      </Button>
                    </a>
                  )}
                {contact?.whatsapp && (
                  <a href={`https://wa.me/55${contact.whatsapp.replace(/\D/g, '')}`} target="_blank" rel="noreferrer">
                    <Button className="w-full justify-start gap-3 rounded-xl bg-green-600 hover:bg-green-700 text-white transition-all shadow-md">
                      <MessageCircle className="h-4 w-4" /> WhatsApp Profissional
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
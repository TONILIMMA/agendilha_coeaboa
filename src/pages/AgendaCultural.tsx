 import { useState, useMemo, useEffect, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/hooks/useTheme";
import { useProfile } from "@/hooks/useProfile";
import { useFavorites } from "@/hooks/useFavorites";
import { FavoriteButton } from "@/components/FavoriteButton";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
    import { Loader2, MapPin, Clock, Share2, CalendarDays, FileDown, Search, Copy, ExternalLink, ArrowUpDown, X, Globe, MessageCircle, Info, Download, Star, Heart, AlertCircle, Sparkles, Video, Users, Music as MusicIcon, Play, Settings2, Megaphone, Trophy, Utensils, Tag, Calendar } from "lucide-react";
import { formatBrazilianDate, formatLongDate } from "@/lib/date-utils";
import { Onboarding } from "@/components/Onboarding";
import { PersonalizationDialog } from "@/components/PersonalizationDialog";
import { ShareDialog } from "@/components/ShareDialog";
import ArtistCard from "@/components/ArtistCard";
import { getEventFallbackImage, normalizeText } from "@/lib/event-utils";
 import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
 import { exportEditorialAgendaPdf } from "@/lib/pdfExport";
 import { handleError } from "@/lib/error-handler";
 import { toast } from "sonner";
import { cn } from "@/lib/utils";
import logoCoeABoa from "@/assets/coeaboa-logo.jpg";
import EventReviews from "@/components/EventReviews";
import { getShareData, getShareUrl, buildFullAddress } from "@/lib/sharing";

function ReportButton({ eventId, eventTitle }: { eventId: string; eventTitle: string }) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);

  const handleReport = async () => {
    if (!reason) {
      toast.error("Por favor, selecione um motivo.");
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.rpc('report_event', {
        target_event_id: eventId,
        report_reason: reason,
        report_description: description
      });

      if (error) throw error;

      toast.success("Denúncia enviada com sucesso.", {
        description: "Nossa equipe de moderação irá analisar o evento em breve."
      });
      setOpen(false);
    } catch (err) {
      console.error("Error reporting event:", err);
      toast.error("Erro ao enviar denúncia. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Button 
        variant="ghost" 
        className="w-full h-10 text-xs font-bold text-red-500 hover:text-red-600 hover:bg-red-50 transition-colors"
        onClick={() => setOpen(true)}
      >
        🚩 Denunciar Evento Inadequado
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md rounded-[2rem]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertCircle className="h-5 w-5" />
              Denunciar Evento
            </DialogTitle>
            <DialogDescription>
              Ajude-nos a manter o AgendIlha seguro. Por que você está denunciando "{eventTitle}"?
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <p className="text-sm font-bold">Motivo</p>
              <Select onValueChange={setReason}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o motivo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Inadequado para menores">Conteúdo inadequado para menores</SelectItem>
                  <SelectItem value="Spam ou Falso">Spam ou Informação falsa</SelectItem>
                  <SelectItem value="Ofensivo ou Ódio">Conteúdo ofensivo ou discurso de ódio</SelectItem>
                  <SelectItem value="Drogas ou Violência">Drogas ou Violência explícita</SelectItem>
                  <SelectItem value="Outro">Outro motivo</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <p className="text-sm font-bold">Descrição Adicional (Opcional)</p>
              <Textarea 
                placeholder="Conte-nos mais detalhes..." 
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="min-h-[100px] rounded-xl"
              />
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="ghost" onClick={() => setOpen(false)} className="rounded-full">Cancelar</Button>
            <Button 
              onClick={handleReport} 
              disabled={loading} 
              className="rounded-full bg-red-600 hover:bg-red-700 text-white font-bold px-8"
            >
              {loading ? "Enviando..." : "Enviar Denúncia"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
 
  function EventImage({ src, alt, category, className, icon: Icon }: { src?: string | null; alt: string; category?: string | null; className?: string; icon?: any }) {
    const [isLoaded, setIsLoaded] = useState(false);
    const [error, setError] = useState(false);
    const fallback = useMemo(() => getEventFallbackImage(category), [category]);

    useEffect(() => {
      setIsLoaded(false);
      setError(false);
    }, [src]);

   return (
     <div className={cn("relative overflow-hidden bg-muted/20", className)}>
       {!isLoaded && (
         <div className="absolute inset-0 z-10 p-2">
           <Skeleton className="h-full w-full rounded-lg" />
         </div>
       )}
       {src && <link rel="prefetch" href={src} as="image" />}
         <img
           src={error ? fallback : (src || fallback)}
           alt={alt}
           key={src || 'fallback'}
          className={cn(
            "h-full w-full object-cover transition-all duration-700",
            !isLoaded ? "opacity-0 blur-sm scale-105" : "opacity-100 blur-0 scale-100"
          )}
          onLoad={() => setIsLoaded(true)}
          onError={(e) => {
            // Se a imagem local também falhar (não existir), usa um fallback de Unsplash como última opção
            const currentTarget = e.currentTarget;
            if (!error) {
              const unsplashFallbacks: Record<string, string> = {
                "musica": "https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?auto=format&fit=crop&q=80&w=800",
                "gastronomia": "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&q=80&w=800",
                "teatro": "https://images.unsplash.com/photo-1514525253361-bee8a187499b?auto=format&fit=crop&q=80&w=800",
                "esporte": "https://images.unsplash.com/photo-1517649763962-0c623066013b?auto=format&fit=crop&q=80&w=800",
                "outros": "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&q=80&w=800",
              };
                const normalized = normalizeText(category || "");
                let finalFallback = unsplashFallbacks["outros"];
                if (normalized.includes("musica") || normalized.includes("show")) finalFallback = unsplashFallbacks["musica"];
                else if (normalized.includes("gastronomia") || normalized.includes("comida")) finalFallback = unsplashFallbacks["gastronomia"];
                else if (normalized.includes("teatro") || normalized.includes("arte") || normalized.includes("cultura")) finalFallback = unsplashFallbacks["teatro"];
                else if (normalized.includes("esporte")) finalFallback = unsplashFallbacks["esporte"];
              
              currentTarget.src = finalFallback;
            }
            setError(true);
            setIsLoaded(true);
          }}
          loading="eager"
        />
       {(!src || error) && Icon && (
         <div className="absolute inset-0 bg-black/20 flex items-center justify-center backdrop-blur-[1px] z-20">
           <Icon className="h-6 w-6 text-white drop-shadow-md" />
         </div>
       )}
     </div>
   );
 }

interface Event {
  id: string;
  event_title: string;
  date: string | null;
  start_time: string | null;
  end_time: string | null;
  location: string | null;
  address_neighborhood: string | null;
  address_street: string | null;
  description: string | null;
  category: string | null;
  company_name: string | null;
   is_highlight: boolean;
   status?: string;
   image_url?: string | null;
  latitude?: number | null;
   longitude?: number | null;
   age_rating?: string;
   is_suitable_for_minors?: boolean;
   moderation_status?: string;
   views_count?: number;
}

const categoryLabels: Record<string, string> = {
  musica: "Música / Show",
  gastronomia: "Gastronomia",
  cultura: "Cultura / Arte",
  esporte: "Esporte",
  promocoes: "Promoções",
  outros: "Outros",
};

const categoryIcons: Record<string, string> = {
  musica: "🎸",
  gastronomia: "🍻",
  cultura: "🎭",
  esporte: "⚽",
  promocoes: "🏷️",
  outros: "📌",
};

function parseDateToObj(dateStr: string | null): Date | null {
  if (!dateStr) return null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    const [y, m, d] = dateStr.split("-").map(Number);
    return new Date(y, m - 1, d);
  }
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(dateStr)) {
    const [d, m, y] = dateStr.split("/").map(Number);
    return new Date(y, m - 1, d);
  }
  return null;
}

function formatDayLabel(dateStr: string | null): string {
  const d = parseDateToObj(dateStr);
  if (!d || isNaN(d.getTime())) return "Sem data definida";
  const wd = d.toLocaleDateString("pt-BR", { weekday: "long" });
  const dayMonth = d.toLocaleDateString("pt-BR", { day: "numeric", month: "long" });
  return `${wd.charAt(0).toUpperCase()}${wd.slice(1)} · ${dayMonth}`;
}


function buildWhatsAppShare(ev?: Event) {
  const { text, url } = getShareData(ev);
  const msg = `${text}\n${url}`;
  return `https://wa.me/?text=${encodeURIComponent(msg)}`;
}

function handleSocialShare(platform: 'whatsapp' | 'instagram' | 'facebook' | 'twitter' | 'copy', ev?: Event) {
  const { text, url } = getShareData(ev);
  const fullText = `${text}\n${url}`;
  
  switch (platform) {
    case 'whatsapp':
      window.open(`https://wa.me/?text=${encodeURIComponent(fullText)}`, '_blank');
      break;
    case 'facebook':
      window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, '_blank');
      break;
    case 'twitter':
      window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(fullText)}`, '_blank');
      break;
    case 'copy':
      navigator.clipboard.writeText(url);
      toast.success("Link copiado!");
      break;
    case 'instagram':
      navigator.clipboard.writeText(url);
      toast.success("Link copiado para os Stories!", { description: "Agora cole o link no sticker do Instagram." });
      break;
  }
}

function buildUberLink(ev: Event): string {
  const destinationName = encodeURIComponent(ev.location || "Evento");
  const address = buildFullAddress(ev);
  const destinationAddress = encodeURIComponent(address);
  
  let url = `https://m.uber.com/ul/?action=setPickup&pickup=my_location`;
  
  if (ev.latitude && ev.longitude) {
    url += `&dropoff[latitude]=${ev.latitude}&dropoff[longitude]=${ev.longitude}&dropoff[nickname]=${destinationName}&dropoff[formatted_address]=${destinationAddress}`;
  } else {
    url += `&dropoff[nickname]=${destinationName}&dropoff[formatted_address]=${destinationAddress}`;
  }
  
  return url;
}

 export default function AgendaCultural() {
   const navigate = useNavigate();
    const [shareData, setShareData] = useState<{ title: string; text: string; url: string; eventId?: string } | null>(null);

    const handleShare = async (title: string, text: string, url: string, eventId?: string) => {
      setShareData({ title, text, url, eventId });
    };

    const handleCopyLink = (url: string) => {
      navigator.clipboard.writeText(url);
      toast.success("Link copiado!");
    };

    const { user } = useAuth();
    const { toggleTheme } = useTheme();
    const [events, setEvents] = useState<Event[]>([]);
    const { profile, loaded: profileLoaded } = useProfile();
    const { favorites, isFavorite, toggleFavorite } = useFavorites();
    const [personalizationOpen, setPersonalizationOpen] = useState(false);
  const [ratings, setRatings] = useState<Record<string, { average: number; total: number }>>({});

  const loadRatings = async () => {
    const { data: ratingsData } = await supabase
      .from("event_ratings_summary")
      .select("*");
    
    if (ratingsData) {
      const ratingsMap: Record<string, { average: number; total: number }> = {};
      ratingsData.forEach((r: any) => {
        ratingsMap[r.event_id] = { average: r.average_rating, total: r.total_reviews };
      });
      setRatings(ratingsMap);
    }
  };
   const [loading, setLoading] = useState(true);
   const [search, setSearch] = useState("");
   const [activeTab, setActiveTab] = useState<"events" | "artists">("events");
   const [categoryFilter, setCategoryFilter] = useState("all");
   const [neighborhoodFilter, setNeighborhoodFilter] = useState("all");
   const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
   const { data: artists, isLoading: artistsLoading } = useQuery({
     queryKey: ["artists-approved"],
     queryFn: async () => {
       const { data, error } = await supabase
          .from("public_artist_profiles")
         .select(`
           *,
           artist_media (*)
         `)
         .eq("is_approved", true)
         .order("created_at", { ascending: false });
       if (error) throw error;
       return data;
     },
   });
 
   const trendingArtists = useMemo(() => {
     return artists?.slice(0, 5) || [];
   }, [artists]);
 
   const shortVideos = useMemo(() => {
     const allVideos: any[] = [];
     artists?.forEach(artist => {
       artist.artist_media?.forEach((m: any) => {
         if (m.media_type === 'video') {
           allVideos.push({ ...m, artist });
         }
       });
     });
     return allVideos.sort(() => Math.random() - 0.5);
   }, [artists]);
 

   useEffect(() => {
     const params = new URLSearchParams(window.location.search);
     if (params.get('view') === 'favorites') {
       setShowFavoritesOnly(true);
     }
     const category = params.get('category');
     if (category) {
       setCategoryFilter(category);
     }
     
      // Sincronização automática via useFavorites hook
   }, []);
   const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
   const [sortOrder, setSortOrder] = useState<"asc" | "desc">(() => {
     const saved = localStorage.getItem("agendilha_sort_order");
     return (saved === "desc" ? "desc" : "asc");
   });


   useEffect(() => {
     localStorage.setItem("agendilha_sort_order", sortOrder);
   }, [sortOrder]);

    useEffect(() => {
      async function load() {
        setLoading(true);
        try {
          const { data, error } = await supabase
            .from("public_submissions")
            .select("*")
            .eq('status', 'aprovado')
            .neq('moderation_status', 'blocked');
          
          if (error) throw error;
          
          const approvedEvents = (data as any[]) || [];
          setEvents(approvedEvents);
    loadRatings();


          // Verificar se há um evento específico na URL para abrir o modal
          const params = new URLSearchParams(window.location.search);
          const eventId = params.get('event');
          if (eventId) {
            const ev = approvedEvents.find(e => e.id === eventId);
            if (ev) {
              setSelectedEvent(ev);
              trackView(ev.id);
            }
          }
       } catch (error) {
         handleError(error, "Erro ao carregar a agenda. Tente novamente mais tarde.");
       } finally {
          setLoading(false);
        }
      }
       load();

       const channel = supabase
         .channel('submissions-all-updates')
         .on('postgres_changes', { 
           event: '*', 
           schema: 'public', 
           table: 'submissions' 
         }, () => {
           load();
         })
         .subscribe();

       return () => {
         supabase.removeChannel(channel);
       };
     }, []);

  useEffect(() => {
    const channel = supabase
      .channel('ratings-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'event_reviews' }, () => {
        loadRatings();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

   const trackView = useCallback(async (id: string) => {
     try {
       await supabase.rpc('increment_views', { event_id: id });
     } catch (e) {
       // Silent fail for analytics
     }
   }, []);

  async function trackShare(id: string) {
    try {
      await supabase.rpc('increment_shares', { event_id: id });
    } catch (e) {
      console.error("Error tracking share:", e);
    }
  }

  const neighborhoods = useMemo(() => {
    const set = new Set<string>();
    events.forEach(e => { if (e.address_neighborhood) set.add(e.address_neighborhood); });
    return Array.from(set).sort();
  }, [events]);

   const upcomingEvents = useMemo(() => {
     const today = new Date();
     today.setHours(0, 0, 0, 0);
     // For debugging/transparency, we show events from today onwards
     return events.filter(e => {
       const d = parseDateToObj(e.date);
       // If no date or date is today/future, show it
       return !d || d >= today;
     });
   }, [events]);

    const filteredEvents = useMemo(() => {
      return upcomingEvents.filter(ev => {
        const matchSearch = ev.event_title.toLowerCase().includes(search.toLowerCase()) || 
                            (ev.description || "").toLowerCase().includes(search.toLowerCase());
        const matchCat = categoryFilter === "all" || ev.category === categoryFilter;
        const matchNeigh = neighborhoodFilter === "all" || ev.address_neighborhood === neighborhoodFilter;
        const matchFav = !showFavoritesOnly || isFavorite(ev.id);
        return matchSearch && matchCat && matchNeigh && matchFav;
      });
    }, [upcomingEvents, search, categoryFilter, neighborhoodFilter, showFavoritesOnly, favorites, isFavorite]);

    // AI Recommendation Logic
    const nearYouEvents = useMemo(() => {
      const userNeighborhood = profile?.home_location || profile?.address_neighborhood;
      if (!userNeighborhood) return [];
      return upcomingEvents
        .filter(ev => ev.address_neighborhood === userNeighborhood)
        .slice(0, 4);
    }, [upcomingEvents, profile]);

    const recommendedEvents = useMemo(() => {
      const prefs = profile?.musical_preferences || [];
      if (prefs.length === 0) return [];
      return upcomingEvents
        .filter(ev => prefs.some(p => ev.category?.toLowerCase().includes(p.toLowerCase()) || ev.description?.toLowerCase().includes(p.toLowerCase())))
        .slice(0, 4);
    }, [upcomingEvents, profile]);

    const trendingEvents = useMemo(() => {
      return [...upcomingEvents]
        .sort((a, b) => (b.views_count || 0) - (a.views_count || 0))
        .slice(0, 4);
    }, [upcomingEvents]);

  const grouped = useMemo(() => {
    const map: Record<string, { label: string; sortKey: string; items: Event[] }> = {};
    for (const ev of filteredEvents) {
      const d = parseDateToObj(ev.date);
      const key = d
        ? `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
        : "sem-data";
      if (!map[key]) {
        map[key] = {
          label: formatLongDate(ev.date),
          sortKey: key === "sem-data" ? "9999-99-99" : key,
          items: [],
        };
      }
      map[key].items.push(ev);
    }
    return map;
  }, [filteredEvents]);

   const sortedDays = useMemo(() =>
     Object.entries(grouped)
       .sort(([, a], [, b]) => {
         return sortOrder === "asc" 
           ? a.sortKey.localeCompare(b.sortKey) 
           : b.sortKey.localeCompare(a.sortKey);
       })
       .map(([key]) => key)
   , [grouped, sortOrder]);

  return (
    <div className="min-h-screen bg-background">

      <main className="mx-auto max-w-4xl px-4 py-8 sm:py-12 md:py-16">
         {/* Topo da Página - Hero Mobile-First */}
         <div className="mb-12 sm:mb-20 text-center space-y-8 relative animate-in fade-in slide-in-from-top-4 duration-700">
            <div className="flex flex-col items-center gap-4 sm:gap-6">
              <div className="inline-flex items-center justify-center px-4 py-1.5 sm:px-5 sm:py-2 rounded-full bg-secondary/10 border border-secondary/20 mb-2 shadow-sm">
                <span className="text-[10px] sm:text-[11px] font-black uppercase tracking-[0.2em] sm:tracking-[0.3em] text-primary">AgendIlha</span>
              </div>
              <h1 className="text-5xl xs:text-6xl sm:text-8xl font-black font-display text-primary tracking-tightest leading-[0.9] drop-shadow-sm">
                Coé a Boa?
              </h1>
               <p className="text-foreground/80 text-lg sm:text-2xl font-medium max-w-2xl mx-auto leading-relaxed px-2 sm:px-4 text-balance contrast-125">
                 A agenda cultural da Ilha do Governador.
               </p>
             </div>

              {/* AI Recommendations Section */}
              {user && (nearYouEvents.length > 0 || recommendedEvents.length > 0 || trendingEvents.length > 0) && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-12 animate-in fade-in slide-in-from-bottom-4 duration-1000">
                  {nearYouEvents.length > 0 && (
                    <div className="space-y-4">
                      <h3 className="flex items-center gap-2 text-base font-semibold uppercase tracking-[0.18em] text-foreground/70 px-2">
                        <MapPin className="h-4 w-4 text-secondary" />
                        Hoje perto de você
                      </h3>
                      <div className="grid grid-cols-1 gap-3">
                         {nearYouEvents.map(ev => (
                             <Card
                               key={ev.id}
                               className="overflow-hidden border border-border bg-card hover:bg-muted/50 hover:border-accent transition-all duration-300 cursor-pointer group event-card rounded-2xl shadow-none"
                               data-event-id={ev.id}
                               onClick={() => setSelectedEvent(ev)}
                             >
                               <CardContent className="p-3 flex items-center gap-4">
                                 <EventImage 
                                   src={ev.image_url} 
                                   alt={ev.event_title} 
                                   category={ev.category} 
                                   className="h-16 w-16 rounded-xl shrink-0 event-image ring-1 ring-border"
                                   icon={CalendarDays}
                                 />
                                <div className="min-w-0 flex-1">
                                  <p className="font-bold text-sm truncate">{ev.event_title}</p>
                                  <p className="text-xs text-muted-foreground">{ev.address_neighborhood} • {formatBrazilianDate(ev.date)} • {ev.start_time}</p>
                                </div>
                                 <div className="flex flex-col gap-1 shrink-0 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity z-30">
                                   <FavoriteButton eventId={ev.id} className="h-8 w-8" />
                                  <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    className="h-8 w-8 rounded-full border border-border bg-background/80 backdrop-blur-md text-foreground hover:bg-background"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      const data = getShareData(ev);
                                      handleShare(data.title, data.text, data.url, ev.id);
                                    }}
                                  >
                                    <Share2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </CardContent>
                            </Card>
                           ))
                         }
                      </div>
                    </div>
                  )}


                  {trendingEvents.length > 0 && (
                    <div className="space-y-4">
                      <h3 className="flex items-center gap-2 text-base font-semibold uppercase tracking-[0.18em] text-foreground/70 px-2">
                        <Trophy className="h-4 w-4 text-secondary" />
                        Bombando agora
                      </h3>
                      <div className="grid grid-cols-1 gap-3">
                         {trendingEvents.map(ev => (
                             <Card
                               key={ev.id}
                               className="overflow-hidden border border-border bg-card hover:bg-muted/50 hover:border-accent transition-all duration-300 cursor-pointer group event-card rounded-2xl shadow-none"
                               data-event-id={ev.id}
                               onClick={() => setSelectedEvent(ev)}
                             >
                               <CardContent className="p-3 flex items-center gap-4">
                                 <EventImage 
                                   src={ev.image_url} 
                                   alt={ev.event_title} 
                                   category={ev.category} 
                                   className="h-16 w-16 rounded-xl shrink-0 event-image ring-1 ring-border"
                                   icon={Play}
                                 />
                                <div className="min-w-0 flex-1">
                                  <p className="font-bold text-sm truncate">{ev.event_title}</p>
                                  <p className="text-xs text-muted-foreground">{ev.views_count || 0} visualizações</p>
                                </div>
                                 <div className="flex flex-col gap-1 shrink-0 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity z-30">
                                   <FavoriteButton eventId={ev.id} className="h-8 w-8" />
                                  <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    className="h-8 w-8 rounded-full border border-border bg-background/80 backdrop-blur-md text-foreground hover:bg-background"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      const data = getShareData(ev);
                                      handleShare(data.title, data.text, data.url, ev.id);
                                    }}
                                  >
                                    <Share2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </CardContent>
                            </Card>
                           ))
                         }
                      </div>
                    </div>
                  )}

                 {recommendedEvents.length > 0 && (
                   <div className="space-y-4">
                     <h3 className="flex items-center gap-2 text-base font-semibold uppercase tracking-[0.18em] text-foreground/70 px-2">
                       <Sparkles className="h-4 w-4 text-secondary" />
                       Você pode gostar
                     </h3>
                     <div className="grid grid-cols-1 gap-3">
                         {recommendedEvents.map(ev => (
                             <Card 
                               key={ev.id} 
                               className="overflow-hidden border border-border bg-card hover:bg-muted/50 hover:border-accent transition-all duration-300 cursor-pointer group event-card rounded-2xl shadow-none" 
                               data-event-id={ev.id}
                               onClick={() => setSelectedEvent(ev)}
                             >
                               <CardContent className="p-3 flex items-center gap-4">
                                 <EventImage 
                                   src={ev.image_url} 
                                   alt={ev.event_title} 
                                   category={ev.category} 
                                   className="h-16 w-16 rounded-xl shrink-0 event-image ring-1 ring-border"
                                   icon={MusicIcon}
                                 />
                                 <div className="min-w-0 flex-1">
                                   <p className="font-bold text-sm truncate">{ev.event_title}</p>
                                   <p className="text-xs text-muted-foreground">{ev.category} • {formatBrazilianDate(ev.date)}</p>
                                 </div>
                                 <div className="flex flex-col gap-1 shrink-0 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity z-30">
                                   <FavoriteButton eventId={ev.id} className="h-8 w-8" />
                                  <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    className="h-8 w-8 rounded-full border border-border bg-background/80 backdrop-blur-md text-foreground hover:bg-background"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      const data = getShareData(ev);
                                      handleShare(data.title, data.text, data.url, ev.id);
                                    }}
                                  >
                                    <Share2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </CardContent>
                            </Card>
                           ))
                         }
                     </div>
                   </div>
                 )}
               </div>
             )}

             <div className="flex flex-col items-center gap-4 sm:gap-8 mt-6 sm:mt-12 px-1 sm:px-2" role="group" aria-label="Ações da agenda">
               <div className="flex flex-col sm:flex-row justify-center gap-3 sm:gap-4 w-full max-w-2xl">
                 <Button
                   className="rounded-full shadow-lg sm:shadow-xl bg-primary text-primary-foreground font-black px-6 sm:px-12 h-14 sm:h-16 text-sm sm:text-base transition-all uppercase tracking-widest outline-none hover:scale-[1.02] active:scale-95 w-full sm:flex-1"
                   onClick={() => {
                     if (user) {
                       navigate("/enviar-evento");
                     } else {
                       navigate("/auth?redirect=/enviar-evento");
                     }
                   }}
                 >
                   <Megaphone className="h-5 w-5 mr-2.5" /> Divulgar Evento
                 </Button>

                 <Button
                   className="rounded-full shadow-lg sm:shadow-xl gradient-sunset text-primary-foreground font-black px-6 sm:px-12 h-14 sm:h-16 text-sm sm:text-base transition-all uppercase tracking-widest focus-visible:ring-4 focus-visible:ring-primary/40 outline-none hover:scale-[1.02] active:scale-95 w-full sm:flex-1"
                   onClick={() => window.open(buildWhatsAppShare(), "_blank")}
                   aria-label="Compartilhar agenda no WhatsApp"
                 >
                   <MessageCircle className="h-5 w-5 mr-2.5" /> WhatsApp
                 </Button>
               </div>

              <div className="flex flex-wrap justify-center gap-4 sm:gap-6 w-full mt-2">
                <Button
                  variant="ghost"
                  className="rounded-full h-12 px-6 font-bold text-sm text-secondary hover:text-secondary/80 hover:bg-secondary/5 flex items-center gap-2 transition-all"
                  onClick={() => setPersonalizationOpen(true)}
                >
                  <Settings2 className="h-4 w-4" />
                  Personalizar Minha Agenda
                </Button>

                <Button 
                  variant="ghost" 
                  className="rounded-full h-10 sm:h-11 px-4 sm:px-6 text-[11px] sm:text-sm font-bold uppercase tracking-widest text-muted-foreground hover:text-primary hover:bg-primary/5 transition-all active:scale-95" 
                  onClick={() => handleCopyLink(getShareUrl())}
                  aria-label="Copiar link da agenda"
                >
                  <Copy className="h-4 w-4 mr-2" /> Copiar link
                </Button>

                <Button 
                  variant="ghost" 
                  className="rounded-full h-10 sm:h-11 px-4 sm:px-6 text-[11px] sm:text-sm font-bold uppercase tracking-widest text-muted-foreground hover:text-primary hover:bg-primary/5 transition-all active:scale-95" 
                  onClick={() => {
                    exportEditorialAgendaPdf(upcomingEvents as any, "Agenda Cultural da Ilha");
                    toast.success("PDF da agenda gerado!");
                  }}
                  aria-label="Baixar agenda completa em PDF"
                >
                  <FileDown className="h-4 w-4 mr-2" /> Baixar PDF
                </Button>
             </div>
           </div>
          </div>

          {/* Progressive Login / AI Recommendation */}
          <div className="mb-12 animate-in fade-in slide-in-from-top-2 duration-700">
            {!user ? (
              <div className="bg-gradient-to-br from-secondary/5 to-primary/5 border border-primary/10 rounded-[2.5rem] p-6 sm:p-8 flex flex-col md:flex-row items-center gap-6 shadow-sm relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                  <Sparkles className="h-24 w-24 text-primary" />
                </div>
                <div className="h-16 w-16 rounded-2xl bg-white shadow-md flex items-center justify-center shrink-0 border border-primary/10 z-10">
                  <Info className="h-8 w-8 text-primary" />
                </div>
                <div className="flex-1 text-center md:text-left z-10">
                  <h3 className="text-xl font-black font-display text-primary leading-tight mb-1.5 tracking-tight">Personalize sua experiência ✨</h3>
                  <p className="text-muted-foreground text-sm font-medium leading-relaxed max-w-lg">
                    Cadastre-se para receber recomendações da IA baseadas no seu bairro e interesses musicais. É rápido e gratuito!
                  </p>
                </div>
                <Button 
                  onClick={() => navigate("/auth")}
                  className="rounded-full gradient-sunset text-white font-black px-8 h-12 shadow-lg hover:scale-105 active:scale-95 transition-all z-10"
                >
                  Começar agora
                </Button>
              </div>
            ) : profile && (
              <div className="bg-primary/5 border border-primary/10 rounded-[2.5rem] p-6 sm:p-8 flex flex-col md:flex-row items-center gap-6 shadow-sm">
                <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0 border border-primary/20">
                  <Sparkles className="h-8 w-8 text-primary animate-pulse" />
                </div>
                <div className="flex-1 text-center md:text-left">
                  <h3 className="text-xl font-black font-display text-primary leading-tight mb-1">Destaques no seu bairro 🌴</h3>
                  <p className="text-muted-foreground text-sm font-medium">
                    {profile.home_location || profile.work_neighborhood 
                      ? `Filtrando automaticamente eventos próximos a ${profile.home_location || profile.work_neighborhood}.`
                      : "Configure seu bairro no perfil para receber recomendações personalizadas!"}
                  </p>
                </div>
                {(profile.home_location || profile.work_neighborhood) && (
                  <Button 
                    variant="outline" 
                    onClick={() => setNeighborhoodFilter(profile.home_location || profile.work_neighborhood)}
                    className="rounded-full border-2 border-primary/20 text-primary font-bold px-6 hover:bg-primary/5"
                  >
                    Ver todos no bairro
                  </Button>
                )}
              </div>
            )}
           </div>
 
           {/* Tabs de Navegação */}
           <div className="flex p-1 bg-muted/50 rounded-2xl mb-12 max-w-sm mx-auto border border-border/50">
             <button
               onClick={() => setActiveTab("events")}
               className={cn(
                 "flex-1 py-3 px-4 rounded-xl text-sm font-black transition-all flex items-center justify-center gap-2",
                 activeTab === "events" 
                   ? "bg-background shadow-md text-primary" 
                   : "text-muted-foreground hover:text-foreground"
               )}
             >
               <CalendarDays className="h-4 w-4" /> EVENTOS
             </button>
             <button
               onClick={() => setActiveTab("artists")}
               className={cn(
                 "flex-1 py-3 px-4 rounded-xl text-sm font-black transition-all flex items-center justify-center gap-2",
                 activeTab === "artists" 
                   ? "bg-background shadow-md text-primary" 
                   : "text-muted-foreground hover:text-foreground"
               )}
             >
               <Users className="h-4 w-4" /> ARTISTAS
             </button>
           </div>
 
            {activeTab === "artists" && (
              <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
                {shortVideos.length > 0 && (
                  <section className="space-y-6">
                    <h2 className="text-2xl font-display font-black text-primary flex items-center gap-2 px-2">
                      <Video className="h-6 w-6" /> DESCUBRA NOVOS SONS
                    </h2>
                    <div className="flex gap-4 overflow-x-auto pb-4 snap-x no-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0">
                      {shortVideos.map((video) => (
                        <div key={video.id} className="relative min-w-[200px] sm:min-w-[240px] aspect-[9/16] rounded-3xl overflow-hidden bg-muted snap-start shadow-xl group cursor-pointer" onClick={() => navigate(`/artista/${video.artist.id}`)}>
                          <img src={video.thumbnail_url} className="w-full h-full object-cover" alt="" />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                          <div className="absolute bottom-4 left-4 right-4 text-white">
                            <p className="font-bold text-sm">{video.artist.name}</p>
                            <Badge variant="secondary" className="bg-white/20 text-[10px] text-white border-none">{video.artist.genre}</Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>
                )}
                <section className="space-y-8">
                  <h2 className="text-2xl font-display font-black text-primary flex items-center gap-2 px-2">
                    <MusicIcon className="h-6 w-6" /> ARTISTAS NA ILHA
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-6">
                    {artists?.filter(a => neighborhoodFilter === 'all' || a.neighborhood === neighborhoodFilter).map(artist => (
                      <ArtistCard key={artist.id} artist={artist} />
                    ))}
                  </div>
                </section>
              </div>
            )}
            {activeTab === "events" && (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
                {/* Bloco de Busca e Filtros - Mobile-First */}
                <div className="mb-12 space-y-4 sm:space-y-6">
           <div className="bg-card border border-border/60 rounded-[1.5rem] sm:rounded-[2rem] p-3 sm:p-8 shadow-card ring-1 ring-black/[0.02]">
             <div className="flex flex-col gap-3 sm:gap-6">
              {/* Barra de Busca e Ordenação */}
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                <div className="relative flex-1 group">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                   <Input
                     placeholder="Buscar shows..."
                     className="pl-12 h-12 sm:h-14 text-base sm:text-lg border-none bg-muted/40 focus-visible:ring-2 focus-visible:ring-primary/20 rounded-xl sm:rounded-3xl"
                     value={search}
                     onChange={(e) => setSearch(e.target.value)}
                   />
                </div>
                <div className="relative shrink-0">
                   <Button
                     variant="outline"
                     onClick={() => {
                       const newOrder = sortOrder === "asc" ? "desc" : "asc";
                       setSortOrder(newOrder);
                     }}
                     className="w-full sm:w-auto h-12 sm:h-14 px-4 sm:px-6 rounded-xl sm:rounded-3xl border-2 border-primary/10 text-primary font-bold transition-all active:scale-95 bg-white hover:bg-primary/5 hover:border-primary/30 flex items-center justify-center gap-2"
                   >
                     <ArrowUpDown className={cn("h-4 w-4 transition-transform duration-300", sortOrder === "desc" && "rotate-180")} />
                     <span className="text-[10px] sm:text-xs uppercase tracking-widest">
                       {sortOrder === "asc" ? "Próximos" : "Distantes"}
                     </span>
                   </Button>
                  <div className={cn(
                    "absolute -top-1.5 -right-1 h-3.5 w-3.5 rounded-full border-2 border-background shadow-sm",
                    sortOrder === "asc" ? "bg-primary" : "bg-secondary"
                  )} />
                </div>
              </div>

              {/* Filtros e Favoritos */}
              <div className="flex flex-col sm:flex-row gap-4 items-center">
                <Button
                  variant={showFavoritesOnly ? "default" : "outline"}
                  onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
                  className={cn(
                    "w-full sm:w-auto rounded-full h-12 px-6 gap-2 font-bold transition-all active:scale-95",
                    showFavoritesOnly ? "bg-primary text-white" : "border-2 border-primary/10 text-primary hover:bg-primary/5"
                  )}
                >
                  <Heart className={cn("h-4 w-4", showFavoritesOnly && "fill-current")} />
                  {showFavoritesOnly ? "Mostrando Favoritos" : "Meus Favoritos"}
                </Button>
                
                <div className="grid grid-cols-1 xs:grid-cols-2 gap-3 sm:gap-4 flex-1 w-full">
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger className="h-12 sm:h-13 border-2 border-primary/10 bg-white hover:bg-primary/5 transition-colors focus:ring-2 focus:ring-primary/20 rounded-xl sm:rounded-2xl font-semibold text-sm">
                    <SelectValue placeholder="Categorias" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-border/50">
                    <SelectItem value="all" className="font-semibold">Todas as categorias</SelectItem>
                    {Object.entries(categoryLabels).map(([k, v]) => (
                      <SelectItem key={k} value={k}>{v}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={neighborhoodFilter} onValueChange={setNeighborhoodFilter}>
                  <SelectTrigger className="h-12 sm:h-13 border-2 border-primary/10 bg-white hover:bg-primary/5 transition-colors focus:ring-2 focus:ring-primary/20 rounded-xl sm:rounded-2xl font-semibold text-sm">
                    <SelectValue placeholder="Bairros" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-border/50">
                    <SelectItem value="all" className="font-semibold">Todos os bairros</SelectItem>
                    {neighborhoods.map((n) => (
                      <SelectItem key={n} value={n}>{n}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                </div>
              </div>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="space-y-12">
            {[1, 2].map((i) => (
              <div key={i} className="space-y-6">
                   <div className="flex items-center gap-3 py-3 border-b border-border/50">
                   <Skeleton className="h-10 w-10 rounded-2xl" />
                   <Skeleton className="h-7 w-48" />
                 </div>
                <div className="grid grid-cols-1 gap-6">
                  {[1, 2].map((j) => (
                    <Card key={j} className="overflow-hidden">
                      <CardContent className="p-0">
                        <div className="flex flex-col md:flex-row">
                          <Skeleton className="w-full md:w-1 shrink-0 h-1 md:h-auto" />
                          <div className="flex-1 p-5 sm:p-7 md:p-8 space-y-5">
                            <div className="space-y-2">
                              <Skeleton className="h-6 w-32" />
                              <Skeleton className="h-10 w-3/4" />
                            </div>
                            <Skeleton className="h-12 w-full rounded-xl" />
                            <div className="flex gap-3">
                              <Skeleton className="h-10 w-32 rounded-full" />
                              <Skeleton className="h-10 w-32 rounded-full" />
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            ))}
          </div>
          ) : sortedDays.length === 0 ? (
            <div className="text-center py-16 px-6 bg-muted/10 rounded-[2rem] border-2 border-dashed border-border/60 animate-in fade-in zoom-in duration-500">
              <div className="bg-background w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm ring-8 ring-muted/5">
                <CalendarDays className="h-10 w-10 text-muted-foreground/40" />
              </div>
              <h3 className="text-2xl font-black text-foreground mb-3 tracking-tight">A Ilha está descansando...</h3>
              <p className="text-muted-foreground text-lg font-medium max-w-md mx-auto leading-relaxed mb-8">
                {search || categoryFilter !== "all" || neighborhoodFilter !== "all" 
                  ? "Não encontramos nada com esses filtros. Que tal tentar uma busca mais ampla?" 
                  : "No momento não temos eventos publicados para os próximos dias. Volte em breve!"}
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                {(search || categoryFilter !== "all" || neighborhoodFilter !== "all") && (
                  <Button variant="outline" onClick={() => { setSearch(""); setCategoryFilter("all"); setNeighborhoodFilter("all"); }} className="rounded-full font-bold border-2 h-11 px-8">
                    Limpar Filtros
                  </Button>
                )}
                <Button 
                  variant="default" 
                  onClick={() => {
                    if (user) {
                      navigate("/enviar-evento");
                    } else {
                      toast.info("Acesse sua conta primeiro", {
                        description: "É necessário estar logado para divulgar eventos."
                      });
                      navigate("/auth?redirect=/enviar-evento");
                    }
                  }} 
                  className="rounded-full font-black h-12 px-8 gradient-sunset shadow-lg hover:scale-105 transition-transform"
                >
                  Divulgar meu Evento
                </Button>
              </div>
            </div>
          ) : (
          <div className="space-y-12">
            {/* Bloco de Destaques */}
            {filteredEvents.some(e => e.is_highlight) && (
              <section>
                   <div className="flex items-center gap-3 mb-6">
                   <div className="h-3 w-3 rounded-full bg-orange-500 animate-pulse" />
                   <h2 className="text-2xl font-bold font-display">Destaques AgendIlha</h2>
                 </div>
                <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-none snap-x snap-mandatory">
                    {filteredEvents.filter(e => e.is_highlight).map(ev => (
                        <Card 
                          key={ev.id} 
                          className="min-w-[300px] sm:min-w-[350px] snap-start border-orange-500/30 bg-gradient-to-br from-orange-500/10 to-transparent hover:shadow-lg transition-all cursor-pointer overflow-hidden group event-card"
                          data-event-id={ev.id}
                          data-nome={ev.event_title}
                          onClick={() => { trackView(ev.id); setSelectedEvent(ev); }}
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
                                  const data = getShareData(ev);
                                  handleShare(data.title, data.text, data.url, ev.id);
                                }}
                              >
                                <Share2 className="h-5 w-5" />
                              </Button>
                            </div>
                          </div>
                        <CardContent className="p-6 space-y-4">
                          <div className="flex items-center justify-between">
                            <Badge className="bg-orange-500 hover:bg-orange-600 text-white border-0">DESTAQUE 🔥</Badge>
                            <span className="text-xs font-medium text-orange-600/70">{categoryLabels[ev.category!] || ev.category}</span>
                          </div>
                          <h3 className="font-display font-bold text-2xl leading-tight line-clamp-2 group-hover:text-primary transition-colors">{ev.event_title}</h3>
                          <div className="space-y-2 text-sm text-muted-foreground font-medium">
                            <div className="flex items-center gap-2">
                              <CalendarDays className="h-4 w-4 text-orange-500" />
                              <span>{ev.date} {ev.start_time ? `• ${ev.start_time}` : ""}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <MapPin className="h-4 w-4 text-orange-500" />
                              <span className="line-clamp-1">{ev.location}</span>
                            </div>
                          </div>
                          </CardContent>
                        </Card>
                        ))
                    }
                </div>
              </section>
            )}

            {/* Lista de Eventos Organizada */}
            {sortedDays.map((dayKey) => (
              <section key={dayKey} className="space-y-8">
                   <div className="flex items-center gap-4 sticky top-16 bg-background/80 backdrop-blur-md py-4 z-10 border-b border-border/50">
                   <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0 shadow-sm">
                   <CalendarDays className="h-6 w-6 text-primary" />
                  </div>
                   <h2 className="text-2xl font-black text-foreground tracking-tight">
                    {grouped[dayKey].label}
                  </h2>
                </div>

                <div className="grid grid-cols-1 gap-8">
                    {grouped[dayKey].items.map((ev) => {
                      const icon = categoryIcons[ev.category || ""] || "📌";
                     const IconComp = (ev.category === 'musica' ? MusicIcon : 
                                     ev.category === 'gastronomia' ? Utensils : 
                                     ev.category === 'esporte' ? Trophy : 
                                     ev.category === 'promocoes' ? Tag : 
                                     CalendarDays) as any;

                     return (
                        <Card
                          key={ev.id}
                          className="overflow-hidden border-border/60 bg-card/50 hover:shadow-elevated transition-all group cursor-pointer rounded-[2.5rem] event-card"
                          data-event-id={ev.id}
                          onClick={() => {
                            trackView(ev.id);
                            setSelectedEvent(ev);
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
                                      const data = getShareData(ev);
                                      handleShare(data.title, data.text, data.url, ev.id);
                                    }}
                                  >
                                    <Share2 className="h-5 w-5" />
                                  </Button>
                                </div>

                               <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent lg:hidden" />
                               
                               {/* Badge flutuante na imagem para mobile */}
                               <div className="absolute bottom-4 left-4 lg:hidden">
                                 <Badge className="bg-white/95 text-primary border-none font-black text-[10px] tracking-widest px-3 py-1 shadow-lg backdrop-blur-sm">
                                   {categoryLabels[ev.category!]?.split(' ')[0] || ev.category}
                                 </Badge>
                               </div>
                             </div>

                           <div className="flex-1 p-5 sm:p-8 lg:p-10 flex flex-col justify-between space-y-5 sm:space-y-6">
                              <div className="space-y-4 sm:space-y-6">
                                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                                  <div className="space-y-2 flex-1 min-w-0">
                                    <div className="hidden lg:flex items-center gap-2 mb-2">
                                      <span className="text-2xl">{icon}</span>
                                      <Badge variant="secondary" className="bg-[#F6EEEA] text-[#2F5D46] text-[10px] font-semibold uppercase tracking-[0.15em] border-[#E6D6CF] border px-2.5 py-1 rounded-full shadow-sm">
                                        {categoryLabels[ev.category!] || ev.category}
                                      </Badge>
                                    </div>
                                    <h3 className="text-xl sm:text-3xl lg:text-4xl font-black text-foreground leading-[1.2] tracking-tight group-hover:text-primary transition-colors">
                                      {ev.event_title}
                                    </h3>
                                  </div>

                                  {/* Horário e Bairro */}
                                  <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-start gap-2 shrink-0">
                                    <div className="flex items-center gap-2 text-primary font-black bg-primary/5 px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl border border-primary/10 shadow-sm">
                                      <Clock className="h-4 w-4 sm:h-5 sm:w-5" />
                                      <span className="text-lg sm:text-2xl tracking-tighter">{ev.start_time || "--:--"}</span>
                                    </div>
                                    <div className="text-[10px] sm:text-[11px] font-bold text-muted-foreground/70 uppercase tracking-[0.15em]">
                                      {ev.address_neighborhood || "Ilha do Gv."}
                                    </div>
                                  </div>
                                </div>

                                {/* Endereço formatado */}
                                <div className="flex items-start gap-2.5 sm:gap-3 text-xs sm:text-base text-muted-foreground bg-muted/30 p-3.5 sm:p-4 rounded-xl sm:rounded-2xl border border-border/40">
                                  <MapPin className="h-4 w-4 sm:h-5 sm:w-5 text-primary/60 shrink-0 mt-0.5" />
                                  <span className="font-semibold leading-snug line-clamp-2">{buildFullAddress(ev)}</span>
                                </div>

                                {ev.description && (
                                  <p className="text-muted-foreground/80 line-clamp-2 sm:line-clamp-3 leading-relaxed text-sm sm:text-base font-medium max-w-2xl">
                                    {ev.description}
                                  </p>
                                )}
                              </div>

                               {/* Ações Mobile-Friendly */}
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
                                      const data = getShareData(ev);
                                      handleShare(data.title, data.text, data.url, ev.id);
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
                                    const addr = buildFullAddress(ev);
                                    window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(addr)}`, "_blank");
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
                  })}
                </div>
              </section>
             ))}
             </div>
           )}
         </div>
       )}
     </main>

        {/* Personalização */}
        <Onboarding />
        <PersonalizationDialog open={personalizationOpen} onOpenChange={setPersonalizationOpen} />
        {shareData && (
          <ShareDialog 
            open={!!shareData} 
            onOpenChange={(open) => !open && setShareData(null)}
            title={shareData.title}
            text={shareData.text}
            url={shareData.url}
            onShare={(platform) => shareData.eventId && trackShare(shareData.eventId)}
          />
        )}

        <Dialog open={!!selectedEvent} onOpenChange={(open) => !open && setSelectedEvent(null)}>
          <DialogContent className="max-w-2xl p-0 overflow-hidden rounded-t-[2rem] sm:rounded-[2rem] border-none bg-background h-[95vh] sm:h-[90vh] flex flex-col focus:outline-none">
            {selectedEvent && (
              <>
                {/* Header/Banner - Fixed at top */}
                  <div className="relative aspect-[4/3] sm:aspect-video w-full bg-muted overflow-hidden shrink-0 group">
                    <EventImage 
                      src={selectedEvent.image_url} 
                      alt={selectedEvent.event_title} 
                      category={selectedEvent.category} 
                      className="absolute inset-0 w-full h-full"
                    />
                  <div className="absolute top-4 right-4 z-20 flex gap-2">
                    <FavoriteButton 
                      eventId={selectedEvent.id} 
                      className="backdrop-blur-md border border-white/20 transition-all shadow-lg"
                    />
                    <Button 
                      variant="secondary" 
                      size="icon" 
                      className="rounded-full bg-black/40 backdrop-blur-md text-white border-white/20 hover:bg-black/60 transition-colors shadow-lg" 
                      onClick={() => setSelectedEvent(null)}
                    >
                      <X className="h-5 w-5" />
                    </Button>
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/90 via-black/40 to-transparent">
                    <div className="flex flex-wrap gap-2 mb-3">
                      <Badge className="bg-[#F6EEEA] text-[#2F5D46] border-[#E6D6CF] border px-3 py-1.5 font-semibold text-[10px] tracking-[0.15em] uppercase rounded-full shadow-sm">
                        {categoryIcons[selectedEvent.category || ""] || "📌"} {categoryLabels[selectedEvent.category || ""] || "Evento"}
                      </Badge>
                      
                      {selectedEvent.age_rating && (
                        <Badge className={cn(
                          "backdrop-blur-md text-white border-white/20 border px-3 py-1.5 font-black text-[10px] tracking-[0.15em] uppercase rounded-full shadow-sm",
                          selectedEvent.age_rating === '18+' ? "bg-red-500/80" : "bg-green-600/80"
                        )}>
                          {selectedEvent.age_rating}
                        </Badge>
                      )}
                    </div>
                    <h2 className="text-2xl sm:text-4xl font-black text-white tracking-tight leading-[1.1]">
                      {selectedEvent.event_title}
                    </h2>
                  </div>
                </div>

                {/* Scrollable Content */}
                <div className="flex-1 overflow-y-auto">
                  <div className="p-5 sm:p-10 space-y-8 sm:space-y-10">
                    {/* Info Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-8">
                      <div className="space-y-5 sm:space-y-6">
                        <div className="flex items-start gap-4">
                          <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-xl sm:rounded-2xl bg-primary/10 flex items-center justify-center shrink-0 shadow-sm border border-primary/5">
                            <CalendarDays className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
                          </div>
                          <div>
                            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] mb-1">Data</p>
                            <p className="font-bold text-base sm:text-lg text-foreground">{formatLongDate(selectedEvent.date)}</p>
                          </div>
                        </div>
                        <div className="flex items-start gap-4">
                          <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-xl sm:rounded-2xl bg-primary/10 flex items-center justify-center shrink-0 shadow-sm border border-primary/5">
                            <Clock className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
                          </div>
                          <div>
                            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] mb-1">Horário</p>
                            <p className="font-bold text-base sm:text-lg text-foreground">{selectedEvent.start_time}{selectedEvent.end_time ? ` — ${selectedEvent.end_time}` : ""}</p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="space-y-5 sm:space-y-6">
                        <div className="flex items-start gap-4">
                          <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-xl sm:rounded-2xl bg-secondary/10 flex items-center justify-center shrink-0 shadow-sm border border-secondary/5">
                            <MapPin className="h-5 w-5 sm:h-6 sm:w-6 text-secondary" />
                          </div>
                          <div>
                            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] mb-1">Local</p>
                            <p className="font-bold text-base sm:text-lg leading-tight text-foreground">{selectedEvent.location}</p>
                            <p className="text-xs sm:text-sm text-muted-foreground font-medium mt-1.5 leading-relaxed line-clamp-2">
                              {selectedEvent.address_street}{selectedEvent.address_neighborhood ? `, ${selectedEvent.address_neighborhood}` : ""}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Description Section */}
                    {selectedEvent.description && (
                      <div className="space-y-4 pt-8 border-t border-border/50">
                        <div className="flex items-center gap-2">
                          <Info className="h-4 w-4 text-primary/60" />
                          <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">Sobre o Evento</p>
                        </div>
                        <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap font-medium text-base sm:text-lg">
                          {selectedEvent.description}
                        </p>
                      </div>
                    )}

                    {/* Reviews System - Modular Iframe */}
                    <div className="space-y-4 pt-8 border-t border-border/50">
                      <iframe 
                        src={`/avaliacoes.html?id=${selectedEvent.id}&evento=${encodeURIComponent(selectedEvent.event_title)}`}
                        width="100%" 
                        height="650" 
                        style={{ border: 'none', borderRadius: '12px' }}
                        title="Avaliações"
                      />
                    </div>
                  </div>
                </div>

                 {/* Footer - Fixed at bottom */}
                 <div className="p-5 sm:p-10 lg:p-12 bg-card/80 backdrop-blur-xl border-t border-border/50 shrink-0">
                   <div className="flex flex-col gap-5 sm:gap-8">
                     <div className="flex flex-col gap-3.5">
                      <div className="flex flex-col sm:flex-row gap-4 w-full">
                        <Button 
                           className="flex-1 h-14 sm:h-16 rounded-full font-black uppercase tracking-wider gradient-sunset text-primary-foreground shadow-xl hover:scale-[1.03] active:scale-95 transition-all text-sm sm:text-base focus-visible:ring-4 focus-visible:ring-primary/40 outline-none" 
                          onClick={() => {
                            window.open(buildWhatsAppShare(selectedEvent), "_blank");
                            trackShare(selectedEvent.id);
                          }}
                          aria-label="Compartilhar evento no WhatsApp"
                        >
                          <MessageCircle className="h-5 w-5 sm:h-6 sm:w-6 mr-3" /> WhatsApp
                        </Button>

                        <Button
                          variant="outline"
                          className="flex-1 h-14 sm:h-16 rounded-full font-black uppercase tracking-wider border-2 border-primary text-primary bg-background hover:bg-primary hover:text-white shadow-lg active:scale-95 transition-all text-sm sm:text-base focus-visible:ring-4 focus-visible:ring-primary/40 outline-none" 
                          onClick={() => {
                            const data = getShareData(selectedEvent);
                            handleShare(data.title, data.text, data.url, selectedEvent.id);
                          }}
                        >
                          <Share2 className="h-6 w-6 mr-3" /> Compartilhar
                        </Button>
                      </div>

                      <div className="grid grid-cols-2 xs:flex xs:flex-wrap gap-2.5 sm:gap-3">
                        <Button
                          variant="ghost"
                          className="flex-1 h-12 sm:h-14 rounded-full font-bold text-[10px] sm:text-sm uppercase tracking-widest text-muted-foreground hover:text-primary hover:bg-primary/5 active:scale-95 transition-all"
                          onClick={() => handleCopyLink(getShareUrl(selectedEvent.id))}
                        >
                          <Copy className="h-5 w-5 mr-2.5" /> Copiar link
                        </Button>

                        <Button 
                          variant="outline" 
                          className="flex-1 h-12 sm:h-14 rounded-full font-black uppercase tracking-wider border-2 border-primary/20 text-primary bg-background hover:bg-primary hover:text-white active:scale-95 transition-all text-[10px] sm:text-xs shadow-sm" 
                          onClick={() => {
                            const addr = buildFullAddress(selectedEvent);
                            window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(addr)}`, "_blank");
                          }}
                        >
                          <MapPin className="h-5 w-5 mr-2.5" /> Mapa
                        </Button>
                        
                        <Button 
                          variant="outline" 
                          className="flex-1 h-12 sm:h-14 rounded-full font-black uppercase tracking-wider border-2 border-black/20 text-foreground bg-background hover:bg-foreground hover:text-background active:scale-95 transition-all text-[10px] sm:text-xs shadow-sm" 
                          onClick={() => {
                            window.open(buildUberLink(selectedEvent), "_blank");
                          }}
                        >
                           <MapPin className="h-5 w-5 mr-2.5" /> Ir de Uber
                        </Button>
                      </div>
                    </div>
                    
                    <div className="flex flex-col gap-2">
                       <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                         {selectedEvent.image_url && (
                           <Button 
                             variant="ghost" 
                             className="h-10 text-[10px] font-bold text-muted-foreground hover:text-primary transition-colors border border-dashed border-border rounded-xl"
                             onClick={async (e) => {
                               e.stopPropagation();
                               const link = document.createElement('a');
                               link.href = selectedEvent.image_url!;
                               link.download = `flyer-feed-${selectedEvent.event_title}.jpg`;
                               document.body.appendChild(link);
                               link.click();
                               document.body.removeChild(link);
                               toast.success("Iniciando download (Feed)...");
                             }}
                           >
                             <Download className="h-3 w-3 mr-1" /> Feed
                           </Button>
                         )}
                         
                         {(selectedEvent as any).image_url_story && (
                           <Button 
                             variant="ghost" 
                             className="h-10 text-[10px] font-bold text-muted-foreground hover:text-primary transition-colors border border-dashed border-border rounded-xl"
                             onClick={async (e) => {
                               e.stopPropagation();
                               const link = document.createElement('a');
                               link.href = (selectedEvent as any).image_url_story!;
                               link.download = `flyer-story-${selectedEvent.event_title}.jpg`;
                               document.body.appendChild(link);
                               link.click();
                               document.body.removeChild(link);
                               toast.success("Iniciando download (Story)...");
                             }}
                           >
                             <Download className="h-3 w-3 mr-1" /> Story
                           </Button>
                         )}
                         
                         {(selectedEvent as any).image_url_whatsapp && (
                           <Button 
                             variant="ghost" 
                             className="h-10 text-[10px] font-bold text-muted-foreground hover:text-primary transition-colors border border-dashed border-border rounded-xl"
                             onClick={async (e) => {
                               e.stopPropagation();
                               const link = document.createElement('a');
                               link.href = (selectedEvent as any).image_url_whatsapp!;
                               link.download = `flyer-whatsapp-${selectedEvent.event_title}.jpg`;
                               document.body.appendChild(link);
                               link.click();
                               document.body.removeChild(link);
                               toast.success("Iniciando download (WhatsApp)...");
                             }}
                           >
                             <Download className="h-3 w-3 mr-1" /> WhatsApp
                           </Button>
                         )}
                       </div>

                      <ReportButton eventId={selectedEvent.id} eventTitle={selectedEvent.event_title} />
                      
                      <Button 
                        variant="ghost" 
                        className="h-14 rounded-full font-bold text-muted-foreground hover:text-foreground hover:bg-muted focus-visible:ring-2 focus-visible:ring-muted-foreground/30 active:scale-95 transition-all"
                        onClick={() => setSelectedEvent(null)}
                      >
                        Fechar Detalhes
                      </Button>
                    </div>
                  </div>
                </div>
              </>
            )}
          </DialogContent>
        </Dialog>
    </div>
  );
}

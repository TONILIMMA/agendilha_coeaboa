 import { useState, useMemo, useEffect } from "react";
 import { useNavigate } from "react-router-dom";
 import { supabase } from "@/integrations/supabase/client";
  import { useAuth } from "@/contexts/AuthContext";
  import { useTheme } from "@/hooks/useTheme";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
  import { Loader2, MapPin, Clock, Share2, CalendarDays, FileDown, Search, Copy, ExternalLink, ArrowUpDown, X, Globe, MessageCircle, Info, Download, Car, Facebook, Twitter, Star } from "lucide-react";
 import { Skeleton } from "@/components/ui/skeleton";
 import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
 import { exportEditorialAgendaPdf } from "@/lib/pdfExport";
  import { toast } from "sonner";
  import { cn } from "@/lib/utils";
 import logoCoeABoa from "@/assets/coeaboa-logo.jpg";
  import EventReviews from "@/components/EventReviews";

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

function buildFullAddress(ev: Event): string {
  const parts = [
    ev.location,
    ev.address_street,
    ev.address_neighborhood,
  ].filter(Boolean);
  return parts.join(" – ");
}

const getShareUrl = (eventId?: string) => {
  const base = `${window.location.origin}/agenda`;
  return eventId ? `${base}?event=${eventId}` : base;
};

const getShareData = (ev?: Event) => {
  const isAgenda = !ev;
  const title = isAgenda ? "Agenda Cultural da Ilha" : `Evento: ${ev.event_title}`;
  const url = getShareUrl(ev?.id);
  
  let text = isAgenda 
    ? "Confira a programação completa da Ilha do Governador!" 
    : `Confira este evento e a agenda completa no AgendIlha!`;

  if (ev) {
    const time = ev.start_time ? `${ev.start_time}` : "";
    const addr = buildFullAddress(ev);
    const eventDetails = `🗓️ *${ev.event_title}*${time ? `\n⏰ ${time}` : ""}${addr ? `\n📍 ${addr}` : ""}`;
    text = `${eventDetails}\n\n🌴 Veja os detalhes no AgendIlha:`;
  } else {
    text = `🌴 *Confira a Agenda Cultural da Ilha do Governador!* 🌴\n\nVeja a programação completa e atualizada em:`;
  }

  return { title, text, url };
};

function buildWhatsAppShare(ev?: Event) {
  const { text, url } = getShareData(ev);
  const msg = `${text}\n${url}`;
  return `https://wa.me/?text=${encodeURIComponent(msg)}`;
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
      if (navigator.share) {
        try {
          await navigator.share({ title, text, url });
          if (eventId) trackShare(eventId);
        } catch (err) {
          if ((err as Error).name !== 'AbortError') {
            setShareData({ title, text, url, eventId });
          }
        }
      } else {
        setShareData({ title, text, url, eventId });
      }
    };

    const handleCopyLink = (url: string) => {
      navigator.clipboard.writeText(url);
      toast.success("Link copiado!");
    };

    const { user } = useAuth();
    const { toggleTheme } = useTheme();
  const [events, setEvents] = useState<Event[]>([]);
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
   const [categoryFilter, setCategoryFilter] = useState("all");
   const [neighborhoodFilter, setNeighborhoodFilter] = useState("all");
   const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);

   useEffect(() => {
     const params = new URLSearchParams(window.location.search);
     if (params.get('view') === 'favorites') {
       setShowFavoritesOnly(true);
     }
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
            .from("submissions")
            .select("*")
            .in('status', ['published', 'approved']);
          
          if (error) throw error;
          
          const publishedEvents = (data as any[])?.filter(e => e.status === 'published') || [];
          setEvents(publishedEvents);
          loadRatings();

          // Verificar se há um evento específico na URL para abrir o modal
          const params = new URLSearchParams(window.location.search);
          const eventId = params.get('event');
          if (eventId) {
            const ev = publishedEvents.find(e => e.id === eventId);
            if (ev) {
              setSelectedEvent(ev);
              trackView(ev.id);
            }
          }
        } catch (error) {
          console.error("Error loading events:", error);
          toast.error("Erro ao carregar a agenda. Tente novamente mais tarde.");
        } finally {
          setLoading(false);
        }
      }
      load();
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

  async function trackView(id: string) {
    try {
      await supabase.rpc('increment_views', { event_id: id });
    } catch (e) {
      console.error("Error tracking view:", e);
    }
  }

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
    const favs = JSON.parse(localStorage.getItem("agendilha_favorites") || "[]");
    return upcomingEvents.filter(ev => {
      const matchSearch = ev.event_title.toLowerCase().includes(search.toLowerCase()) || 
                          (ev.description || "").toLowerCase().includes(search.toLowerCase());
      const matchCat = categoryFilter === "all" || ev.category === categoryFilter;
      const matchNeigh = neighborhoodFilter === "all" || ev.address_neighborhood === neighborhoodFilter;
      const matchFav = !showFavoritesOnly || favs.includes(ev.id);
      return matchSearch && matchCat && matchNeigh && matchFav;
    });
  }, [upcomingEvents, search, categoryFilter, neighborhoodFilter, showFavoritesOnly]);

  const grouped = useMemo(() => {
    const map: Record<string, { label: string; sortKey: string; items: Event[] }> = {};
    for (const ev of filteredEvents) {
      const d = parseDateToObj(ev.date);
      const key = d
        ? `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
        : "sem-data";
      if (!map[key]) {
        map[key] = {
          label: formatDayLabel(ev.date),
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
                <span className="text-[10px] sm:text-[11px] font-black uppercase tracking-[0.2em] sm:tracking-[0.3em] text-secondary-foreground">Coé a Boa? apresenta:</span>
              </div>
              <h1 className="text-5xl xs:text-6xl sm:text-8xl font-black font-display text-primary tracking-tightest leading-[0.9] drop-shadow-sm">
                AgendIlha
              </h1>
              <p className="text-muted-foreground text-base sm:text-2xl font-medium max-w-2xl mx-auto leading-relaxed px-2 sm:px-4 text-balance">
                A agenda cultural curada da Ilha do Governador.
              </p>
            </div>

            <div className="flex flex-col items-center gap-6 sm:gap-8 mt-8 sm:mt-12 px-2" role="group" aria-label="Ações da agenda">
              <div className="flex flex-col sm:flex-row justify-center gap-3 sm:gap-4 w-full max-w-2xl">
                <Button
                  className="rounded-full shadow-lg sm:shadow-xl gradient-sunset text-primary-foreground font-black px-6 sm:px-12 h-14 sm:h-16 text-sm sm:text-base transition-all uppercase tracking-widest focus-visible:ring-4 focus-visible:ring-primary/40 outline-none hover:scale-[1.02] active:scale-95 flex-1"
                  onClick={() => window.open(buildWhatsAppShare(), "_blank")}
                  aria-label="Compartilhar agenda no WhatsApp"
                >
                  <MessageCircle className="h-5 w-5 mr-2.5" /> WhatsApp
                </Button>

                <Button 
                  variant="outline" 
                  className="rounded-full shadow-md border-2 border-primary text-primary bg-background hover:bg-primary hover:text-white transition-all px-6 sm:px-12 h-14 sm:h-16 text-sm sm:text-base font-bold uppercase tracking-wider focus-visible:ring-4 focus-visible:ring-primary/30 outline-none active:scale-95 flex-1" 
                  onClick={() => {
                    const data = getShareData();
                    handleShare(data.title, data.text, data.url);
                  }}
                  aria-label="Abrir compartilhamento do sistema"
                >
                  <Share2 className="h-5 w-5 mr-2.5" /> Compartilhar
                </Button>
              </div>

              <div className="flex flex-wrap justify-center gap-4 sm:gap-6 w-full opacity-80 hover:opacity-100 transition-opacity">
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

        {/* Bloco de Busca e Filtros - Mobile-First */}
        <div className="mb-12 space-y-4 sm:space-y-6">
          <div className="bg-card border border-border/60 rounded-[2rem] p-5 sm:p-8 shadow-card ring-1 ring-black/[0.02]">
            <div className="flex flex-col gap-5 sm:gap-6">
              {/* Barra de Busca e Ordenação */}
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                <div className="relative flex-1 group">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                  <Input
                    placeholder="O que você procura hoje?"
                    className="pl-12 h-14 text-base sm:text-lg border-none bg-muted/40 focus-visible:ring-2 focus-visible:ring-primary/20 rounded-2xl sm:rounded-3xl"
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
                      toast.info(`Ordenado por: ${newOrder === "asc" ? "Mais Próximos" : "Mais Distantes"}`, {
                        duration: 2000,
                        position: "bottom-center"
                      });
                    }}
                    className="w-full sm:w-auto h-14 px-6 rounded-2xl sm:rounded-3xl border-2 border-primary/10 text-primary font-bold transition-all active:scale-95 bg-white hover:bg-primary/5 hover:border-primary/30 flex items-center justify-center gap-2"
                  >
                    <ArrowUpDown className={cn("h-4 w-4 transition-transform duration-300", sortOrder === "desc" && "rotate-180")} />
                    <span className="text-[11px] sm:text-xs uppercase tracking-widest">
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
                        className="min-w-[300px] sm:min-w-[350px] snap-start border-orange-500/30 bg-gradient-to-br from-orange-500/10 to-transparent hover:shadow-lg transition-all cursor-pointer overflow-hidden group"
                        data-nome={ev.event_title}
                       onClick={() => { trackView(ev.id); setSelectedEvent(ev); }}
                     >
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
                   ))}
                </div>
              </section>
            )}

            {/* Lista de Eventos Organizada */}
            {sortedDays.map((dayKey) => (
              <section key={dayKey} className="space-y-8">
                   <div className="flex items-center gap-4 sticky top-16 bg-background/80 backdrop-blur-md py-4 z-10 border-b border-border/50">
                   <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0 shadow-sm">
                    <CalendarDays className="h-6 w-6 text-primary dark:text-primary" />
                  </div>
                   <h2 className="text-2xl font-black text-foreground tracking-tight">
                    {grouped[dayKey].label}
                  </h2>
                </div>

                <div className="grid grid-cols-1 gap-8">
                  {grouped[dayKey].items.map((ev) => {
                    const icon = categoryIcons[ev.category || ""] || "📌";
                    return (
                      <Card 
                        key={ev.id} 
                        className="overflow-hidden border-border/60 bg-card/50 hover:shadow-elevated transition-all group cursor-pointer rounded-[2.5rem]"
                        onClick={() => { trackView(ev.id); setSelectedEvent(ev); }}
                      >
                        <CardContent className="p-0">
                         <div className="flex flex-col lg:flex-row min-h-[320px]">
                           {/* Imagem do Evento - Mobile-First */}
                           {(ev as any).image_url ? (
                             <div className="w-full lg:w-72 xl:w-80 h-48 sm:h-64 lg:h-auto shrink-0 relative overflow-hidden group">
                               <img 
                                 src={(ev as any).image_url} 
                                 alt={ev.event_title}
                                 loading="lazy"
                                 className="absolute inset-0 w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
                               />
                               <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent lg:hidden" />
                               {/* Badge flutuante na imagem para mobile */}
                               <div className="absolute bottom-4 left-4 lg:hidden">
                                 <Badge className="bg-white/95 text-primary border-none font-black text-[10px] tracking-widest px-3 py-1 shadow-lg backdrop-blur-sm">
                                   {categoryLabels[ev.category!]?.split(' ')[0] || ev.category}
                                 </Badge>
                               </div>
                             </div>
                           ) : (
                             /* Faixa lateral decorativa se não houver imagem */
                             <div className="hidden lg:block w-3 bg-primary/10 shrink-0" />
                           )}

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
      </main>

        <footer className="mt-32 py-24 border-t border-border/40 text-center bg-card/30 backdrop-blur-sm space-y-8 rounded-t-[3rem]">
          <div className="flex flex-col items-center gap-8">
            <div className="inline-flex items-center gap-4 px-8 py-5 rounded-[2.5rem] glass border border-white/20 shadow-glass group transition-all hover:scale-105">
              <img src={logoCoeABoa} alt="Coé a Boa?" className="h-12 w-12 sm:h-14 sm:w-14 rounded-full ring-2 ring-primary/20 shadow-sm group-hover:rotate-12 transition-transform" />
              <div className="flex flex-col items-start leading-none gap-1">
                <div className="flex items-center gap-2.5">
                  <span className="font-display text-2xl sm:text-3xl font-black text-primary tracking-tight">AgendIlha</span>
                  <span className="h-2 w-2 rounded-full bg-secondary/40" />
                  <span className="font-display text-lg sm:text-xl font-bold text-secondary tracking-tight">Coé a Boa?</span>
                </div>
                <p className="font-mono text-[9px] uppercase tracking-[0.25em] text-muted-foreground/60">Curadoria & Tecnologia Local</p>
              </div>
            </div>
            
            <div className="text-[10px] sm:text-[11px] text-muted-foreground/50 font-mono uppercase tracking-[0.5em] py-4 border-y border-border/30 inline-block px-10">
              © {new Date().getFullYear()} — Ilha do Governador, RJ
            </div>
          </div>
        </footer>

        <Dialog open={!!selectedEvent} onOpenChange={(open) => !open && setSelectedEvent(null)}>
          <DialogContent className="max-w-2xl p-0 overflow-hidden rounded-t-[2rem] sm:rounded-[2rem] border-none bg-background h-[95vh] sm:h-[90vh] flex flex-col focus:outline-none">
            {selectedEvent && (
              <>
                {/* Header/Banner - Fixed at top */}
                <div className="relative aspect-[4/3] sm:aspect-video w-full bg-muted overflow-hidden shrink-0">
                  {selectedEvent.image_url ? (
                    <img src={selectedEvent.image_url} alt={selectedEvent.event_title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/10 to-accent/10">
                      <CalendarDays className="h-20 w-20 text-primary/20" />
                    </div>
                  )}
                  <div className="absolute top-4 right-4 z-20">
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
                    <Badge className="mb-3 bg-[#F6EEEA] text-[#2F5D46] border-[#E6D6CF] border px-3 py-1.5 font-semibold text-[10px] tracking-[0.15em] uppercase rounded-full shadow-sm">
                      {categoryLabels[selectedEvent.category || ""] || "Evento"}
                    </Badge>
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
                            <p className="font-bold text-base sm:text-lg text-foreground">{formatDayLabel(selectedEvent.date)}</p>
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
                          <Car className="h-5 w-5 mr-2.5" /> Ir de Uber
                        </Button>
                      </div>
                    </div>
                    
                    {selectedEvent.image_url && (
                      <Button 
                        variant="ghost" 
                        className="w-full h-10 text-xs font-bold text-muted-foreground hover:text-primary transition-colors"
                        onClick={async (e) => {
                          e.stopPropagation();
                          const link = document.createElement('a');
                          link.href = selectedEvent.image_url!;
                          link.download = `flyer-${selectedEvent.event_title}.jpg`;
                          document.body.appendChild(link);
                          link.click();
                          document.body.removeChild(link);
                          toast.success("Iniciando download do flyer...");
                        }}
                      >
                        <Download className="h-4 w-4 mr-2" /> Baixar Flyer do Evento
                      </Button>
                    )}
                    
                    <Button 
                      variant="ghost" 
                      className="h-14 rounded-full font-bold text-muted-foreground hover:text-foreground hover:bg-muted focus-visible:ring-2 focus-visible:ring-muted-foreground/30 active:scale-95 transition-all"
                      onClick={() => setSelectedEvent(null)}
                    >
                      Fechar Detalhes
                    </Button>
                  </div>
                </div>
              </>
            )}
          </DialogContent>
        </main>
        </Dialog>
    </div>
  );
}

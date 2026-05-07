 import { useState, useMemo, useEffect } from "react";
 import { useNavigate } from "react-router-dom";
 import { supabase } from "@/integrations/supabase/client";
 import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
 import { Loader2, MapPin, Clock, Share2, CalendarDays, FileDown, Search, Copy, ExternalLink, ArrowUpDown, X, Globe, MessageCircle } from "lucide-react";
 import { Skeleton } from "@/components/ui/skeleton";
 import { Dialog, DialogContent } from "@/components/ui/dialog";
 import { exportEditorialAgendaPdf } from "@/lib/pdfExport";
 import { toast } from "sonner";
 import logoCoeABoa from "@/assets/coeaboa-logo.jpg";

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

function buildWhatsAppShare(ev: Event) {
  const time = ev.start_time ? `${ev.start_time}` : "";
  const addr = buildFullAddress(ev);
  const msg = `🗓️ *${ev.event_title}*\n${time ? `⏰ ${time}\n` : ""}${addr ? `📍 ${addr}\n` : ""}\n🌴 Veja a agenda completa: https://agendilha-divulgacao.lovable.app/agenda`;
  return `https://wa.me/?text=${encodeURIComponent(msg)}`;
}

 export default function AgendaCultural() {
   const navigate = useNavigate();
   const { user } = useAuth();
   const [events, setEvents] = useState<Event[]>([]);
   const [loading, setLoading] = useState(true);
   const [search, setSearch] = useState("");
   const [categoryFilter, setCategoryFilter] = useState("all");
   const [neighborhoodFilter, setNeighborhoodFilter] = useState("all");
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
         
         // Filter only published ones to strictly follow the "public" rule if required, 
         // but based on user prompt "aprovados/publicados" I'll show both for now if they are "aptos".
         // Actually, let's stick to 'published' to maintain the flow, but explain to user.
         // RE-READ: "mostrar somente eventos aptos para publicação pública; - não mostrar rascunhos, pendentes, rejeitados ou itens internos;"
         // If 'approved' is considered internal, then only 'published' should show.
         // But if no events are published, it will be empty.
         // I'll show 'published' events by default, but I'll update the filter to be more resilient.
         setEvents((data as any[])?.filter(e => e.status === 'published') || []);
       } catch (error) {
         console.error("Error loading events:", error);
         toast.error("Erro ao carregar a agenda. Tente novamente mais tarde.");
       } finally {
         setLoading(false);
       }
     }
     load();
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
    return upcomingEvents.filter(ev => {
      const matchSearch = ev.event_title.toLowerCase().includes(search.toLowerCase()) || 
                          (ev.description || "").toLowerCase().includes(search.toLowerCase());
      const matchCat = categoryFilter === "all" || ev.category === categoryFilter;
      const matchNeigh = neighborhoodFilter === "all" || ev.address_neighborhood === neighborhoodFilter;
      return matchSearch && matchCat && matchNeigh;
    });
  }, [upcomingEvents, search, categoryFilter, neighborhoodFilter]);

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
      <main className="mx-auto max-w-4xl px-4 py-8">
        {/* Topo da Página */}
        <div className="mb-12 text-center space-y-6">
            <div className="flex flex-col items-center gap-4">
              <div className="inline-flex items-center justify-center px-4 py-1.5 rounded-full bg-secondary/10 border border-secondary/20 mb-2">
                <span className="text-[10px] sm:text-xs font-bold uppercase tracking-[0.2em] text-secondary-foreground">Coé a Boa? apresenta:</span>
              </div>
              <h1 className="text-4xl sm:text-7xl font-black font-display text-primary tracking-tightest leading-none drop-shadow-sm">AgendIlha</h1>
              <p className="text-muted-foreground text-base sm:text-xl font-medium max-w-2xl mx-auto leading-relaxed px-4">
                A agenda cultural curada da Ilha do Governador.
                <span className="hidden sm:inline"> Descubra o que há de melhor no nosso bairro.</span>
              </p>
            </div>

            <div className="flex flex-wrap justify-center gap-3 sm:gap-4 mt-8 px-4">
              <Button variant="outline" className="rounded-full shadow-md border-2 border-primary text-primary bg-primary/10 hover:bg-primary/20 transition-all px-5 sm:px-7 h-11 sm:h-12 text-xs sm:text-sm font-black uppercase tracking-wider focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 ring-offset-background outline-none" onClick={() => {
                navigator.clipboard.writeText(window.location.href);
                toast.success("Link da agenda copiado!");
              }}>
                <Copy className="h-4 w-4 mr-2" /> <span className="hidden sm:inline">Copiar Link</span><span className="sm:hidden">Link</span>
              </Button>
              <Button variant="outline" className="rounded-full shadow-md border-2 border-green-600 text-green-700 bg-green-50 hover:bg-green-100 transition-all px-5 sm:px-7 h-11 sm:h-12 text-xs sm:text-sm font-black uppercase tracking-wider focus-visible:ring-2 focus-visible:ring-green-600 focus-visible:ring-offset-2 ring-offset-background outline-none" onClick={() => {
                window.open(`https://wa.me/?text=${encodeURIComponent("Confira a Agenda Cultural da Ilha: " + window.location.href)}`, "_blank");
              }}>
                <Share2 className="h-4 w-4 mr-2" /> <span className="hidden sm:inline">Compartilhar</span><span className="sm:hidden">Zap</span>
              </Button>
              <Button variant="default" className="rounded-full shadow-xl bg-primary text-primary-foreground hover:bg-primary/90 font-black px-6 sm:px-10 h-11 sm:h-12 text-xs sm:text-sm border-2 border-primary transform hover:scale-105 transition-all uppercase tracking-widest focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 ring-offset-background outline-none" onClick={() => {
                exportEditorialAgendaPdf(upcomingEvents as any, "Agenda Cultural da Ilha");
                toast.success("PDF da agenda gerado!");
              }}>
                <FileDown className="h-4 w-4 mr-2" /> <span className="hidden sm:inline">Baixar PDF</span><span className="sm:hidden">PDF</span>
              </Button>
            </div>
        </div>

        {/* Filtros Públicos */}
        <div className="mb-12 bg-card border border-border rounded-2xl p-6 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                placeholder="O que você procura hoje? (show, feira, etc...)"
                className="pl-10 h-12 text-lg border-none bg-muted/50 focus-visible:ring-primary/20"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <Button
              variant="outline"
              onClick={() => setSortOrder(prev => prev === "asc" ? "desc" : "asc")}
              className="h-12 px-5 rounded-xl border-none bg-muted/50 hover:bg-muted font-bold text-muted-foreground flex items-center gap-2 transition-colors"
            >
              <ArrowUpDown className="h-4 w-4" />
              <span className="text-xs uppercase tracking-wider">
                {sortOrder === "asc" ? "Mais Próximos" : "Mais Distantes"}
              </span>
            </Button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="h-11 border-none bg-muted/50">
                <SelectValue placeholder="Todas as categorias" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as categorias</SelectItem>
                {Object.entries(categoryLabels).map(([k, v]) => (
                  <SelectItem key={k} value={k}>{v}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={neighborhoodFilter} onValueChange={setNeighborhoodFilter}>
              <SelectTrigger className="h-11 border-none bg-muted/50">
                <SelectValue placeholder="Todos os bairros" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os bairros</SelectItem>
                {neighborhoods.map((n) => (
                  <SelectItem key={n} value={n}>{n}</SelectItem>
                ))}
              </SelectContent>
            </Select>
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
                      navigate("/auth");
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
              <section key={dayKey} className="space-y-6">
                <div className="flex items-center gap-3 sticky top-0 bg-background/80 backdrop-blur-md py-3 z-10 border-b border-border/50">
                  <div className="h-10 w-10 rounded-2xl bg-primary/10 flex items-center justify-center">
                    <CalendarDays className="h-5 w-5 text-primary" />
                  </div>
                  <h2 className="text-xl font-bold text-foreground">
                    {grouped[dayKey].label}
                  </h2>
                </div>

                <div className="grid grid-cols-1 gap-6">
                  {grouped[dayKey].items.map((ev) => {
                    const icon = categoryIcons[ev.category || ""] || "📌";
                    return (
                       <Card 
                         key={ev.id} 
                         className="overflow-hidden border-border hover:shadow-md transition-all group cursor-pointer"
                         onClick={() => { trackView(ev.id); setSelectedEvent(ev); }}
                       >
                        <CardContent className="p-0">
                         <div className="flex flex-col md:flex-row">
                           {/* Image or Icon strip */}
                           {(ev as any).image_url ? (
                             <div className="w-full md:w-48 h-48 md:h-auto shrink-0 relative overflow-hidden">
                               <img 
                                 src={(ev as any).image_url} 
                                 alt={ev.event_title}
                                 className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                               />
                             </div>
                           ) : (
                             <div className="w-full md:w-1 bg-primary/20 group-hover:bg-primary transition-colors h-1 md:h-auto" />
                           )}

                           <div className="flex-1 p-5 sm:p-7 md:p-8 space-y-5 sm:space-y-6">
                              <div className="flex flex-wrap items-start justify-between gap-4">
                                <div className="space-y-2 flex-1 min-w-0">
                                  <div className="flex flex-wrap items-center gap-2.5">
                                     <span className="text-2xl drop-shadow-sm">{icon}</span>
                                     <Badge variant="secondary" className="bg-secondary/10 text-secondary-foreground text-[11px] font-black uppercase tracking-widest border-secondary/20 px-2.5 py-0.5">
                                      {categoryLabels[ev.category!] || ev.category}
                                    </Badge>
                                  </div>
                                   <h3 className="text-2xl sm:text-4xl font-black text-foreground leading-[1.1] tracking-tightest group-hover:text-primary transition-colors">
                                    {ev.event_title}
                                  </h3>
                                </div>
                                <div className="flex flex-col items-start sm:items-end sm:text-right shrink-0">
                                  <div className="flex items-center gap-2 text-primary font-black bg-primary/5 px-3 py-1.5 rounded-xl border border-primary/10 shadow-sm ring-1 ring-primary/5">
                                    <Clock className="h-4 w-4" />
                                    <span className="text-xl sm:text-2xl tracking-tighter">{ev.start_time || "--:--"}</span>
                                  </div>
                                  <div className="text-xs sm:text-sm font-bold text-muted-foreground/80 mt-1.5 uppercase tracking-wider">
                                    {ev.address_neighborhood || "Ilha do Governador"}
                                  </div>
                                </div>
                               </div>
 
                               <div className="flex items-start gap-2.5 text-sm sm:text-base text-muted-foreground/90 bg-muted/30 p-3 rounded-xl border border-border/40">
                                 <MapPin className="h-4 w-4 sm:h-5 sm:w-5 text-primary/70 shrink-0 mt-0.5" />
                                 <span className="font-semibold leading-tight">{buildFullAddress(ev)}</span>
                               </div>

                              {ev.description && (
                                 <p className="text-muted-foreground line-clamp-2 leading-relaxed text-[15px]">
                                  {ev.description}
                                </p>
                              )}

                               <div className="pt-2 flex flex-wrap items-center gap-3 sm:gap-4">
                                 <Button size="sm" variant="outline" className="rounded-full h-11 sm:h-10 px-6 border-2 border-green-600/40 text-green-900 font-bold hover:bg-green-50 hover:border-green-600 transition-all shadow-sm focus-visible:ring-2 focus-visible:ring-green-600 focus-visible:ring-offset-2 ring-offset-background outline-none" onClick={() => {
                                  trackShare(ev.id);
                                  window.open(buildWhatsAppShare(ev), "_blank");
                                }}>
                                   <Share2 className="h-4 w-4 mr-2" /> WhatsApp
                                </Button>
                                 <Button size="sm" variant="ghost" className="rounded-full h-11 sm:h-10 px-6 font-bold text-foreground/80 hover:text-primary hover:bg-primary/5 transition-all focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 ring-offset-background outline-none" onClick={() => {
                                  const addr = buildFullAddress(ev);
                                  window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(addr)}`, "_blank");
                                }}>
                                  <ExternalLink className="h-4 w-4 mr-2" /> Ver no Mapa
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

       <footer className="bg-muted/30 border-t border-border mt-24">
         <div className="mx-auto max-w-4xl px-4 py-20 text-center space-y-8">
           <div className="flex flex-col items-center gap-4">
             <div className="flex items-center gap-3">
               <img src={logoCoeABoa} alt="Coé a Boa?" className="h-10 w-10 rounded-full ring-2 ring-primary/10" />
               <div className="flex flex-col items-start leading-[1.1] text-left">
                 <span className="font-display text-2xl font-black text-primary tracking-tight">AgendIlha</span>
                 <span className="text-[10px] text-secondary font-bold uppercase tracking-widest">Coé a Boa?</span>
               </div>
             </div>
             <p className="text-[15px] text-muted-foreground max-w-md mx-auto leading-relaxed font-medium italic opacity-80">
               "Sua agenda cultural hiperlocal. Os melhores eventos da Ilha do Governador reunidos e curados em um só lugar."
             </p>
           </div>
           
           <div className="pt-10 flex flex-col items-center gap-2">
             <div className="h-px w-12 bg-border mb-4" />
             <div className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground/50 font-black">
               © {new Date().getFullYear()} AgendIlha do Governador
             </div>
             <div className="text-[9px] uppercase tracking-wider text-muted-foreground/30 font-bold">
               Uma iniciativa da marca Coé a Boa?
             </div>
           </div>
        </div>
      </footer>
    </div>
  );
}

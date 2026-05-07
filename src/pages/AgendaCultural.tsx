import { useState, useMemo, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, MapPin, Clock, Share2, CalendarDays, FileDown, Search, Copy, ExternalLink } from "lucide-react";
import { exportEditorialAgendaPdf } from "@/lib/pdfExport";
import { toast } from "sonner";

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
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [neighborhoodFilter, setNeighborhoodFilter] = useState("all");

   useEffect(() => {
     async function load() {
       setLoading(true);
       try {
         const { data, error } = await supabase
           .from("submissions")
           .select("*")
           .in('status', ['published', 'approved']) // Allow both as per "aprovados/publicados" but usually admin will move to published
           .order("date", { ascending: true, nullsFirst: false });
         
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
      .sort(([, a], [, b]) => a.sortKey.localeCompare(b.sortKey))
      .map(([key]) => key)
  , [grouped]);

  return (
    <div className="min-h-screen bg-background">
      <main className="mx-auto max-w-4xl px-4 py-8">
        {/* Topo da Página */}
        <div className="mb-10 text-center space-y-3">
          <h1 className="text-3xl sm:text-5xl font-bold font-display text-primary">Agenda Cultural da Ilha</h1>
          <p className="text-muted-foreground text-lg">Eventos aprovados e divulgados na Ilha do Governador</p>
          <div className="flex flex-wrap justify-center gap-3 mt-6">
            <Button variant="outline" className="rounded-full shadow-sm" onClick={() => {
              navigator.clipboard.writeText(window.location.href);
              toast.success("Link da agenda copiado!");
            }}>
              <Copy className="h-4 w-4 mr-2" /> Copiar Link
            </Button>
            <Button variant="outline" className="rounded-full shadow-sm" onClick={() => {
              window.open(`https://wa.me/?text=${encodeURIComponent("Confira a Agenda Cultural da Ilha: " + window.location.href)}`, "_blank");
            }}>
              <Share2 className="h-4 w-4 mr-2" /> Compartilhar Agenda
            </Button>
            <Button variant="default" className="rounded-full shadow-md bg-primary hover:bg-primary/90" onClick={() => {
              exportEditorialAgendaPdf(upcomingEvents as any, "Agenda Cultural da Ilha");
              toast.success("PDF da agenda gerado!");
            }}>
              <FileDown className="h-4 w-4 mr-2" /> Baixar PDF
            </Button>
          </div>
        </div>

        {/* Filtros Públicos */}
        <div className="mb-12 bg-card border border-border rounded-2xl p-6 shadow-sm space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              placeholder="O que você procura hoje? (show, feira, etc...)"
              className="pl-10 h-12 text-lg border-none bg-muted/50 focus-visible:ring-primary/20"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
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
          <div className="flex justify-center py-20">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
          </div>
         ) : sortedDays.length === 0 ? (
           <div className="text-center py-20 bg-muted/20 rounded-3xl border border-dashed border-border">
             <CalendarDays className="mx-auto h-16 w-16 mb-4 text-muted-foreground/30" />
             <p className="text-xl font-medium text-muted-foreground">Nenhum evento futuro encontrado</p>
             <p className="text-sm text-muted-foreground mt-1">
               {events.length > 0 
                 ? "Existem eventos cadastrados, mas todos já ocorreram. Volte em breve!" 
                 : "Tente ajustar seus filtros ou volte mais tarde."}
             </p>
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
                       onClick={() => trackView(ev.id)}
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
                        className="overflow-hidden border-border hover:shadow-md transition-all group"
                      >
                        <CardContent className="p-0">
                          <div className="flex flex-col sm:flex-row">
                            {/* Icon/Color strip */}
                            <div className="w-full sm:w-1 bg-primary/20 group-hover:bg-primary transition-colors h-1 sm:h-auto" />
                            
                            <div className="flex-1 p-6 sm:p-8 space-y-4">
                              <div className="flex flex-wrap items-start justify-between gap-3">
                                <div className="space-y-1 flex-1 min-w-0">
                                  <div className="flex items-center gap-2">
                                    <span className="text-2xl">{icon}</span>
                                    <Badge variant="secondary" className="bg-muted text-muted-foreground text-xs uppercase tracking-wider">
                                      {categoryLabels[ev.category!] || ev.category}
                                    </Badge>
                                  </div>
                                  <h3 className="text-2xl font-bold text-foreground leading-tight">
                                    {ev.event_title}
                                  </h3>
                                </div>
                                <div className="flex flex-col items-end text-right">
                                  <div className="flex items-center gap-2 text-primary font-bold">
                                    <Clock className="h-4 w-4" />
                                    <span>{ev.start_time || "--:--"}</span>
                                  </div>
                                  <div className="text-xs text-muted-foreground mt-1">
                                    {ev.address_neighborhood || "Ilha do Governador"}
                                  </div>
                                </div>
                              </div>

                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <MapPin className="h-4 w-4 text-primary/60 shrink-0" />
                                <span className="font-medium">{buildFullAddress(ev)}</span>
                              </div>

                              {ev.description && (
                                <p className="text-muted-foreground line-clamp-2 leading-relaxed">
                                  {ev.description}
                                </p>
                              )}

                              <div className="pt-4 flex flex-wrap items-center gap-3">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="rounded-full h-10 px-5"
                                  onClick={() => {
                                    trackShare(ev.id);
                                    window.open(buildWhatsAppShare(ev), "_blank");
                                  }}
                                >
                                  <Share2 className="h-4 w-4 mr-2 text-green-500" />
                                  WhatsApp
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="rounded-full h-10 px-5"
                                  onClick={() => {
                                    const addr = buildFullAddress(ev);
                                    window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(addr)}`, "_blank");
                                  }}
                                >
                                  <ExternalLink className="h-4 w-4 mr-2" />
                                  Ver no Mapa
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

      <footer className="bg-muted/30 border-t border-border mt-20">
        <div className="mx-auto max-w-4xl px-4 py-12 text-center space-y-4">
          <div className="flex justify-center items-center gap-2 font-display text-lg font-bold text-primary">
            <span>📌</span> AgendIlha
          </div>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            Sua agenda cultural hiperlocal. Os melhores eventos da Ilha do Governador reunidos num só lugar.
          </p>
          <div className="pt-6 text-[11px] uppercase tracking-[0.2em] text-muted-foreground/50">
            © {new Date().getFullYear()} AgendIlha do Governador
          </div>
        </div>
      </footer>
    </div>
  );
}

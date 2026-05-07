import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
 import { Loader2, MapPin, Clock, Share2, CalendarDays, ExternalLink, ArrowLeft, FileDown, Search, Filter } from "lucide-react";
 import { exportBulkEventsPdf, exportEditorialAgendaPdf } from "@/lib/pdfExport";
import { toast } from "sonner";

const categoryIcons: Record<string, string> = {
  musica: "🎸",
  gastronomia: "🍻",
  cultura: "🎭",
  esporte: "🚗",
  promocoes: "🏷️",
  outros: "📌",
};

const categoryLabels: Record<string, string> = {
  musica: "Música / Show",
  gastronomia: "Gastronomia",
  cultura: "Cultura / Arte",
  esporte: "Esporte",
  promocoes: "Promoções",
  outros: "Outros",
};

const weekdayOrder = [
  "segunda-feira",
  "terça-feira",
  "quarta-feira",
  "quinta-feira",
  "sexta-feira",
  "sábado",
  "domingo",
];

const weekdayLabels: Record<string, string> = {
  "segunda-feira": "Segunda-feira",
  "terça-feira": "Terça-feira",
  "quarta-feira": "Quarta-feira",
  "quinta-feira": "Quinta-feira",
  "sexta-feira": "Sexta-feira",
  "sábado": "Sábado",
  "domingo": "Domingo",
};

 import { Input } from "@/components/ui/input";
 import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface Event {
  id: string;
  event_title: string;
  date: string | null;
  start_time: string | null;
  end_time: string | null;
  location: string | null;
  address_neighborhood: string | null;
  address_street: string | null;
  address_number: string | null;
  address_city: string | null;
  description: string | null;
  category: string | null;
  company_name: string | null;
  phone: string | null;
   is_highlight: boolean;
}

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

function getWeekday(dateStr: string | null): string {
  const d = parseDateToObj(dateStr);
  if (!d || isNaN(d.getTime())) return "";
  return d.toLocaleDateString("pt-BR", { weekday: "long" });
}

function formatDateShort(dateStr: string | null): string {
  const d = parseDateToObj(dateStr);
  if (!d || isNaN(d.getTime())) return "";
  return d.toLocaleDateString("pt-BR", { day: "numeric", month: "short" });
}

function buildFullAddress(ev: Event): string {
  const parts = [
    ev.location,
    ev.address_street && ev.address_number
      ? `${ev.address_street}, ${ev.address_number}`
      : ev.address_street,
    ev.address_neighborhood,
    ev.address_city,
  ].filter(Boolean);
  return parts.join(" – ");
}

function buildGoogleMapsUrl(ev: Event): string {
  const addr = buildFullAddress(ev);
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(addr)}`;
}

function buildWhatsAppShare(ev: Event) {
  const time = ev.start_time
    ? `${ev.start_time}${ev.end_time ? ` às ${ev.end_time}` : ""}`
    : "";
  const addr = buildFullAddress(ev);
  const msg = `🗓️ *${ev.event_title}*\n${time ? `⏰ ${time}\n` : ""}${addr ? `📍 ${addr}\n` : ""}${ev.description ? `\n${ev.description}\n` : ""}\n🌴 Veja mais: https://agendilha-divulgacao.lovable.app/agenda`;
  return `https://wa.me/?text=${encodeURIComponent(msg)}`;
}

function isUpcoming(dateStr: string | null): boolean {
  const d = parseDateToObj(dateStr);
  if (!d) return true; // sem data → mostra mesmo assim
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return d >= today;
}

function formatDayLabel(dateStr: string | null): string {
  const d = parseDateToObj(dateStr);
  if (!d || isNaN(d.getTime())) return "Sem data definida";
  const wd = d.toLocaleDateString("pt-BR", { weekday: "long" });
  const dayMonth = d.toLocaleDateString("pt-BR", { day: "numeric", month: "long" });
  return `${wd.charAt(0).toUpperCase()}${wd.slice(1)} · ${dayMonth}`;
}

export default function AgendaCultural() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from("submissions")
        .select(
          "id, event_title, date, start_time, end_time, location, address_neighborhood, address_street, address_number, address_city, description, category, company_name, phone"
        )
        .eq("status", "approved")
        .order("date", { ascending: true, nullsFirst: false });
      setEvents((data as Event[]) || []);
      setLoading(false);
    }
    load();
  }, []);

  const upcomingEvents = useMemo(
    () => events.filter((e) => isUpcoming(e.date)),
    [events]
  );

   async function trackView(id: string) {
     await supabase.rpc('increment_views', { event_id: id });
   }

   async function trackShare(id: string) {
     await supabase.rpc('increment_shares', { event_id: id });
   }

   const [search, setSearch] = useState("");
   const [categoryFilter, setCategoryFilter] = useState("all");
   const [neighborhoodFilter, setNeighborhoodFilter] = useState("all");

   const neighborhoods = useMemo(() => {
     const set = new Set<string>();
     events.forEach(e => { if (e.address_neighborhood) set.add(e.address_neighborhood); });
     return Array.from(set).sort();
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
  }, [upcomingEvents]);

  const sortedDays = useMemo(
    () =>
      Object.entries(grouped)
        .sort(([, a], [, b]) => a.sortKey.localeCompare(b.sortKey))
        .map(([key]) => key),
    [grouped]
  );

  const today = new Date().toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <div className="min-h-screen bg-background">
      {/* Header clean */}
      <header className="border-b border-border bg-background">
        <div className="mx-auto max-w-4xl px-4 py-5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <Button
              size="icon"
              variant="ghost"
              onClick={() => navigate("/")}
              className="shrink-0"
              aria-label="Voltar à página inicial"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="min-w-0">
              <h1 className="text-2xl sm:text-3xl font-bold font-display text-foreground truncate">
                🌴 AgendIlha
              </h1>
              <p className="text-xs sm:text-sm text-muted-foreground mt-0.5 capitalize">
                {today}
              </p>
            </div>
           </div>
         </div>
       </header>

       <div className="bg-muted/30 border-b border-border">
         <div className="mx-auto max-w-4xl px-4 py-4">
           <div className="flex flex-col md:flex-row gap-3">
             <div className="relative flex-1">
               <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
               <Input
                 placeholder="Buscar eventos..."
                 className="pl-9 bg-background"
                 value={search}
                 onChange={(e) => setSearch(e.target.value)}
               />
             </div>
             <div className="flex gap-2">
               <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                 <SelectTrigger className="w-[140px] bg-background">
                   <SelectValue placeholder="Categoria" />
                 </SelectTrigger>
                 <SelectContent>
                   <SelectItem value="all">Categorias</SelectItem>
                   {Object.entries(categoryLabels).map(([k, v]) => (
                     <SelectItem key={k} value={k}>{v}</SelectItem>
                   ))}
                 </SelectContent>
               </Select>
               <Select value={neighborhoodFilter} onValueChange={setNeighborhoodFilter}>
                 <SelectTrigger className="w-[140px] bg-background">
                   <SelectValue placeholder="Bairro" />
                 </SelectTrigger>
                 <SelectContent>
                   <SelectItem value="all">Bairros</SelectItem>
                   {neighborhoods.map((n) => (
                     <SelectItem key={n} value={n}>{n}</SelectItem>
                   ))}
                 </SelectContent>
               </Select>
             </div>
           </div>
         </div>
       </div>

       {/* Content */}
       <main className="mx-auto max-w-4xl px-4 py-8">
        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : sortedDays.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground">
            <CalendarDays className="mx-auto h-12 w-12 mb-3 opacity-40" />
            <p className="text-lg font-medium">Nenhum evento aprovado disponível</p>
            <p className="text-sm mt-1">Volte em breve!</p>
          </div>
        ) : (
          <div className="space-y-10">
             {/* Highlights Carousel (Simples) */}
             {filteredEvents.some(e => e.is_highlight) && (
               <section className="mb-10">
                 <div className="flex items-center gap-2 mb-4">
                   <div className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
                   <h2 className="text-lg font-bold text-foreground">Destaques AgendIlha</h2>
                 </div>
                 <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar">
                   {filteredEvents.filter(e => e.is_highlight).map(ev => (
                     <Card key={ev.id} className="min-w-[280px] border-amber-500/30 bg-amber-500/5 hover:bg-amber-500/10 transition-colors cursor-pointer" onClick={() => trackView(ev.id)}>
                       <CardContent className="p-4">
                         <Badge className="mb-2 bg-amber-500 hover:bg-amber-600 text-white border-0">DESTAQUE</Badge>
                         <h3 className="font-bold text-lg leading-tight line-clamp-1">{ev.event_title}</h3>
                         <div className="mt-2 space-y-1 text-sm text-muted-foreground">
                           <div className="flex items-center gap-1.5">
                             <CalendarDays className="h-3.5 w-3.5" />
                             <span>{ev.date} • {ev.start_time}</span>
                           </div>
                           <div className="flex items-center gap-1.5">
                             <MapPin className="h-3.5 w-3.5" />
                             <span className="line-clamp-1">{ev.location}</span>
                           </div>
                         </div>
                       </CardContent>
                     </Card>
                   ))}
                 </div>
               </section>
             )}

            <div className="flex items-center justify-end">
              <Button
                size="sm"
                variant="outline"
                className="text-xs"
                disabled={upcomingEvents.length === 0}
                 onClick={() => {
                   exportEditorialAgendaPdf(upcomingEvents as any, "Agenda Cultural da Ilha");
                   toast.success(`PDF da agenda gerado com ${upcomingEvents.length} evento(s)!`);
                 }}
              >
                <FileDown className="h-3.5 w-3.5 mr-1.5" />
                Baixar PDF da Agenda
              </Button>
            </div>
            {sortedDays.map((dayKey) => (
              <section key={dayKey}>
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <CalendarDays className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-foreground">
                      {grouped[dayKey].label}
                    </h2>
                  </div>
                </div>

                <div className="space-y-3 pl-4 border-l-2 border-primary/20">
                  {grouped[dayKey].items.map((ev) => {
                    const icon = categoryIcons[ev.category || ""] || "📌";
                    return (
                      <Card
                        key={ev.id}
                        className="overflow-hidden border-border hover:shadow-md transition-shadow"
                      >
                        <CardContent className="p-4 sm:p-5">
                          <div className="flex items-start gap-3">
                            <span className="text-2xl mt-0.5">{icon}</span>
                            <div className="flex-1 min-w-0">
                              {ev.category && (
                                <Badge variant="secondary" className="text-xs mb-1.5">
                                  {categoryLabels[ev.category] || ev.category}
                                </Badge>
                              )}

                              <h3 className="text-base sm:text-lg font-bold text-foreground leading-tight">
                                {ev.event_title}
                              </h3>

                              <div className="mt-2 space-y-1 text-sm text-muted-foreground">
                                {ev.start_time && (
                                  <div className="flex items-center gap-2">
                                    <Clock className="h-4 w-4 text-primary shrink-0" />
                                    <span>
                                      ⏰ {ev.start_time}
                                      {ev.end_time && ` às ${ev.end_time}`}
                                      {" – "}
                                      {ev.event_title}
                                    </span>
                                  </div>
                                )}
                                {(ev.location || ev.address_street) && (
                                  <div className="flex items-center gap-2">
                                    <MapPin className="h-4 w-4 text-primary shrink-0" />
                                    <span>📍 {buildFullAddress(ev)}</span>
                                  </div>
                                )}
                              </div>

                              {ev.description && (
                                <p className="mt-2 text-sm text-foreground/80 line-clamp-2">
                                  {ev.description}
                                </p>
                              )}

                              <div className="mt-3 flex flex-wrap items-center gap-2">
                                {(ev.location || ev.address_street) && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="text-xs"
                                    onClick={() =>
                                      window.open(buildGoogleMapsUrl(ev), "_blank")
                                    }
                                  >
                                    <ExternalLink className="h-3.5 w-3.5 mr-1" />
                                    Ver no mapa
                                  </Button>
                                )}
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="text-xs"
                                   onClick={() => {
                                     trackShare(ev.id);
                                     window.open(buildWhatsAppShare(ev), "_blank");
                                   }}
                                >
                                  <Share2 className="h-3.5 w-3.5 mr-1" />
                                  Compartilhar no WhatsApp
                                </Button>
                                {ev.company_name && (
                                  <span className="text-xs text-muted-foreground ml-auto truncate max-w-[150px]">
                                    por {ev.company_name}
                                  </span>
                                )}
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

      {/* Footer */}
      <footer className="text-center py-8 text-sm text-muted-foreground border-t border-border">
        🌴 AgendIlha – sua agenda cultural da Ilha do Governador
      </footer>
    </div>
  );
}

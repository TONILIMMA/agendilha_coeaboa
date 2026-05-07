import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
 import { Loader2, MapPin, Clock, Share2, CalendarDays, FileDown, Search, Filter } from "lucide-react";
import { formatDateWithWeekday } from "@/lib/dateUtils";
import { exportBulkEventsPdf } from "@/lib/pdfExport";
import { toast } from "sonner";

const categoryLabels: Record<string, string> = {
  musica: "🎵 Música / Show",
  gastronomia: "🍽️ Gastronomia",
  cultura: "🎨 Cultura / Arte",
  esporte: "⚽ Esporte",
  promocoes: "🏷️ Promoções",
  outros: "📌 Outros",
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
  description: string | null;
  category: string | null;
  company_name: string | null;
  phone: string | null;
   is_highlight: boolean;
}

function formatDateLabel(dateStr: string | null): string {
  if (!dateStr) return "";
  // The date from the DB could be DD/MM/YYYY or YYYY-MM-DD
  const withWeekday = formatDateWithWeekday(dateStr);
  if (withWeekday !== dateStr) return withWeekday;
  // Fallback: try parsing YYYY-MM-DD for display
  try {
    const [y, m, d] = dateStr.split("-").map(Number);
    const date = new Date(y, m - 1, d);
    const formatted = date.toLocaleDateString("pt-BR", {
      day: "numeric",
      month: "long",
    });
    const weekday = date.toLocaleDateString("pt-BR", { weekday: "long" });
    return `${formatted} (${weekday})`;
  } catch {
    return dateStr;
  }
}

function buildWhatsAppShare(event: Event) {
  const time = event.start_time
    ? `${event.start_time}${event.end_time ? ` às ${event.end_time}` : ""}`
    : "";
  const msg = `🗓️ *${event.event_title}*\n${time ? `🕒 ${time}\n` : ""}${event.location ? `📍 ${event.location}\n` : ""}${event.description ? `\n${event.description}\n` : ""}\n📲 Veja mais: https://agendilha-divulgacao.lovable.app/coeaboa`;
  return `https://wa.me/?text=${encodeURIComponent(msg)}`;
}

export default function CoeABoa() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

   const [search, setSearch] = useState("");
   const [categoryFilter, setCategoryFilter] = useState("all");
   const [neighborhoodFilter, setNeighborhoodFilter] = useState("all");

   async function trackView(id: string) {
     await supabase.rpc('increment_views', { event_id: id });
   }

   async function trackShare(id: string) {
     await supabase.rpc('increment_shares', { event_id: id });
   }

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from("submissions")
        .select("id, event_title, date, start_time, end_time, location, address_neighborhood, description, category, company_name, phone, is_highlight")
        .eq("status", "approved")
        .order("date", { ascending: true, nullsFirst: false });
      setEvents((data as Event[]) || []);
      setLoading(false);
    }
    load();
  }, []);

   const neighborhoods = Array.from(new Set(events.map(e => e.address_neighborhood).filter(Boolean))).sort();

   const filteredEvents = events.filter(ev => {
     const matchSearch = ev.event_title.toLowerCase().includes(search.toLowerCase()) || 
                         (ev.description || "").toLowerCase().includes(search.toLowerCase());
     const matchCat = categoryFilter === "all" || ev.category === categoryFilter;
     const matchNeigh = neighborhoodFilter === "all" || ev.address_neighborhood === neighborhoodFilter;
     return matchSearch && matchCat && matchNeigh;
   });

  // Group events by date
  const grouped = filteredEvents.reduce<Record<string, Event[]>>((acc, ev) => {
    const key = ev.date || "sem-data";
    if (!acc[key]) acc[key] = [];
    acc[key].push(ev);
    return acc;
  }, {});

  const today = new Date().toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <div className="bg-primary text-primary-foreground py-8 px-4 text-center">
        <h1 className="text-3xl sm:text-4xl font-bold font-display">Coé a Boa? 🤙</h1>
        <p className="mt-2 text-sm opacity-90 capitalize">{today}</p>
        <p className="mt-1 text-xs opacity-75">Agenda de eventos da Ilha do Governador</p>
        {events.length > 0 && (
          <Button
            size="sm"
            variant="secondary"
            className="mt-4 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
            onClick={() => {
              try {
                exportBulkEventsPdf(events);
                toast.success("📄 Agenda exportada em PDF!");
              } catch (err: any) {
                toast.error("Falha ao gerar PDF", { description: err?.message });
              }
            }}
          >
            <FileDown className="h-4 w-4 mr-1" />
            Baixar Agenda em PDF
          </Button>
        )}
      </div>

       <div className="bg-muted/30 border-b border-border py-4 px-4">
         <div className="mx-auto max-w-3xl flex flex-col md:flex-row gap-3">
           <div className="relative flex-1">
             <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
             <Input
               placeholder="O que você procura?"
               className="pl-9 bg-background"
               value={search}
               onChange={(e) => setSearch(e.target.value)}
             />
           </div>
           <div className="flex gap-2">
             <Select value={categoryFilter} onValueChange={setCategoryFilter}>
               <SelectTrigger className="w-full md:w-[140px] bg-background">
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
               <SelectTrigger className="w-full md:w-[140px] bg-background">
                 <SelectValue placeholder="Bairro" />
               </SelectTrigger>
               <SelectContent>
                 <SelectItem value="all">Bairros</SelectItem>
                 {neighborhoods.map((n) => (
                   <SelectItem key={n!} value={n!}>{n}</SelectItem>
                 ))}
               </SelectContent>
             </Select>
           </div>
         </div>
       </div>

       <div className="mx-auto max-w-3xl px-4 py-6">
         {/* Destaques */}
         {filteredEvents.some(e => e.is_highlight) && (
           <div className="mb-10">
             <div className="flex items-center gap-2 mb-4">
               <div className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
               <h2 className="text-lg font-bold">Destaques da Ilha</h2>
             </div>
             <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
               {filteredEvents.filter(e => e.is_highlight).map(ev => (
                 <Card key={ev.id} className="border-amber-500/30 bg-amber-500/5 hover:bg-amber-500/10 transition-all cursor-pointer" onClick={() => { trackView(ev.id); }}>
                   <CardContent className="p-4">
                     <Badge className="mb-2 bg-amber-500 text-white border-0">DESTAQUE 🔥</Badge>
                     <h3 className="font-bold text-base leading-tight">{ev.event_title}</h3>
                     <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{ev.location} • {ev.date}</p>
                   </CardContent>
                 </Card>
               ))}
             </div>
           </div>
         )}

        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : events.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground">
            <CalendarDays className="mx-auto h-12 w-12 mb-3 opacity-40" />
            <p className="text-lg font-medium">Nenhum evento cadastrado ainda</p>
            <p className="text-sm mt-1">Volte em breve!</p>
          </div>
        ) : (
          Object.entries(grouped).map(([dateKey, dateEvents]) => (
            <div key={dateKey} className="mb-8">
              <div className="flex items-center gap-2 mb-4">
                <CalendarDays className="h-5 w-5 text-primary" />
                <h2 className="text-lg font-bold text-foreground capitalize">
                  {dateKey === "sem-data" ? "Data a confirmar" : formatDateLabel(dateKey)}
                </h2>
              </div>

              <div className="space-y-4">
                {dateEvents.map((ev) => (
                  <Card key={ev.id} className="overflow-hidden border-border hover:shadow-md transition-shadow">
                    <CardContent className="p-4 sm:p-5">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          {ev.category && (
                            <Badge variant="secondary" className="text-xs mb-2">
                              {categoryLabels[ev.category] || ev.category}
                            </Badge>
                          )}
                          <h3 className="text-base sm:text-lg font-bold text-foreground leading-tight">
                            {ev.event_title}
                          </h3>
                        </div>
                      </div>

                      <div className="mt-3 space-y-1.5 text-sm text-muted-foreground">
                        {ev.start_time && (
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-primary shrink-0" />
                            <span>
                              {ev.start_time}
                              {ev.end_time && ` às ${ev.end_time}`}
                            </span>
                          </div>
                        )}
                        {ev.location && (
                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4 text-primary shrink-0" />
                            <span>
                              {ev.location}
                              {ev.address_neighborhood && ` — ${ev.address_neighborhood}`}
                            </span>
                          </div>
                        )}
                      </div>

                      {ev.description && (
                        <p className="mt-3 text-sm text-foreground/80 line-clamp-3">
                          {ev.description}
                        </p>
                      )}

                      <div className="mt-4 flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-xs"
                          onClick={() => window.open(buildWhatsAppShare(ev), "_blank")}
                        >
                          <Share2 className="h-3.5 w-3.5 mr-1" />
                          Compartilhar
                        </Button>
                        {ev.company_name && (
                          <span className="text-xs text-muted-foreground ml-auto truncate max-w-[150px]">
                            por {ev.company_name}
                          </span>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ))
        )}
      </div>

      <footer className="text-center py-6 text-xs text-muted-foreground border-t border-border">
        📌 AgendIlha — Sua agenda de eventos da Ilha do Governador
      </footer>
    </div>
  );
}
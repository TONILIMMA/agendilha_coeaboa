import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, MapPin, Clock, Share2, CalendarDays, ExternalLink, ArrowLeft, FileDown } from "lucide-react";
import { exportBulkEventsPdf } from "@/lib/pdfExport";
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

  const grouped = useMemo(() => {
    const map: Record<string, { label: string; sortKey: string; items: Event[] }> = {};
    for (const ev of upcomingEvents) {
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
      {/* Header */}
      <header className="bg-primary text-primary-foreground">
        <div className="mx-auto max-w-4xl px-4 py-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Button
              size="icon"
              variant="ghost"
              onClick={() => navigate("/")}
              className="text-primary-foreground hover:bg-primary-foreground/15 shrink-0"
              aria-label="Voltar à página inicial"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="text-center sm:text-left">
            <h1 className="text-3xl sm:text-4xl font-bold font-display">
              🌴 AgendIlha
            </h1>
            <p className="text-sm opacity-90 mt-1">
              Agenda Cultural da Ilha do Governador
            </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <a
              href="https://instagram.com/agendilha"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-sm font-medium bg-primary-foreground/15 hover:bg-primary-foreground/25 rounded-full px-4 py-2 transition-colors"
            >
              📸 @agendilha
            </a>
            <a
              href="https://chat.whatsapp.com/agendilha"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-sm font-medium bg-primary-foreground/15 hover:bg-primary-foreground/25 rounded-full px-4 py-2 transition-colors"
            >
              💬 WhatsApp
            </a>
          </div>
        </div>
      </header>

      {/* Subtitle bar */}
      <div className="bg-accent/50 border-b border-border">
        <div className="mx-auto max-w-4xl px-4 py-3 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
          <CalendarDays className="h-4 w-4 text-primary" />
          <span className="font-medium text-foreground">Próximos eventos</span>
          <span className="mx-1">·</span>
          <span className="capitalize">{today}</span>
          <Badge variant="secondary" className="text-xs">{upcomingEvents.length} evento(s)</Badge>
          <Button
            size="sm"
            variant="outline"
            className="ml-auto text-xs"
            disabled={loading || upcomingEvents.length === 0}
            onClick={() => {
              if (upcomingEvents.length === 0) {
                toast.error("Nenhum evento aprovado para exportar.");
                return;
              }
              exportBulkEventsPdf(upcomingEvents as any);
              toast.success(`PDF da agenda gerado com ${upcomingEvents.length} evento(s)!`);
            }}
          >
            <FileDown className="h-3.5 w-3.5 mr-1.5" />
            Baixar PDF da Agenda
          </Button>
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
                                  onClick={() =>
                                    window.open(buildWhatsAppShare(ev), "_blank")
                                  }
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

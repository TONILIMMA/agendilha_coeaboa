import { useMemo, useState } from "react";
import { Sparkles, CalendarDays, MapPin, Clock, ChevronRight } from "lucide-react";

import { useAgendaData } from "@/hooks/useAgendaData";
import { SectionErrorBoundary } from "@/components/errors/SectionErrorBoundary";
import { EventDetailDialog } from "@/components/agenda/EventDetailDialog";
import { AgendaListSkeleton } from "@/components/agenda/AgendaListSkeleton";
import { formatBrazilianDate } from "@/lib/date-utils";
import { getShareData, getShareUrl } from "@/lib/sharing";
import type { AgendaEvent } from "@/components/agenda/types";
import { toast } from "sonner";

export default function CoeABoa() {
  return (
    <SectionErrorBoundary context="CoeABoa">
      <CoeABoaInner />
    </SectionErrorBoundary>
  );
}

function CoeABoaInner() {
  const { events, loading, trackView, trackShare } = useAgendaData();
  const [shareData, setShareData] = useState<{
    title: string;
    text: string;
    url: string;
    eventId?: string;
  } | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<AgendaEvent | null>(null);

  // Ordena por data do evento — mais próximos primeiro.
  const sortedEvents = useMemo(() => {
    const list = Array.isArray(events) ? [...events] : [];
    return list.sort((a, b) => {
      const da = a.date ? new Date(a.date).getTime() : Number.POSITIVE_INFINITY;
      const db = b.date ? new Date(b.date).getTime() : Number.POSITIVE_INFINITY;
      return da - db;
    });
  }, [events]);

  const openEvent = (ev: AgendaEvent) => {
    setSelectedEvent(ev);
    trackView(ev.id);
  };

  const handleShare = (title: string, text: string, url: string, eventId?: string) =>
    setShareData({ title, text, url, eventId });

  const handleCopyLink = (url: string) => {
    navigator.clipboard.writeText(url);
    toast.success("Link copiado!");
  };

  return (
    <div className="min-h-screen bg-background">
      <main className="mx-auto max-w-3xl px-4 py-8 sm:py-12">
        <header className="mb-8">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0 shadow-sm border border-primary/5">
              <Sparkles className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-black tracking-tight text-foreground">Coé a Boa?</h1>
              <p className="text-sm text-muted-foreground font-medium">
                Eventos e sugestões culturais, dos mais próximos pros mais distantes.
              </p>
            </div>
          </div>
        </header>

        {loading ? (
          <AgendaListSkeleton />
        ) : sortedEvents.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-center py-20 space-y-3">
            <Sparkles className="h-12 w-12 text-muted-foreground/30" />
            <p className="text-lg font-bold text-foreground">Nada rolando por aqui ainda</p>
            <p className="text-sm text-muted-foreground">
              Assim que novos rolês forem publicados, eles aparecem nesta lista.
            </p>
          </div>
        ) : (
          <ul className="space-y-3">
            {sortedEvents.map((ev) => (
              <li key={ev.id}>
                <button
                  type="button"
                  onClick={() => openEvent(ev)}
                  className="w-full text-left rounded-2xl ring-1 ring-foreground/[0.08] bg-card hover:bg-muted/40 transition-colors p-4 flex items-start gap-4 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                >
                  <div className="flex-1 min-w-0 space-y-1.5">
                    <p className="font-bold text-base text-foreground leading-tight">
                      {ev.event_title}
                    </p>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground font-medium">
                      {ev.date && (
                        <span className="inline-flex items-center gap-1.5">
                          <CalendarDays className="h-3.5 w-3.5" />
                          {formatBrazilianDate(ev.date)}
                        </span>
                      )}
                      {ev.start_time && (
                        <span className="inline-flex items-center gap-1.5">
                          <Clock className="h-3.5 w-3.5" />
                          {ev.start_time}
                          {ev.end_time ? ` — ${ev.end_time}` : ""}
                        </span>
                      )}
                      {ev.location && (
                        <span className="inline-flex items-center gap-1.5 min-w-0">
                          <MapPin className="h-3.5 w-3.5 shrink-0" />
                          <span className="truncate">{ev.location}</span>
                        </span>
                      )}
                    </div>
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </main>

      <EventDetailDialog
        event={selectedEvent}
        onClose={() => setSelectedEvent(null)}
        onShare={handleShare}
        onCopyLink={handleCopyLink}
        trackShare={trackShare}
      />
    </div>
  );
}

import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  addDays,
  endOfDay,
  format,
  isToday,
  isTomorrow,
  nextSaturday,
  nextSunday,
  parseISO,
  startOfDay,
} from "date-fns";
import { ptBR } from "date-fns/locale";
import { ChevronLeft, ChevronRight, ShoppingBasket, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";

import Header from "@/components/Header";
import { DiscoveryEventCard } from "@/components/DiscoveryEventCard";
import { ShareDialog } from "@/components/ShareDialog";
import { SectionErrorBoundary } from "@/components/errors/SectionErrorBoundary";
import { InlineError } from "@/components/errors/InlineError";
import { Button } from "@/components/ui/button";
import { SeoHead } from "@/components/seo/SeoHead";
import { supabase } from "@/integrations/supabase/client";
import { getEventFallbackImage } from "@/lib/event-utils";
import { getShareData } from "@/lib/sharing";
import { cn } from "@/lib/utils";

type DateFilter = "today" | "tomorrow" | "weekend" | "next7";

interface CuratedEvent {
  id: string;
  event_title: string;
  date: string | null;
  start_time: string | null;
  location: string | null;
  address_neighborhood: string | null;
  address_street: string | null;
  category: string | null;
  description: string | null;
  end_time: string | null;
  image_url: string | null;
  age_rating: string | null;
  is_suitable_for_minors: boolean | null;
  slug: string | null;
  is_highlight: boolean | null;
  highlight_active: boolean | null;
}

const filters: Array<{ id: DateFilter; label: string }> = [
  { id: "today", label: "Hoje" },
  { id: "tomorrow", label: "Amanhã" },
  { id: "weekend", label: "Fim de semana" },
  { id: "next7", label: "Próximos 7 dias" },
];

function matchesDate(date: string | null, filter: DateFilter): boolean {
  if (!date) return false;
  const parsed = parseISO(date);
  if (Number.isNaN(parsed.getTime())) return false;

  const now = new Date();
  if (filter === "today") return isToday(parsed);
  if (filter === "tomorrow") return isTomorrow(parsed);
  if (filter === "next7") {
    return parsed >= startOfDay(now) && parsed <= endOfDay(addDays(now, 7));
  }

  const saturday = startOfDay(nextSaturday(now));
  const sunday = endOfDay(nextSunday(now));
  return parsed >= saturday && parsed <= sunday;
}

function CuradoriaHojeInner() {
  const navigate = useNavigate();
  const [dateFilter, setDateFilter] = useState<DateFilter>("today");
  const [activeSlide, setActiveSlide] = useState(0);
  const [shareData, setShareData] = useState<{
    title: string;
    text: string;
    url: string;
    eventId?: string;
  } | null>(null);
  const [favorites, setFavorites] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem("agendilha_favorites");
      const parsed = stored ? JSON.parse(stored) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  });

  const { data: events = [], isLoading, error, refetch } = useQuery({
    queryKey: ["curadoria-hoje-events"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("public_submissions")
        .select("id, event_title, date, start_time, end_time, location, address_street, address_neighborhood, category, description, image_url, age_rating, is_suitable_for_minors, slug, is_highlight, highlight_active")
        .eq("status", "aprovado")
        .order("date", { ascending: true })
        .order("start_time", { ascending: true });

      if (error) throw error;
      return (data ?? []) as CuratedEvent[];
    },
  });

  const visibleEvents = useMemo(
    () => events.filter((event) => matchesDate(event.date, dateFilter)),
    [dateFilter, events],
  );

  const featuredEvents = useMemo(() => {
    return [...visibleEvents]
      .sort((a, b) => Number(Boolean(b.highlight_active || b.is_highlight)) - Number(Boolean(a.highlight_active || a.is_highlight)))
      .slice(0, 6);
  }, [visibleEvents]);

  useEffect(() => setActiveSlide(0), [dateFilter]);

  const currentFeature = featuredEvents[activeSlide];
  const selectedLabel = filters.find((item) => item.id === dateFilter)?.label ?? "Hoje";

  const openEvent = (event: CuratedEvent) => navigate(`/evento/${event.slug || event.id}`);

  const toggleFavorite = (id: string) => {
    setFavorites((current) => {
      const next = current.includes(id) ? current.filter((item) => item !== id) : [...current, id];
      try {
        localStorage.setItem("agendilha_favorites", JSON.stringify(next));
        window.dispatchEvent(new Event("agendilha:favorites"));
      } catch {
        // Mantém a seleção em memória quando o armazenamento não está disponível.
      }
      return next;
    });
  };

  const changeSlide = (direction: -1 | 1) => {
    if (featuredEvents.length < 2) return;
    setActiveSlide((current) => (current + direction + featuredEvents.length) % featuredEvents.length);
  };

  return (
    <div className="min-h-screen bg-background text-foreground antialiased">
      <SeoHead
        title="Hoje na Ilha — Coé a Boa?"
        description="Veja a curadoria de eventos de hoje na Ilha do Governador, com destaques e programação completa."
        path="/hoje"
      />
      <Header />

      <main className="mx-auto max-w-6xl px-4 pb-16 pt-24 sm:px-6 sm:pb-24 sm:pt-32">
        <header className="mb-6 sm:mb-8">
          <p className="mb-2 text-xs font-bold uppercase text-secondary">
            {format(new Date(), "EEEE, d 'de' MMMM", { locale: ptBR })}
          </p>
          <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
            <div>
              <h1 className="text-3xl font-bold leading-tight sm:text-5xl">Hoje na Ilha</h1>
              <p className="mt-2 max-w-xl text-sm text-muted-foreground sm:text-base">
                A curadoria do que tá rolando, do primeiro programa ao último show.
              </p>
            </div>
            <span className="text-sm font-semibold text-secondary">
              {visibleEvents.length} {visibleEvents.length === 1 ? "rolê" : "rolês"}
            </span>
          </div>
        </header>

        <nav aria-label="Filtrar eventos por data" className="-mx-4 mb-7 overflow-x-auto px-4 pb-2 scrollbar-none sm:mx-0 sm:px-0">
          <div className="flex w-max gap-2">
            {filters.map((item) => (
              <Button
                key={item.id}
                type="button"
                variant={dateFilter === item.id ? "default" : "outline"}
                onClick={() => setDateFilter(item.id)}
                className="h-10 shrink-0 rounded-full px-5 text-sm font-semibold"
                aria-pressed={dateFilter === item.id}
              >
                {item.label}
              </Button>
            ))}
          </div>
        </nav>

        {isLoading ? (
          <div className="mb-8 aspect-[16/9] w-full animate-pulse rounded-2xl bg-muted sm:aspect-[21/9]" />
        ) : error ? (
          <InlineError
            error={error}
            title="Não deu pra carregar a curadoria agora."
            description="Confere tua conexão e tenta de novo."
            onRetry={() => refetch()}
          />
        ) : currentFeature ? (
          <section aria-labelledby="destaques-heading" className="mb-8">
            <div className="mb-3 flex items-center justify-between">
              <h2 id="destaques-heading" className="text-lg font-bold sm:text-2xl">Destaques</h2>
              {featuredEvents.length > 1 && (
                <div className="flex gap-2">
                  <Button variant="outline" size="icon" className="h-9 w-9 rounded-full" onClick={() => changeSlide(-1)} aria-label="Destaque anterior">
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="icon" className="h-9 w-9 rounded-full" onClick={() => changeSlide(1)} aria-label="Próximo destaque">
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={() => openEvent(currentFeature)}
              className="group relative block aspect-[16/9] w-full overflow-hidden rounded-2xl bg-muted text-left shadow-elevated outline-none ring-offset-background transition-transform duration-300 hover:-translate-y-0.5 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 sm:aspect-[21/9]"
            >
              <img
                src={currentFeature.image_url || getEventFallbackImage(currentFeature.category)}
                alt={currentFeature.event_title || "Evento em destaque"}
                className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.02] motion-reduce:transition-none"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-foreground/90 via-foreground/25 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-5 text-background sm:p-8">
                <span className="mb-2 inline-flex rounded bg-accent px-2 py-1 text-[10px] font-bold uppercase text-accent-foreground">
                  Destaque
                </span>
                <h3 className="max-w-3xl text-xl font-bold leading-tight sm:text-4xl">
                  {currentFeature.event_title || "Rolê na Ilha"}
                </h3>
                <p className="mt-2 text-xs text-background/80 sm:text-sm">
                  {[currentFeature.location, currentFeature.start_time].filter(Boolean).join(" • ")}
                </p>
              </div>
            </button>

            {featuredEvents.length > 1 && (
              <div className="mt-3 flex justify-center gap-2" aria-label="Escolher destaque">
                {featuredEvents.map((event, index) => (
                  <Button
                    key={event.id}
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => setActiveSlide(index)}
                    className="h-7 w-7 rounded-full p-0"
                    aria-label={`Ir para destaque ${index + 1}`}
                    aria-current={activeSlide === index ? "true" : undefined}
                  >
                    <span className={cn("h-1.5 rounded-full transition-all", activeSlide === index ? "w-5 bg-primary" : "w-1.5 bg-muted-foreground/30")} />
                  </Button>
                ))}
              </div>
            )}
          </section>
        ) : null}

        {!error && !isLoading && (
          <>
            <aside className="relative mb-9 overflow-hidden rounded-2xl border border-accent/40 bg-muted p-4 sm:p-5" aria-label="Publicidade da Mercearia do Tio João">
              <span className="absolute right-3 top-2 text-[9px] font-bold uppercase text-muted-foreground">Publicidade</span>
              <div className="flex items-center gap-4 pr-14">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-secondary text-secondary-foreground">
                  <ShoppingBasket className="h-5 w-5" aria-hidden="true" />
                </div>
                <div>
                  <h2 className="text-sm font-bold sm:text-base">Mercearia do Tio João</h2>
                  <p className="mt-0.5 text-xs italic text-muted-foreground sm:text-sm">
                    Qualidade de família para a sua mesa
                  </p>
                </div>
              </div>
            </aside>

            <section aria-labelledby="programacao-heading">
              <div className="mb-5 flex items-end justify-between gap-3">
                <div>
                  <p className="text-xs font-bold uppercase text-secondary">Programação</p>
                  <h2 id="programacao-heading" className="mt-1 text-xl font-bold sm:text-3xl">{selectedLabel} na Ilha</h2>
                </div>
              </div>

              {visibleEvents.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-border bg-muted/30 px-6 py-12 text-center">
                  <Sparkles className="mx-auto mb-3 h-8 w-8 text-secondary" />
                  <h3 className="font-bold">Nada marcado por aqui ainda.</h3>
                  <p className="mt-1 text-sm text-muted-foreground">Escolha outra data pra descobrir mais rolês.</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-5 lg:grid-cols-4">
                  {visibleEvents.map((event) => (
                    <DiscoveryEventCard
                      key={event.id}
                      event={event}
                      variant="compact"
                      className="h-auto w-full"
                      onClick={() => openEvent(event)}
                      isFavorite={favorites.includes(event.id)}
                      onFavoriteToggle={() => toggleFavorite(event.id)}
                      onShare={() => {
                        const data = getShareData(event);
                        setShareData({ ...data, eventId: event.id });
                      }}
                    />
                  ))}
                </div>
              )}
            </section>
          </>
        )}
      </main>

      {shareData && (
        <ShareDialog
          open={Boolean(shareData)}
          onOpenChange={(open) => !open && setShareData(null)}
          title={shareData.title}
          text={shareData.text}
          url={shareData.url}
        />
      )}
    </div>
  );
}

export default function CuradoriaHoje() {
  return (
    <SectionErrorBoundary context="CuradoriaHoje">
      <CuradoriaHojeInner />
    </SectionErrorBoundary>
  );
}
import { useState, useMemo, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useProfile } from "@/hooks/useProfile";
import { useDivulgadorStatus } from "@/hooks/useDivulgadorStatus";
import { useFavorites } from "@/hooks/useFavorites";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ArrowUpDown,
  CalendarDays,
  Copy,
  FileDown,
  Heart,
  Info,
  MapPin,
  Megaphone,
  MessageCircle,
  Music as MusicIcon,
  Play,
  Search,
  Settings2,
  Sparkles,
  Trophy,
  Users,
  Video,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Onboarding } from "@/components/Onboarding";
import { PersonalizationDialog } from "@/components/PersonalizationDialog";
import { ShareDialog } from "@/components/ShareDialog";
import ArtistCard from "@/components/ArtistCard";
import { formatBrazilianDate } from "@/lib/date-utils";
import { exportEditorialAgendaPdf } from "@/lib/pdfExport";
import { getShareUrl } from "@/lib/sharing";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

import { useAgendaData } from "@/hooks/useAgendaData";
import { categoryLabels, type AgendaEvent } from "@/components/agenda/types";
import { SectionErrorBoundary } from "@/components/errors/SectionErrorBoundary";
import {
  buildWhatsAppShare,
  formatDayLabel,
  parseDateToObj,
} from "@/components/agenda/agenda-utils";
import { RecommendationCard } from "@/components/agenda/RecommendationCard";
import { HighlightCard } from "@/components/agenda/HighlightCard";
import { DayEventCard } from "@/components/agenda/DayEventCard";
import { EventDetailDialog } from "@/components/agenda/EventDetailDialog";

export default function AgendaCultural() {
  return (
    <SectionErrorBoundary context="AgendaCultural">
      <AgendaCulturalInner />
    </SectionErrorBoundary>
  );
}

function AgendaCulturalInner() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { profile } = useProfile();
  const { isDivulgador } = useDivulgadorStatus();
  const { favorites, isFavorite } = useFavorites();

  const {
    events,
    loading,
    trackView,
    trackShare,
    initialEventId,
    clearInitialEventId,
  } = useAgendaData();

  // Share state
  const [shareData, setShareData] = useState<{
    title: string;
    text: string;
    url: string;
    eventId?: string;
  } | null>(null);
  const handleShare = (title: string, text: string, url: string, eventId?: string) =>
    setShareData({ title, text, url, eventId });
  const handleCopyLink = (url: string) => {
    navigator.clipboard.writeText(url);
    toast.success("Link copiado!");
  };

  // UI state
  const [personalizationOpen, setPersonalizationOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<AgendaEvent | null>(null);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<"events" | "artists">("events");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [neighborhoodFilter, setNeighborhoodFilter] = useState("all");
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">(() => {
    const saved = localStorage.getItem("agendilha_sort_order");
    return saved === "desc" ? "desc" : "asc";
  });

  useEffect(() => {
    localStorage.setItem("agendilha_sort_order", sortOrder);
  }, [sortOrder]);

  // Read URL params on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("view") === "favorites") setShowFavoritesOnly(true);
    const category = params.get("category");
    if (category) setCategoryFilter(category);
  }, []);

  // Open initial event from URL once data is loaded
  useEffect(() => {
    if (!initialEventId) return;
    const ev = events.find((e) => e.id === initialEventId);
    if (ev) {
      setSelectedEvent(ev);
      trackView(ev.id);
      clearInitialEventId();
    }
  }, [initialEventId, events, trackView, clearInitialEventId]);

  // Artists
  const { data: artists } = useQuery({
    queryKey: ["artists-approved"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("public_artist_profiles")
        .select(`*, artist_media (*)`)
        .eq("is_approved", true)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const shortVideos = useMemo(() => {
    const allVideos: any[] = [];
    artists?.forEach((artist) => {
      artist.artist_media?.forEach((m: any) => {
        if (m.media_type === "video") allVideos.push({ ...m, artist });
      });
    });
    return allVideos.sort(() => Math.random() - 0.5);
  }, [artists]);

  // Derived data
  const neighborhoods = useMemo(() => {
    const set = new Set<string>();
    events.forEach((e) => {
      if (e.address_neighborhood) set.add(e.address_neighborhood);
    });
    return Array.from(set).sort();
  }, [events]);

  const upcomingEvents = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return events.filter((e) => {
      const d = parseDateToObj(e.date);
      return !d || d >= today;
    });
  }, [events]);

  const filteredEvents = useMemo(() => {
    return upcomingEvents.filter((ev) => {
      const term = search.toLowerCase();
      const matchSearch =
        ev.event_title.toLowerCase().includes(term) ||
        (ev.description || "").toLowerCase().includes(term);
      const matchCat = categoryFilter === "all" || ev.category === categoryFilter;
      const matchNeigh =
        neighborhoodFilter === "all" || ev.address_neighborhood === neighborhoodFilter;
      const matchFav = !showFavoritesOnly || isFavorite(ev.id);
      return matchSearch && matchCat && matchNeigh && matchFav;
    });
  }, [
    upcomingEvents,
    search,
    categoryFilter,
    neighborhoodFilter,
    showFavoritesOnly,
    favorites,
    isFavorite,
  ]);

  const nearYouEvents = useMemo(() => {
    const userNeighborhood = profile?.home_location || profile?.address_neighborhood;
    if (!userNeighborhood) return [];
    return upcomingEvents.filter((ev) => ev.address_neighborhood === userNeighborhood).slice(0, 4);
  }, [upcomingEvents, profile]);

  const recommendedEvents = useMemo(() => {
    const prefs = profile?.musical_preferences || [];
    if (prefs.length === 0) return [];
    return upcomingEvents
      .filter((ev) =>
        prefs.some(
          (p) =>
            ev.category?.toLowerCase().includes(p.toLowerCase()) ||
            ev.description?.toLowerCase().includes(p.toLowerCase()),
        ),
      )
      .slice(0, 4);
  }, [upcomingEvents, profile]);

  const trendingEvents = useMemo(
    () =>
      [...upcomingEvents]
        .sort((a, b) => (b.views_count || 0) - (a.views_count || 0))
        .slice(0, 4),
    [upcomingEvents],
  );

  const grouped = useMemo(() => {
    const map: Record<string, { label: string; sortKey: string; items: AgendaEvent[] }> = {};
    for (const ev of filteredEvents) {
      const d = parseDateToObj(ev.date);
      const key = d
        ? `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
        : "sem-data";
      if (!map[key]) {
        map[key] = {
          label: formatBrazilianDate(ev.date) || formatDayLabel(ev.date),
          sortKey: key === "sem-data" ? "9999-99-99" : key,
          items: [],
        };
      }
      map[key].items.push(ev);
    }
    return map;
  }, [filteredEvents]);

  const sortedDays = useMemo(
    () =>
      Object.entries(grouped)
        .sort(([, a], [, b]) =>
          sortOrder === "asc" ? a.sortKey.localeCompare(b.sortKey) : b.sortKey.localeCompare(a.sortKey),
        )
        .map(([key]) => key),
    [grouped, sortOrder],
  );

  return (
    <div className="min-h-screen bg-background">
      <main className="mx-auto max-w-4xl px-4 py-8 sm:py-12 md:py-16">
        {/* Hero */}
        <div className="mb-12 sm:mb-20 text-center space-y-8 relative animate-in fade-in slide-in-from-top-4 duration-700">
          <div className="flex flex-col items-center gap-4 sm:gap-6">
            <div className="inline-flex items-center justify-center px-4 py-1.5 sm:px-5 sm:py-2 rounded-full bg-secondary/10 border border-secondary/20 mb-2 shadow-sm">
              <span className="text-[10px] sm:text-[11px] font-black uppercase tracking-[0.2em] sm:tracking-[0.3em] text-primary">
                AgendIlha
              </span>
            </div>
            <h1 className="text-5xl xs:text-6xl sm:text-8xl font-black font-display text-primary tracking-tightest leading-[0.9] drop-shadow-sm">
              Coé a Boa?
            </h1>
            <p className="text-foreground/80 text-lg sm:text-2xl font-medium max-w-2xl mx-auto leading-relaxed px-2 sm:px-4 text-balance contrast-125">
              A agenda cultural da Ilha do Governador.
            </p>
          </div>

          {/* AI Recommendations */}
          {user &&
            (nearYouEvents.length > 0 ||
              recommendedEvents.length > 0 ||
              trendingEvents.length > 0) && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-12 animate-in fade-in slide-in-from-bottom-4 duration-1000">
                {nearYouEvents.length > 0 && (
                  <div className="space-y-4">
                    <h3 className="flex items-center gap-2 text-base font-semibold uppercase tracking-[0.18em] text-foreground/70 px-2">
                      <MapPin className="h-4 w-4 text-secondary" /> Hoje perto de você
                    </h3>
                    <div className="grid grid-cols-1 gap-3">
                      {nearYouEvents.map((ev) => (
                        <RecommendationCard
                          key={ev.id}
                          event={ev}
                          icon={CalendarDays}
                          caption={`${ev.address_neighborhood} • ${ev.date} • ${ev.start_time}`}
                          onSelect={setSelectedEvent}
                          onShare={handleShare}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {trendingEvents.length > 0 && (
                  <div className="space-y-4">
                    <h3 className="flex items-center gap-2 text-base font-semibold uppercase tracking-[0.18em] text-foreground/70 px-2">
                      <Trophy className="h-4 w-4 text-secondary" /> Bombando agora
                    </h3>
                    <div className="grid grid-cols-1 gap-3">
                      {trendingEvents.map((ev) => (
                        <RecommendationCard
                          key={ev.id}
                          event={ev}
                          icon={Play}
                          caption={`${ev.views_count || 0} visualizações`}
                          onSelect={setSelectedEvent}
                          onShare={handleShare}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {recommendedEvents.length > 0 && (
                  <div className="space-y-4">
                    <h3 className="flex items-center gap-2 text-base font-semibold uppercase tracking-[0.18em] text-foreground/70 px-2">
                      <Sparkles className="h-4 w-4 text-secondary" /> Você pode gostar
                    </h3>
                    <div className="grid grid-cols-1 gap-3">
                      {recommendedEvents.map((ev) => (
                        <RecommendationCard
                          key={ev.id}
                          event={ev}
                          icon={MusicIcon}
                          caption={`${ev.category} • ${ev.date}`}
                          onSelect={setSelectedEvent}
                          onShare={handleShare}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

          {/* Action buttons */}
          <div
            className="flex flex-col items-center gap-4 sm:gap-8 mt-6 sm:mt-12 px-1 sm:px-2"
            role="group"
            aria-label="Ações da agenda"
          >
            <div className="flex flex-col sm:flex-row justify-center gap-3 sm:gap-4 w-full max-w-2xl">
              <Button
                className="rounded-full shadow-lg sm:shadow-xl bg-primary text-primary-foreground font-black px-6 sm:px-12 h-14 sm:h-16 text-sm sm:text-base transition-all uppercase tracking-widest outline-none hover:scale-[1.02] active:scale-95 w-full sm:flex-1"
                onClick={() =>
                  navigate(
                    !user
                      ? "/auth?redirect=/enviar-evento"
                      : isDivulgador
                      ? "/enviar-evento"
                      : "/meus-eventos"
                  )
                }
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
                <Settings2 className="h-4 w-4" /> Personalizar Minha Agenda
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

        {/* Progressive Login Banner */}
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
                <h3 className="text-xl font-black font-display text-primary leading-tight mb-1.5 tracking-tight">
                  Personalize sua experiência ✨
                </h3>
                <p className="text-muted-foreground text-sm font-medium leading-relaxed max-w-lg">
                  Cadastre-se para receber recomendações da IA baseadas no seu bairro e interesses
                  musicais. É rápido e gratuito!
                </p>
              </div>
              <Button
                onClick={() => navigate("/auth")}
                className="rounded-full gradient-sunset text-white font-black px-8 h-12 shadow-lg hover:scale-105 active:scale-95 transition-all z-10"
              >
                Começar agora
              </Button>
            </div>
          ) : (
            profile && (
              <div className="bg-primary/5 border border-primary/10 rounded-[2.5rem] p-6 sm:p-8 flex flex-col md:flex-row items-center gap-6 shadow-sm">
                <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0 border border-primary/20">
                  <Sparkles className="h-8 w-8 text-primary animate-pulse" />
                </div>
                <div className="flex-1 text-center md:text-left">
                  <h3 className="text-xl font-black font-display text-primary leading-tight mb-1">
                    Destaques no seu bairro 🌴
                  </h3>
                  <p className="text-muted-foreground text-sm font-medium">
                    {profile.home_location || profile.work_neighborhood
                      ? `Filtrando automaticamente eventos próximos a ${profile.home_location || profile.work_neighborhood}.`
                      : "Configure seu bairro no perfil para receber recomendações personalizadas!"}
                  </p>
                </div>
                {(profile.home_location || profile.work_neighborhood) && (
                  <Button
                    variant="outline"
                    onClick={() =>
                      setNeighborhoodFilter(profile.home_location || profile.work_neighborhood)
                    }
                    className="rounded-full border-2 border-primary/20 text-primary font-bold px-6 hover:bg-primary/5"
                  >
                    Ver todos no bairro
                  </Button>
                )}
              </div>
            )
          )}
        </div>

        {/* Tabs */}
        <div className="flex p-1 bg-muted/50 rounded-2xl mb-12 max-w-sm mx-auto border border-border/50">
          <button
            onClick={() => setActiveTab("events")}
            className={cn(
              "flex-1 py-3 px-4 rounded-xl text-sm font-black transition-all flex items-center justify-center gap-2",
              activeTab === "events"
                ? "bg-background shadow-md text-primary"
                : "text-muted-foreground hover:text-foreground",
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
                : "text-muted-foreground hover:text-foreground",
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
                    <div
                      key={video.id}
                      className="relative min-w-[200px] sm:min-w-[240px] aspect-[9/16] rounded-3xl overflow-hidden bg-muted snap-start shadow-xl group cursor-pointer"
                      onClick={() => navigate(`/artista/${video.artist.id}`)}
                    >
                      <img src={video.thumbnail_url} className="w-full h-full object-cover" alt="" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                      <div className="absolute bottom-4 left-4 right-4 text-white">
                        <p className="font-bold text-sm">{video.artist.name}</p>
                        <Badge
                          variant="secondary"
                          className="bg-white/20 text-[10px] text-white border-none"
                        >
                          {video.artist.genre}
                        </Badge>
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
                {artists
                  ?.filter((a) => neighborhoodFilter === "all" || a.neighborhood === neighborhoodFilter)
                  .map((artist) => <ArtistCard key={artist.id} artist={artist} />)}
              </div>
            </section>
          </div>
        )}

        {activeTab === "events" && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Search + Filters */}
            <div className="mb-12 space-y-4 sm:space-y-6">
              <div className="bg-card border border-border/60 rounded-[1.5rem] sm:rounded-[2rem] p-3 sm:p-8 shadow-card ring-1 ring-black/[0.02]">
                <div className="flex flex-col gap-3 sm:gap-6">
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
                        onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
                        className="w-full sm:w-auto h-12 sm:h-14 px-4 sm:px-6 rounded-xl sm:rounded-3xl border-2 border-primary/10 text-primary font-bold transition-all active:scale-95 bg-white hover:bg-primary/5 hover:border-primary/30 flex items-center justify-center gap-2"
                      >
                        <ArrowUpDown
                          className={cn(
                            "h-4 w-4 transition-transform duration-300",
                            sortOrder === "desc" && "rotate-180",
                          )}
                        />
                        <span className="text-[10px] sm:text-xs uppercase tracking-widest">
                          {sortOrder === "asc" ? "Próximos" : "Distantes"}
                        </span>
                      </Button>
                      <div
                        className={cn(
                          "absolute -top-1.5 -right-1 h-3.5 w-3.5 rounded-full border-2 border-background shadow-sm",
                          sortOrder === "asc" ? "bg-primary" : "bg-secondary",
                        )}
                      />
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-4 items-center">
                    <Button
                      variant={showFavoritesOnly ? "default" : "outline"}
                      onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
                      className={cn(
                        "w-full sm:w-auto rounded-full h-12 px-6 gap-2 font-bold transition-all active:scale-95",
                        showFavoritesOnly
                          ? "bg-primary text-white"
                          : "border-2 border-primary/10 text-primary hover:bg-primary/5",
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
                          <SelectItem value="all" className="font-semibold">
                            Todas as categorias
                          </SelectItem>
                          {Object.entries(categoryLabels).map(([k, v]) => (
                            <SelectItem key={k} value={k}>
                              {v}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Select value={neighborhoodFilter} onValueChange={setNeighborhoodFilter}>
                        <SelectTrigger className="h-12 sm:h-13 border-2 border-primary/10 bg-white hover:bg-primary/5 transition-colors focus:ring-2 focus:ring-primary/20 rounded-xl sm:rounded-2xl font-semibold text-sm">
                          <SelectValue placeholder="Bairros" />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl border-border/50">
                          <SelectItem value="all" className="font-semibold">
                            Todos os bairros
                          </SelectItem>
                          {neighborhoods.map((n) => (
                            <SelectItem key={n} value={n}>
                              {n}
                            </SelectItem>
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
                <h3 className="text-2xl font-black text-foreground mb-3 tracking-tight">
                  A Ilha está descansando...
                </h3>
                <p className="text-muted-foreground text-lg font-medium max-w-md mx-auto leading-relaxed mb-8">
                  {search || categoryFilter !== "all" || neighborhoodFilter !== "all"
                    ? "Não encontramos nada com esses filtros. Que tal tentar uma busca mais ampla?"
                    : "No momento não temos eventos publicados para os próximos dias. Volte em breve!"}
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                  {(search || categoryFilter !== "all" || neighborhoodFilter !== "all") && (
                    <Button
                      variant="outline"
                      onClick={() => {
                        setSearch("");
                        setCategoryFilter("all");
                        setNeighborhoodFilter("all");
                      }}
                      className="rounded-full font-bold border-2 h-11 px-8"
                    >
                      Limpar Filtros
                    </Button>
                  )}
                  <Button
                    variant="default"
                    onClick={() => {
                      if (user && !isDivulgador) {
                        toast.info("Acesso só pra Divulgador", {
                          description: "Peça acesso em Meus eventos que a equipe libera rapidinho.",
                        });
                        navigate("/meus-eventos");
                      } else if (user) {
                        navigate("/enviar-evento");
                      } else {
                        toast.info("Acesse sua conta primeiro", {
                          description: "É necessário estar logado para divulgar eventos.",
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
                {/* Highlights */}
                {filteredEvents.some((e) => e.is_highlight) && (
                  <section>
                    <div className="flex items-center gap-3 mb-6">
                      <div className="h-3 w-3 rounded-full bg-orange-500 animate-pulse" />
                      <h2 className="text-2xl font-bold font-display">Destaques AgendIlha</h2>
                    </div>
                    <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-none snap-x snap-mandatory">
                      {filteredEvents
                        .filter((e) => e.is_highlight)
                        .map((ev) => (
                          <HighlightCard
                            key={ev.id}
                            event={ev}
                            onSelect={setSelectedEvent}
                            onShare={handleShare}
                            trackView={trackView}
                          />
                        ))}
                    </div>
                  </section>
                )}

                {/* Day-grouped list */}
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
                      {grouped[dayKey].items.map((ev) => (
                        <DayEventCard
                          key={ev.id}
                          event={ev}
                          onSelect={setSelectedEvent}
                          onShare={handleShare}
                          trackView={trackView}
                          trackShare={trackShare}
                        />
                      ))}
                    </div>
                  </section>
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      <Onboarding />
      <PersonalizationDialog
        open={personalizationOpen}
        onOpenChange={setPersonalizationOpen}
      />
      {shareData && (
        <ShareDialog
          open={!!shareData}
          onOpenChange={(open) => !open && setShareData(null)}
          title={shareData.title}
          text={shareData.text}
          url={shareData.url}
          onShare={() => shareData.eventId && trackShare(shareData.eventId)}
        />
      )}

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
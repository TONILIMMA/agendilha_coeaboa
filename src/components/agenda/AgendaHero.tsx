import { CalendarDays, Copy, FileDown, MapPin, Megaphone, MessageCircle, Music as MusicIcon, Play, Settings2, Sparkles, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { RecommendationCard } from "@/components/agenda/RecommendationCard";
import type { AgendaEvent } from "@/components/agenda/types";
import type { ShareHandler } from "@/components/agenda/agenda-types";

interface AgendaHeroProps {
  isLoggedIn: boolean;
  nearYouEvents: AgendaEvent[];
  trendingEvents: AgendaEvent[];
  recommendedEvents: AgendaEvent[];
  onSelectEvent: (ev: AgendaEvent) => void;
  onShare: ShareHandler;
  onDivulgar: () => void;
  onWhatsApp: () => void;
  onPersonalize: () => void;
  onCopyLink: () => void;
  onExportPdf: () => void;
}

/** Cabeçalho da agenda: título, recomendações da IA e ações principais. */
export function AgendaHero({
  isLoggedIn,
  nearYouEvents,
  trendingEvents,
  recommendedEvents,
  onSelectEvent,
  onShare,
  onDivulgar,
  onWhatsApp,
  onPersonalize,
  onCopyLink,
  onExportPdf,
}: AgendaHeroProps) {
  const hasRecommendations =
    nearYouEvents.length > 0 || recommendedEvents.length > 0 || trendingEvents.length > 0;

  return (
    <div className="mb-12 sm:mb-20 text-center space-y-8 relative animate-in fade-in slide-in-from-top-4 duration-700">
      <div className="flex flex-col items-center gap-4 sm:gap-6">
        <div className="inline-flex items-center justify-center px-4 py-1.5 sm:px-5 sm:py-2 rounded-full bg-secondary/10 border border-secondary/20 mb-2 shadow-sm">
          <span className="text-[10px] sm:text-[11px] font-black uppercase tracking-[0.2em] sm:tracking-[0.3em] text-primary">
            AgendIlha
          </span>
        </div>
        <h1 className="text-5xl xs:text-6xl sm:text-8xl font-black font-display text-primary tracking-tightest leading-[0.9] drop-shadow-sm">
          Coé a Boa? <span className="block text-2xl sm:text-4xl mt-2 text-foreground/90">Agenda Cultural da Ilha do Governador</span>
        </h1>
        <p className="text-foreground/80 text-lg sm:text-2xl font-medium max-w-2xl mx-auto leading-relaxed px-2 sm:px-4 text-balance contrast-125">
          A agenda cultural da Ilha do Governador.
        </p>
      </div>

      {isLoggedIn && hasRecommendations && (
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
                    caption={[ev.address_neighborhood, ev.date, ev.start_time].filter(Boolean).join(" • ")}
                    onSelect={onSelectEvent}
                    onShare={onShare}
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
                    onSelect={onSelectEvent}
                    onShare={onShare}
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
                    onSelect={onSelectEvent}
                    onShare={onShare}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <div
        className="flex flex-col items-center gap-4 sm:gap-8 mt-6 sm:mt-12 px-1 sm:px-2"
        role="group"
        aria-label="Ações da agenda"
      >
        <div className="flex flex-col sm:flex-row justify-center gap-3 sm:gap-4 w-full max-w-2xl">
          <Button
            className="rounded-full shadow-lg sm:shadow-xl bg-primary text-primary-foreground font-black px-6 sm:px-12 h-14 sm:h-16 text-sm sm:text-base transition-all uppercase tracking-widest outline-none hover:scale-[1.02] active:scale-95 w-full sm:flex-1"
            onClick={onDivulgar}
          >
            <Megaphone className="h-5 w-5 mr-2.5" /> Divulgar Evento
          </Button>
          <Button
            className="rounded-full shadow-lg sm:shadow-xl gradient-sunset text-primary-foreground font-black px-6 sm:px-12 h-14 sm:h-16 text-sm sm:text-base transition-all uppercase tracking-widest focus-visible:ring-4 focus-visible:ring-primary/40 outline-none hover:scale-[1.02] active:scale-95 w-full sm:flex-1"
            onClick={onWhatsApp}
            aria-label="Compartilhar agenda no WhatsApp"
          >
            <MessageCircle className="h-5 w-5 mr-2.5" /> WhatsApp
          </Button>
        </div>

        <div className="flex flex-wrap justify-center gap-4 sm:gap-6 w-full mt-2">
          <Button
            variant="ghost"
            className="rounded-full h-12 px-6 font-bold text-sm text-secondary hover:text-secondary/80 hover:bg-secondary/5 flex items-center gap-2 transition-all"
            onClick={onPersonalize}
          >
            <Settings2 className="h-4 w-4" /> Personalizar Minha Agenda
          </Button>
          <Button
            variant="ghost"
            className="rounded-full h-10 sm:h-11 px-4 sm:px-6 text-[11px] sm:text-sm font-bold uppercase tracking-widest text-muted-foreground hover:text-primary hover:bg-primary/5 transition-all active:scale-95"
            onClick={onCopyLink}
            aria-label="Copiar link da agenda"
          >
            <Copy className="h-4 w-4 mr-2" /> Copiar link
          </Button>
          <Button
            variant="ghost"
            className="rounded-full h-10 sm:h-11 px-4 sm:px-6 text-[11px] sm:text-sm font-bold uppercase tracking-widest text-muted-foreground hover:text-primary hover:bg-primary/5 transition-all active:scale-95"
            onClick={onExportPdf}
            aria-label="Baixar agenda completa em PDF"
          >
            <FileDown className="h-4 w-4 mr-2" /> Baixar PDF
          </Button>
        </div>
      </div>
    </div>
  );
}

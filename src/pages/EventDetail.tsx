import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { FavoriteButton } from "@/components/FavoriteButton";
import { 
  CalendarDays, MapPin, Clock, Share2, ArrowLeft, 
  Tag, Info, ExternalLink, MessageCircle, Heart,
  Building2, ChevronRight, LayoutDashboard, Globe,
  Navigation, Send, Ticket, Baby, Users
} from "lucide-react";
import { toast } from "sonner";
import { formatBrazilianDate } from "@/lib/date-utils";
import { cn } from "@/lib/utils";
import { getEventFallbackImage } from "@/lib/event-utils";
import { EventWhatsAppCardExport } from "@/components/EventWhatsAppCard";

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
  image_url: string | null;
  is_highlight: boolean;
  slug: string;
  status: string;
  artist_name?: string | null;
  music_style?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  age_rating?: string | null;
  is_suitable_for_minors?: boolean | null;
  sale_price?: string | null;
  promotion_type?: string | null;
  promotion_rules?: string | null;
}

export default function EventDetail() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    async function fetchEvent() {
      if (!slug) return;
      setLoading(true);
      
      const { data, error } = await supabase
        .from("public_submissions")
        .select("*")
        .eq("slug", slug)
        .maybeSingle();

      if (error || !data) {
        console.error("Error fetching event:", error);
        setError(true);
      } else {
        setEvent(data as unknown as Event);
        // Increment views
        supabase.rpc('increment_views', { event_id: data.id }).then(({ error }) => {
          if (error) console.error("Error incrementing views:", error);
        });
      }
      setLoading(false);
    }

    fetchEvent();
  }, [slug]);

  const handleShare = () => {
    if (!event) return;
    const url = window.location.href;
    if (navigator.share) {
      navigator.share({
        title: event.event_title,
        text: `Confira este evento no AgendIlha: ${event.event_title}`,
        url: url
      });
    } else {
      navigator.clipboard.writeText(url);
      toast.success("Link copiado para a área de transferência!");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container max-w-4xl mx-auto px-4 py-8 space-y-8">
          <Skeleton className="h-[400px] w-full rounded-3xl" />
          <div className="space-y-4">
            <Skeleton className="h-10 w-3/4" />
            <Skeleton className="h-6 w-1/2" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <div className="flex-1 flex flex-col items-center justify-center p-4 text-center space-y-4">
          <Info className="h-16 w-16 text-muted-foreground opacity-20" />
          <h1 className="text-2xl font-black">Evento não encontrado</h1>
          <p className="text-muted-foreground">Este evento pode ter sido removido ou o link está incorreto.</p>
          <Button asChild className="rounded-full font-bold">
            <Link to="/agenda">Voltar para a Agenda</Link>
          </Button>
        </div>
      </div>
    );
  }

  const fallbackImage = getEventFallbackImage(event.category);
  const fullAddress = [
    event.address_street,
    event.address_number,
    event.address_neighborhood,
    event.address_city
  ].filter(Boolean).join(", ");

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Hero */}
      <div className="relative w-full h-[44vh] md:h-[64vh] overflow-hidden">
        <img
          src={event.image_url || fallbackImage}
          alt={event.event_title}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-foreground/90 from-[8%] via-foreground/35 via-[42%] to-transparent to-[78%] pointer-events-none" />

        <div className="absolute top-5 left-5">
          <Button
            variant="ghost"
            size="sm"
            className="rounded-full bg-background/80 backdrop-blur-md border border-foreground/5 text-foreground hover:bg-background font-medium tracking-tight"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft className="h-4 w-4 mr-1.5" strokeWidth={2} /> Voltar
          </Button>
        </div>

        <div className="absolute bottom-8 md:bottom-12 left-0 right-0">
          <div className="container max-w-4xl mx-auto px-5 md:px-8">
            <Badge className="mb-4 bg-background/90 backdrop-blur-md text-foreground border border-foreground/5 font-semibold uppercase tracking-[0.2em] text-[10px] rounded-full px-3 py-1 shadow-none">
              {event.category || 'Geral'}
            </Badge>
            <h1 className="font-display font-semibold tracking-[-0.02em] text-background leading-[1.05] text-3xl md:text-5xl max-w-3xl">
              {event.event_title}
            </h1>
          </div>
        </div>
      </div>

      <div className="container max-w-4xl mx-auto px-5 md:px-8 mt-10 md:mt-14">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 lg:gap-14">
          {/* Main */}
          <article className="lg:col-span-2 space-y-10">
            {/* Meta strip */}
            <dl className="grid grid-cols-1 sm:grid-cols-3 gap-y-6 sm:gap-x-8 pb-8 border-b border-foreground/10">
              <div>
                <dt className="text-[10px] font-semibold uppercase tracking-[0.22em] text-foreground/55 mb-1.5">Data</dt>
                <dd className="font-display text-base font-medium text-foreground tracking-tight">{formatBrazilianDate(event.date || '')}</dd>
              </div>
              <div>
                <dt className="text-[10px] font-semibold uppercase tracking-[0.22em] text-foreground/55 mb-1.5">Horário</dt>
                <dd className="font-display text-base font-medium text-foreground tracking-tight">
                  {event.start_time || '—'}{event.end_time ? ` – ${event.end_time}` : ''}
                </dd>
              </div>
              <div>
                <dt className="text-[10px] font-semibold uppercase tracking-[0.22em] text-foreground/55 mb-1.5">Local</dt>
                <dd className="font-display text-base font-medium text-foreground tracking-tight leading-snug">{event.location || '—'}</dd>
                {fullAddress && (
                  <dd className="text-xs text-foreground/55 mt-0.5 leading-snug">{fullAddress}</dd>
                )}
              </div>
            </dl>

            {/* About */}
            <section>
              <h2 className="text-[10px] font-semibold uppercase tracking-[0.22em] text-foreground/55 mb-4">Sobre o evento</h2>
              <div className="text-[15px] md:text-base leading-[1.75] text-foreground/85 whitespace-pre-wrap max-w-prose">
                {event.description || "Nenhuma descrição fornecida para este evento."}
              </div>
            </section>
          </article>

          {/* Aside */}
          <aside className="space-y-6">
            <div className="lg:sticky lg:top-24 space-y-5 lg:bg-card lg:p-6 lg:rounded-3xl lg:ring-1 lg:ring-foreground/[0.06] lg:shadow-none">
              <Button
                className="w-full h-12 rounded-full bg-foreground text-background hover:bg-foreground/90 font-semibold tracking-tight shadow-none"
                onClick={() => {
                  const msg = `Olá! Tenho interesse no evento "${event.event_title}" que vi no AgendIlha.`;
                  window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
                }}
              >
                <MessageCircle className="h-4 w-4 mr-2" strokeWidth={2} /> Tenho interesse
              </Button>

              <div className="flex gap-2">
                <FavoriteButton
                  eventId={event.id}
                  className="flex-1 h-11 rounded-full bg-transparent border border-foreground/15 text-foreground hover:bg-foreground/5 font-medium"
                />
                <Button
                  variant="outline"
                  size="icon"
                  className="h-11 w-11 rounded-full border border-foreground/15 bg-transparent hover:bg-foreground/5"
                  onClick={handleShare}
                  aria-label="Compartilhar"
                >
                  <Share2 className="h-4 w-4" strokeWidth={2} />
                </Button>
              </div>

              <Link
                to="/agenda"
                className="group flex items-center justify-between text-xs font-semibold uppercase tracking-[0.18em] text-foreground/55 hover:text-foreground transition-colors pt-2"
              >
                Ver agenda completa
                <ChevronRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </div>

            {/* Shareable flyer */}
            <div className="space-y-3">
              <h3 className="text-[10px] font-semibold uppercase tracking-[0.22em] text-foreground/55 px-1">
                Card para WhatsApp
              </h3>
              <EventWhatsAppCardExport
                event={{
                  id: event.id,
                  event_title: event.event_title,
                  artist_name: event.artist_name,
                  date: event.date,
                  start_time: event.start_time,
                  location: event.location,
                  address_street: event.address_street,
                  address_number: event.address_number,
                  address_neighborhood: event.address_neighborhood,
                  music_style: event.music_style,
                  category: event.category,
                  image_url: event.image_url,
                  description: event.description,
                }}
              />
            </div>

            <p className="text-[10px] uppercase tracking-[0.2em] text-foreground/40 px-1">
              Publicado no AgendIlha · #{event.id.slice(0, 6)}
            </p>
          </aside>
        </div>
      </div>
    </div>
  );
}

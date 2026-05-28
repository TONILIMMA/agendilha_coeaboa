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
  Building2, ChevronRight, LayoutDashboard, Globe
} from "lucide-react";
import { toast } from "sonner";
import { formatBrazilianDate } from "@/lib/date-utils";
import { cn } from "@/lib/utils";
import { getEventFallbackImage } from "@/lib/event-utils";

interface Event {
...
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
        <Header />
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
    <div className="min-h-screen bg-background pb-20">
      <Header />
      
      {/* Hero Section with Image */}
      <div className="relative w-full h-[40vh] md:h-[60vh] overflow-hidden">
        <img 
          src={event.image_url || fallbackImage} 
          alt={event.event_title}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
        
        <div className="absolute top-4 left-4">
          <Button 
            variant="secondary" 
            size="sm" 
            className="rounded-full bg-white/20 backdrop-blur-md border-white/30 text-white hover:bg-white/30"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft className="h-4 w-4 mr-2" /> Voltar
          </Button>
        </div>

        <div className="absolute bottom-6 left-6 right-6">
          <div className="container max-w-4xl mx-auto p-0">
            <Badge className="mb-3 bg-primary text-primary-foreground border-none font-black uppercase tracking-wider">
              {event.category || 'Geral'}
            </Badge>
            <h1 className="text-3xl md:text-5xl font-black text-white leading-tight drop-shadow-lg">
              {event.event_title}
            </h1>
          </div>
        </div>
      </div>

      <div className="container max-w-4xl mx-auto px-4 -mt-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Main Info */}
          <div className="lg:col-span-2 space-y-8">
            <div className="bg-card p-6 md:p-8 rounded-[2rem] border border-border shadow-xl space-y-6">
              <div className="flex flex-wrap gap-4 md:gap-8">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                    <CalendarDays className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Data</p>
                    <p className="font-bold">{formatBrazilianDate(event.date || '')}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                    <Clock className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Horário</p>
                    <p className="font-bold">{event.start_time}{event.end_time ? ` às ${event.end_time}` : ''}</p>
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
                  <MapPin className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Localização</p>
                  <p className="font-bold leading-tight">{event.location}</p>
                  <p className="text-sm text-muted-foreground">{fullAddress}</p>
                </div>
              </div>

              <div className="pt-4 border-t border-border">
                <h3 className="text-sm font-black uppercase tracking-widest text-muted-foreground mb-4">Sobre o Evento</h3>
                <div className="prose prose-sm dark:prose-invert max-w-none text-foreground/80 leading-relaxed whitespace-pre-wrap">
                  {event.description || "Nenhuma descrição fornecida para este evento."}
                </div>
              </div>
            </div>

            {/* Map Placeholder or Actual Map would go here */}
            {/* ... */}
          </div>

          {/* Sidebar Actions */}
          <div className="space-y-4">
            <div className="bg-card p-6 rounded-[2rem] border border-border shadow-lg sticky top-24">
              <div className="space-y-4">
                <div className="flex gap-2">
                  <FavoriteButton 
                    eventId={event.id} 
                    className="flex-1 h-12 rounded-2xl font-bold bg-muted/50 hover:bg-muted border-border"
                  />
                  <Button 
                    variant="outline" 
                    size="icon" 
                    className="h-12 w-12 rounded-2xl border-border"
                    onClick={handleShare}
                  >
                    <Share2 className="h-5 w-5" />
                  </Button>
                </div>
                
                <Button 
                  className="w-full h-14 rounded-2xl font-black text-lg bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-600/20"
                  onClick={() => {
                    const msg = `Olá! Tenho interesse no evento "${event.event_title}" que vi no AgendIlha.`;
                    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
                  }}
                >
                  <MessageCircle className="h-5 w-5 mr-2" /> Tenho Interesse
                </Button>

                <Separator className="my-4" />

                <Link to="/agenda" className="group flex items-center justify-between text-sm font-bold text-muted-foreground hover:text-primary transition-colors">
                  Ver agenda completa
                  <ChevronRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
            </div>

            {/* Event Meta */}
            <div className="p-4 rounded-2xl bg-muted/30 border border-border/50 text-[10px] text-muted-foreground space-y-1">
              <p>Publicado no AgendIlha</p>
              <p>ID do Evento: {event.id.slice(0, 8)}</p>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

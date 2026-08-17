 import { lazy, Suspense, useEffect, useRef, useState, useCallback } from "react";
 import { useInfiniteQuery } from "@tanstack/react-query";
 import { useInView } from "react-intersection-observer";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useProfile } from "@/hooks/useProfile";
const Onboarding = lazy(() =>
  import("@/components/Onboarding").then((m) => ({ default: m.Onboarding }))
);
const PersonalizationDialog = lazy(() =>
  import("@/components/PersonalizationDialog").then((m) => ({ default: m.PersonalizationDialog }))
);
const ShareDialog = lazy(() =>
  import("@/components/ShareDialog").then((m) => ({ default: m.ShareDialog }))
);
import {
  Calendar,
  Megaphone,
  Users2,
  FileDown,
  Sparkles,
  ShieldCheck,
  Globe2,
  MessageCircle,
  ArrowRight,
  Map as MapIcon,
  TrendingUp,
  Music,
  MapPin,
  ChevronRight,
  Heart,
  Share2,
  Mail,
  ArrowRightCircle,
  Loader2,
  Phone,
  CheckCircle2,
  Compass
} from "lucide-react";
import { DiscoveryEventCard } from "@/components/DiscoveryEventCard";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
 import { handleError } from "@/lib/error-handler";
 import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import Header from "@/components/Header";
import logo from "@/assets/coeaboa-logo.webp";
import { getShareData } from "@/lib/sharing";
import { Settings2 } from "lucide-react";
import { newsletterSubscribeSchema } from "@/schemas/newsletter";

const sitelinks = [
  { href: "#oferecemos", label: "O que oferecemos" },
  { href: "#ecossistema", label: "Ecossistema" },
  { href: "#diferenciais", label: "Diferenciais" },
  { href: "#contato", label: "Contato" },
];

const genres = [
  { id: "musica", label: "Música", icon: Music },
  { id: "cultura", label: "Cultura", icon: Sparkles },
  { id: "gastronomia", label: "Gastronomia", icon: Globe2 },
  { id: "esporte", label: "Esporte", icon: Calendar },
  { id: "turismo", label: "Turismo", icon: Compass },
  { id: "outros", label: "Outros", icon: Megaphone },
];

const marqueeWords = ["Música", "Teatro", "Gastronomia", "Arte", "Workshops", "Feiras", "Cinema", "Literatura", "Dança", "Cultura local"];

function useScrollReveal() {
  const observed = useRef<Set<Element>>(new Set());
  useEffect(() => {
    const els = document.querySelectorAll(".reveal");
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("is-visible");
            obs.unobserve(e.target);
          }
        });
      },
      { threshold: 0.12 }
    );
    els.forEach((el) => {
      if (!observed.current.has(el)) {
        obs.observe(el);
        observed.current.add(el);
      }
    });
    return () => obs.disconnect();
  }, []);
}

export default function Landing() {
  useScrollReveal();
  const [scrolled, setScrolled] = useState(false);
  const { user } = useAuth();
  const { profile, loaded: profileLoaded } = useProfile();
  const navigate = useNavigate();
   const { ref: loadMoreRef, inView: loadMoreInView } = useInView();
 
   const { 
     data: eventsData, 
     fetchNextPage, 
     hasNextPage, 
     isFetchingNextPage,
     isLoading: eventsLoading 
   } = useInfiniteQuery({
     queryKey: ["all-events"],
     queryFn: async ({ pageParam = 0 }) => {
       const { data, error } = await supabase
          .from("public_submissions")
         .select("id, event_title, date, start_time, end_time, location, address_street, address_neighborhood, category, image_url, is_highlight, atrativo_style, description, age_rating, is_suitable_for_minors")
         .eq('status', 'aprovado')
         .order('date', { ascending: true })
         .range(pageParam, pageParam + 9);
       
       if (error) throw error;
       return {
         items: data,
         nextPage: data.length === 10 ? pageParam + 10 : undefined
       };
     },
     initialPageParam: 0,
     getNextPageParam: (lastPage) => lastPage.nextPage,
   });
 
    const allEvents = eventsData?.pages.flatMap(page => page.items) || [];
    const todayStr = new Date().toISOString().split('T')[0];
    const todayEvents = allEvents.filter(e => e.date === todayStr).slice(0, 6);
    
    // Deduplicate: events in alta should not be in today if possible, or limited
    const trendingEvents = allEvents
      .filter(e => !todayEvents.find(t => t.id === e.id))
      .slice(0, 8);
 
   useEffect(() => {
     if (loadMoreInView && hasNextPage && !isFetchingNextPage) {
       fetchNextPage();
     }
   }, [loadMoreInView, hasNextPage, isFetchingNextPage, fetchNextPage]);
  const [favorites, setFavorites] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem("agendilha_favorites");
      const parsed = saved ? JSON.parse(saved) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  });
  const [subscriberPhone, setSubscriberPhone] = useState("");
  const [subscriberName, setSubscriberName] = useState("");
  const [subscriberNeighborhood, setSubscriberNeighborhood] = useState("");
  const [whatsappConsent, setWhatsappConsent] = useState(true);
  const [isSubscribing, setIsSubmitting] = useState(false);
  const [personalizationOpen, setPersonalizationOpen] = useState(false);
  const [shareData, setShareData] = useState<{ title: string; text: string; url: string; eventId?: string } | null>(null);

  const toggleFavorite = (id: string) => {
    setFavorites(prev => {
      const isFav = prev.includes(id);
      const next = isFav ? prev.filter(f => f !== id) : [...prev, id];
      try {
        localStorage.setItem("agendilha_favorites", JSON.stringify(next));
        window.dispatchEvent(new Event("agendilha:favorites"));
      } catch {
        // storage cheio ou bloqueado: segue só com o estado em memória
      }
      return next;
    });
  };

  const handleNewsletterSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();

    const parsed = newsletterSubscribeSchema.safeParse({
      phone: subscriberPhone,
      name: subscriberName,
      neighborhood: subscriberNeighborhood,
      whatsappConsent,
    });

    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Dados inválidos");
      return;
    }

    const { phone, name, neighborhood } = parsed.data;
    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from("newsletter_subscribers")
        .insert({
          email: `${phone}@whatsapp.agendilha.app`,
          name: name || null,
          neighborhood: neighborhood || null,
        });

      if (error) {
        if (error.code === "23505") {
          toast.info("Este número já está cadastrado!");
        } else {
          throw error;
        }
      } else {
        toast.success("Cadastro realizado!", {
          description: "Você receberá as novidades da Ilha no seu WhatsApp."
        });
        setSubscriberPhone("");
        setSubscriberName("");
        setSubscriberNeighborhood("");
      }
     } catch (err) {
       handleError(err, "Erro ao realizar cadastro.");
     } finally {
      setIsSubmitting(false);
    }
  };

   const [recommendedEvents, setRecommendedEvents] = useState<any[]>([]);
   
   useEffect(() => {
     if (allEvents.length > 0) {
       // Simple IA recommendation logic
       if (profileLoaded && user) {
         const prefs = profile.musical_preferences || [];
         const home = profile.home_location;
         const work = profile.work_neighborhood;
         
         const recs = allEvents.filter(ev => {
           const matchStyle = prefs.some(p => ev.atrativo_style?.toLowerCase().includes(p.toLowerCase()));
           const matchNeighborhood = ev.address_neighborhood === home || ev.address_neighborhood === work;
           return matchStyle || matchNeighborhood;
         }).slice(0, 5);
         
          setRecommendedEvents(recs.length > 0 ? recs : allEvents.filter(e => !todayEvents.find(t => t.id === e.id) && !trendingEvents.find(f => f.id === e.id)).slice(0, 5));
        } else {
          setRecommendedEvents(allEvents.filter(e => !todayEvents.find(t => t.id === e.id) && !trendingEvents.find(f => f.id === e.id)).slice(0, 5));
        }
     }
   }, [allEvents, profileLoaded, user, profile.musical_preferences, profile.home_location, profile.work_neighborhood]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  return (
    <div className="min-h-screen bg-background text-foreground antialiased font-body selection:bg-primary/15 selection:text-primary">
      <Header />
      
       {/* ── Hero Discovery ── */}
       <section className="pt-24 sm:pt-36 pb-16 sm:pb-24 px-4 max-w-5xl mx-auto">
         <div className="text-center mb-16 sm:mb-24 animate-in fade-in slide-in-from-top-4 duration-1000">
           <div className="inline-flex items-center justify-center px-3.5 py-1 rounded-full border border-accent mb-10">
             <span className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-[0.22em] text-secondary">Curadoria local da Ilha</span>
           </div>
           <h1 className="text-[2.5rem] xs:text-5xl sm:text-7xl font-bold mb-6 font-display text-foreground tracking-tight leading-[1.05] max-w-4xl mx-auto text-balance">
             O melhor da Ilha,<br className="hidden sm:block" /> <span className="text-secondary">em um só lugar.</span>
           </h1>
           <p className="text-secondary/80 text-base sm:text-lg font-light max-w-xl mx-auto mb-12 text-balance leading-relaxed">
             Agenda curada de eventos, bares e experiências na Ilha do Governador — atualizada todo dia.
           </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 max-w-lg mx-auto">
                <Button
                  onClick={() => navigate("/agenda?view=today")}
                  className="w-full sm:w-auto sm:px-10 h-12 sm:h-13 rounded-full font-semibold text-base bg-primary text-primary-foreground hover:bg-primary/90 shadow-card transition-all"
                >
                  Ver o que tem hoje
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => navigate(user ? "/divulgador/status" : "/auth?redirect=/divulgador/status")}
                  className="w-full sm:w-auto sm:px-10 h-12 sm:h-13 rounded-full font-medium text-base text-foreground border border-accent hover:bg-muted transition-all"
                >
                  Área do Divulgador
                </Button>
            </div>
         </div>
 
        {/* Categories — minimal, monochrome chips */}
        <div className="flex gap-2 overflow-x-auto pb-6 mb-10 scrollbar-none">
          {genres.map((g) => (
            <button
              key={g.id}
              onClick={() => navigate(`/agenda?category=${g.id}`)}
              className="group inline-flex items-center gap-2 shrink-0 h-10 px-4 rounded-full border border-foreground/12 bg-transparent text-foreground/80 hover:text-foreground hover:border-foreground/30 transition-colors"
            >
              <g.icon className="h-3.5 w-3.5 opacity-70 group-hover:opacity-100" strokeWidth={1.75} />
              <span className="text-sm font-medium tracking-tight">{g.label}</span>
            </button>
          ))}
        </div>

        {/* Today's Events */}
        <section className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold font-display flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Acontece hoje na Ilha
            </h2>
            <Link to="/agenda" className="text-primary font-bold flex items-center">Ver tudo <ChevronRight className="h-4 w-4"/></Link>
          </div>
          {todayEvents.length > 0 ? (
            <div className="flex gap-6 overflow-x-auto pb-4 scrollbar-none">
              {todayEvents.map(ev => (
                <DiscoveryEventCard 
                  key={ev.id} 
                  event={ev} 
                  variant="compact"
                  onClick={() => navigate(`/agenda?event=${ev.id}`)}
                  isFavorite={favorites.includes(ev.id)}
                  onFavoriteToggle={() => toggleFavorite(ev.id)}
                  onShare={() => {
                    const data = getShareData(ev);
                    setShareData({ ...data, eventId: ev.id });
                  }}
                />
              ))}
            </div>
          ) : (
            <div className="bg-muted/30 rounded-3xl p-8 text-center border border-dashed border-primary/15">
              <Calendar className="h-8 w-8 text-primary/30 mx-auto mb-3" />
              <p className="text-muted-foreground text-sm mb-4">Hoje a Ilha está em recesso. Veja o que rola nos próximos dias.</p>
              <Button onClick={() => navigate("/agenda")} variant="outline" className="rounded-full font-bold">
                Ver próximos dias
              </Button>
            </div>
          )}
        </section>

        {/* Featured Events */}
        <section className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold font-display">Eventos em alta</h2>
            <Link to="/agenda" className="text-primary font-bold flex items-center">Ver tudo <ChevronRight className="h-4 w-4"/></Link>
          </div>
            <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6">
              {trendingEvents.map(ev => (
                <DiscoveryEventCard 
                  key={ev.id} 
                  event={ev} 
                  variant="compact"
                  className="w-full h-auto"
                  onClick={() => navigate(`/agenda?event=${ev.id}`)}
                  isFavorite={favorites.includes(ev.id)}
                  onFavoriteToggle={() => toggleFavorite(ev.id)}
                  onShare={() => {
                    const data = getShareData(ev);
                    setShareData({ ...data, eventId: ev.id });
                  }}
                />
              ))}
            </div>
           {hasNextPage && (
             <div ref={loadMoreRef} className="w-full py-10 flex justify-center">
               <Loader2 className="h-8 w-8 animate-spin text-primary" />
             </div>
           )}
        </section>

         {/* Recommendations AI Sections */}
         <section className="mb-12">
           <div className="flex items-center justify-between mb-6">
             <h2 className="text-2xl font-bold font-display flex items-center gap-2">
               <MapPin className="h-5 w-5 text-primary" />
               {user ? "No seu radar" : "Sugestões para você"}
             </h2>
             <Link to="/agenda" className="text-primary font-bold flex items-center">Ver tudo <ChevronRight className="h-4 w-4"/></Link>
           </div>
           
           {recommendedEvents.length > 0 ? (
            <div className="flex gap-6 overflow-x-auto pb-4 scrollbar-none">
              {recommendedEvents.map(ev => (
                <DiscoveryEventCard 
                  key={ev.id} 
                  event={ev} 
                  variant="compact"
                  onClick={() => navigate(`/agenda?event=${ev.id}`)}
                  isFavorite={favorites.includes(ev.id)}
                  onFavoriteToggle={() => toggleFavorite(ev.id)}
                  onShare={() => {
                    const data = getShareData(ev);
                    setShareData({ ...data, eventId: ev.id });
                  }}
                />
              ))}
            </div>
           ) : (
            <div className="bg-muted/30 rounded-3xl p-10 text-center border-2 border-dashed border-primary/10">
              <Sparkles className="h-10 w-10 text-primary/20 mx-auto mb-4" />
              <h3 className="text-lg font-bold text-foreground/80 mb-2">Ainda não temos sugestões personalizadas</h3>
              <p className="text-muted-foreground text-sm max-w-sm mx-auto mb-6">
                {!user 
                  ? "Crie uma conta e selecione seus bairros e estilos favoritos para que nossa IA recomende os melhores eventos para você."
                  : "Complete seu perfil com seus estilos musicais e locais favoritos para receber recomendações exclusivas."}
              </p>
              {!user ? (
                <Button onClick={() => navigate("/auth")} variant="outline" className="rounded-full font-bold">
                  Criar minha conta
                </Button>
              ) : (
                <Button onClick={() => setPersonalizationOpen(true)} variant="outline" className="rounded-full font-bold">
                  Definir Preferências
                </Button>
              )}
            </div>
           )}
         </section>

         {/* "Recomendado para você" removido: já coberto por "No seu radar" para evitar duplicação */}

        {/* Newsletter / Public Registration */}
        <section className="mb-12">
          <div className="bg-secondary/10 rounded-[2.5rem] p-8 sm:p-12 overflow-hidden relative">
            <div className="absolute -right-20 -top-20 h-64 w-64 bg-secondary/20 rounded-full blur-3xl" />
            <div className="relative z-10 max-w-2xl">
              <h2 className="text-3xl font-black font-display mb-4">Receba o rolê da Ilha no WhatsApp 🎸</h2>
              <p className="text-muted-foreground mb-8 text-lg">
                Toda semana, uma curadoria com o que está rolando do Galeão à Ribeira — direto no seu Zap.
              </p>
              <form onSubmit={handleNewsletterSubscribe} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Input 
                      placeholder="Seu nome" 
                      value={subscriberName}
                      onChange={(e) => setSubscriberName(e.target.value)}
                      className="h-14 px-6 rounded-2xl border-none bg-white/50 backdrop-blur-sm focus:ring-secondary/20"
                    />
                  </div>
                  <div className="space-y-1">
                    <Input 
                      type="tel" 
                      placeholder="WhatsApp (DDD + Número)" 
                      value={subscriberPhone}
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, "");
                        if (val.length <= 11) setSubscriberPhone(val);
                      }}
                      required
                      className="h-14 px-6 rounded-2xl border-none bg-white/50 backdrop-blur-sm focus:ring-secondary/20"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="flex-1">
                    <label htmlFor="subscriber-neighborhood" className="block text-xs font-semibold text-foreground/70 mb-1.5 px-1">
                      Seu bairro <span className="font-normal text-foreground/50">(opcional)</span>
                    </label>
                    <Select 
                      value={subscriberNeighborhood}
                      onValueChange={setSubscriberNeighborhood}
                    >
                      <SelectTrigger id="subscriber-neighborhood" className="h-14 px-6 rounded-2xl border-none bg-white/50 backdrop-blur-sm focus:ring-secondary/20">
                        <SelectValue placeholder="Escolha seu bairro" />
                      </SelectTrigger>
                      <SelectContent>
                        {["Bancários", "Cacuia", "Cidade Universitária", "Cocotá", "Freguesia", "Galeão", "Jardim Carioca", "Jardim Guanabara", "Moneró", "Pitangueiras", "Portuguesa", "Praia da Bandeira", "Ribeira", "Tauá", "Zumbi"].sort().map(n => (
                          <SelectItem key={n} value={n}>{n}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex flex-col justify-end px-1 sm:px-4">
                    <div className="flex items-start gap-2 bg-white/40 sm:bg-transparent rounded-xl p-3 sm:p-0">
                      <input 
                        type="checkbox" 
                        id="whatsapp-consent-landing" 
                        checked={whatsappConsent}
                        onChange={(e) => setWhatsappConsent(e.target.checked)}
                        className="mt-0.5 h-4 w-4 shrink-0 rounded border-gray-300 text-secondary focus:ring-secondary/20 accent-secondary"
                      />
                      <label htmlFor="whatsapp-consent-landing" className="text-xs sm:text-xs font-medium text-foreground/75 leading-snug cursor-pointer break-words">
                        Autorizo receber notificações, sugestões e promoções pelo WhatsApp.
                      </label>
                    </div>
                  </div>
                </div>
                <div className="pt-2">
                  <Button 
                    type="submit" 
                    disabled={isSubscribing}
                    className="w-full h-14 rounded-2xl font-semibold text-base tracking-tight bg-foreground hover:bg-secondary text-background shadow-card flex items-center justify-center gap-2 transition-all hover:scale-[1.01] active:scale-[0.99]"
                  >
                    {isSubscribing ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <MessageCircle className="h-6 w-6 fill-white" />
                    )}
                    {isSubscribing ? "Cadastrando..." : "Cadastrar"}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </section>

        {/* Map Explorer CTA */}
        <section className="rounded-3xl bg-secondary/5 p-8 flex flex-col sm:flex-row items-center justify-between mb-16 border border-secondary/10 gap-6">
          <div className="text-center sm:text-left">
            <h3 className="text-xl font-bold mb-2">Explore a Ilha no mapa</h3>
            <p className="text-muted-foreground text-sm">Bares, shows e pontos culturais entre Jardim Guanabara, Cocotá, Cacuia e arredores.</p>
          </div>
          <Button 
            variant="secondary" 
            className="rounded-full h-12 px-8 shadow-md border border-secondary/20 font-bold hover:scale-105 transition-all"
            onClick={() => window.open("https://www.google.com/maps/search/eventos+e+bares+na+ilha+do+governador+rio+de+janeiro", "_blank")}
          >
            <MapIcon className="mr-2 h-4 w-4"/> Abrir Mapa
          </Button>
        </section>
      </section>

      <footer className="py-16 px-6 border-t border-border/40 bg-card/30">
        <div className="mx-auto max-w-6xl flex flex-col gap-8">
          <nav className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm font-medium text-foreground/70">
            <Link to="/agenda" className="hover:text-primary transition-colors">Agenda</Link>
            <Link to="/coe-a-boa" className="hover:text-primary transition-colors">Coé a Boa?</Link>
            <Link to="/agenda" className="hover:text-primary transition-colors">Agenda Cultural</Link>
            <Link to="/auth" className="hover:text-primary transition-colors">Divulgue seu evento</Link>
            <a href="#contato" className="hover:text-primary transition-colors">Contato</a>
          </nav>

          <div className="grid grid-cols-1 sm:grid-cols-3 items-center gap-4 pt-6 border-t border-border/40 text-center sm:text-left">
            {/* Copyright */}
            <div className="text-xs text-foreground/60 font-medium order-2 sm:order-1">
              © {new Date().getFullYear()} — Todos os direitos reservados
            </div>

            {/* Marca / Slogan */}
            <div className="flex items-center justify-center gap-2 order-1 sm:order-2">
              <img src={logo} alt="Coé a Boa? — Agendilha" className="h-7 w-7 rounded-full ring-1 ring-primary/15" />
              <div className="leading-tight">
                <div className="font-display text-sm font-black text-foreground tracking-tight">
                  Coé a Boa? <span className="text-foreground/30">•</span> Agendilha
                </div>
                <div className="text-[10px] uppercase tracking-[0.25em] text-foreground/40 font-semibold">
                  Transparência e Cultura
                </div>
              </div>
            </div>

            {/* Créditos */}
            <div className="text-xs text-foreground/60 font-medium order-3 sm:text-right">
              Criado por{" "}
              <a
                href="https://limaxsistemas.online/"
                target="_blank"
                rel="noreferrer"
                className="font-bold text-foreground/80 hover:text-primary transition-colors hover:underline"
              >
                Lima<span className="text-orange-500">X</span> Soluções
              </a>
            </div>
          </div>
        </div>
      </footer>

      <Suspense fallback={null}>
        
        <PersonalizationDialog open={personalizationOpen} onOpenChange={setPersonalizationOpen} />
        {shareData && (
          <ShareDialog
            open={!!shareData}
            onOpenChange={(open) => !open && setShareData(null)}
            title={shareData.title}
            text={shareData.text}
            url={shareData.url}
          />
        )}
      </Suspense>
    </div>
  );
}

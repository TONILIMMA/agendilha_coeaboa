 import { useEffect, useRef, useState, useCallback } from "react";
 import { useInfiniteQuery } from "@tanstack/react-query";
 import { useInView } from "react-intersection-observer";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useProfile } from "@/hooks/useProfile";
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
  Search,
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
  CheckCircle2
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
import logo from "@/assets/coeaboa-logo.jpg";
import { Onboarding } from "@/components/Onboarding";
import { PersonalizationDialog } from "@/components/PersonalizationDialog";
import { ShareDialog } from "@/components/ShareDialog";
import { getShareData } from "@/lib/sharing";
import { Settings2 } from "lucide-react";

const sitelinks = [
  { href: "#oferecemos", label: "O que oferecemos" },
  { href: "#ecossistema", label: "Ecossistema" },
  { href: "#diferenciais", label: "Diferenciais" },
  { href: "#contato", label: "Contato" },
];

const genres = [
  { id: "musica", label: "Shows & Música", icon: Music, color: "bg-blue-500" },
  { id: "cultura", label: "Cultura & Arte", icon: Sparkles, color: "bg-purple-500" },
  { id: "gastronomia", label: "Gastronomia", icon: Globe2, color: "bg-orange-500" },
  { id: "outros", label: "Outros", icon: Megaphone, color: "bg-pink-500" },
  { id: "esporte", label: "Esportes", icon: Calendar, color: "bg-green-500" },
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
         .from("submissions")
         .select("id, event_title, date, start_time, end_time, location, address_street, address_neighborhood, category, image_url, is_highlight, atrativo_style, description, age_rating, is_suitable_for_minors")
         .eq('status', 'published')
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
  const [searchQuery, setSearchQuery] = useState("");
  const [favorites, setFavorites] = useState<string[]>(() => {
    const saved = localStorage.getItem("agendilha_favorites");
    return saved ? JSON.parse(saved) : [];
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
      localStorage.setItem("agendilha_favorites", JSON.stringify(next));
      return next;
    });
  };

  const handleNewsletterSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subscriberPhone) return;
    
    if (!whatsappConsent) {
      toast.error("É necessário autorizar o contato pelo WhatsApp.");
      return;
    }

    setIsSubmitting(true);
    try {
      // Standardize phone
      const cleanPhone = subscriberPhone.replace(/\D/g, "");
      
      const { error } = await supabase
        .from("newsletter_subscribers")
        .insert({ 
          email: `${cleanPhone}@whatsapp.agendilha.app`,
          name: subscriberName,
          neighborhood: subscriberNeighborhood || null
        } as any); // Cast to any to avoid strict type mismatch with existing supabase types

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
       <section className="pt-24 sm:pt-40 pb-12 px-4 max-w-6xl mx-auto">
         <div className="text-center mb-10 animate-in fade-in slide-in-from-top-4 duration-1000">
           <div className="inline-flex items-center justify-center px-4 py-1.5 rounded-full bg-primary/5 border border-primary/10 mb-6 shadow-sm">
             <span className="text-[10px] sm:text-xs font-black uppercase tracking-[0.2em] text-primary/70">AgendIlha · Coé a Boa?</span>
           </div>
           <h1 className="text-3xl xs:text-4xl sm:text-7xl font-black mb-6 font-display text-primary tracking-tightest leading-[1.1] sm:leading-[0.9]">
             O que tem pra<br /><span className="text-secondary">hoje na Ilha?</span> 🌴
           </h1>
           <p className="text-muted-foreground text-base sm:text-xl font-medium max-w-xl mx-auto mb-8 text-balance leading-relaxed">
             A agenda cultural definitiva da Ilha do Governador. Shows, gastronomia e eventos em um só lugar.
           </p>
           
            <div className="flex flex-col items-center gap-4 max-w-lg mx-auto">
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 w-full">
                <Button 
                  onClick={() => navigate("/agenda")}
                  className="w-full sm:flex-1 h-14 rounded-full font-black text-lg gradient-sunset shadow-xl hover:scale-[1.03] active:scale-95 transition-all uppercase tracking-wider"
                >
                  Explorar Agenda
                </Button>
                {!user ? (
                  <Button 
                    variant="outline"
                    onClick={() => navigate("/auth")}
                    className="w-full sm:flex-1 h-14 rounded-full font-bold text-lg border-2 border-primary/20 text-primary bg-white/50 hover:bg-primary/5 transition-all shadow-md"
                  >
                    Criar conta
                  </Button>
                ) : (
                  <Button 
                    variant="outline"
                    onClick={() => navigate("/enviar-evento")}
                    className="w-full sm:flex-1 h-14 rounded-full font-bold text-lg border-2 border-primary/20 text-primary bg-white/50 hover:bg-primary/5 transition-all shadow-md"
                  >
                    Divulgar Evento
                  </Button>
                )}
              </div>
              
              <button
                className="text-[10px] sm:text-xs font-black uppercase tracking-widest text-secondary hover:text-primary transition-colors mt-2 underline underline-offset-4"
                onClick={() => setPersonalizationOpen(true)}
              >
                Personalizar Recomendações
              </button>
            </div>
         </div>
 
         <form 
           onSubmit={(e) => {
             e.preventDefault();
             if (searchQuery.trim()) navigate(`/agenda?search=${encodeURIComponent(searchQuery)}`);
           }}
           className="relative mb-16 max-w-3xl mx-auto reveal"
         >
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-primary/60" />
          <Input 
            placeholder="O que você está procurando? (shows, festas, bares...)" 
            className="h-14 pl-12 pr-4 rounded-full border-2 border-primary/10 bg-white shadow-lg text-lg focus:border-primary/30 transition-all"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <Button 
            type="submit"
            className="absolute right-2 top-1/2 -translate-y-1/2 h-10 rounded-full bg-primary text-white font-bold px-6 hidden sm:flex"
          >
            Buscar
          </Button>
        </form>

        {/* Categories */}
        <div className="flex gap-4 overflow-x-auto pb-6 mb-8 scrollbar-none">
          {genres.map((g) => (
             <Button 
               key={g.id} 
               variant="outline" 
               className="rounded-full gap-2 px-5 sm:px-6 h-12 shadow-sm shrink-0 border-border/50 hover:bg-primary/5 hover:border-primary/20 transition-all"
               onClick={() => navigate(`/agenda?category=${g.id}`)}
             >
               <div className={cn("p-1.5 rounded-full text-white", g.color)}>
                 <g.icon className="h-3.5 w-3.5" />
               </div>
               <span className="text-xs sm:text-sm font-bold">{g.label}</span>
             </Button>
          ))}
        </div>

        {/* Today's Events */}
        {todayEvents.length > 0 && (
          <section className="mb-12">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold font-display flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                Acontece hoje
              </h2>
              <Link to="/agenda" className="text-primary font-bold flex items-center">Ver tudo <ChevronRight className="h-4 w-4"/></Link>
            </div>
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
          </section>
        )}

        {/* Featured Events */}
        <section className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold font-display">Eventos em alta</h2>
            <Link to="/agenda" className="text-primary font-bold flex items-center">Ver tudo <ChevronRight className="h-4 w-4"/></Link>
          </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6">
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

         {user && recommendedEvents.length > 0 && (
           <section className="mb-12">
             <div className="flex items-center justify-between mb-6">
               <h2 className="text-2xl font-bold font-display flex items-center gap-2">
                 <Sparkles className="h-5 w-5 text-primary" />
                 Recomendado para você
               </h2>
             </div>
             <div className="flex gap-6 overflow-x-auto pb-4 scrollbar-none">
               {recommendedEvents.slice(0, 5).map(ev => (
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
           </section>
         )}

        {/* Newsletter / Public Registration */}
        <section className="mb-12">
          <div className="bg-secondary/10 rounded-[2.5rem] p-8 sm:p-12 overflow-hidden relative">
            <div className="absolute -right-20 -top-20 h-64 w-64 bg-secondary/20 rounded-full blur-3xl" />
            <div className="relative z-10 max-w-2xl">
              <h2 className="text-3xl font-black font-display mb-4">Fique por dentro da Ilha 🎸</h2>
              <p className="text-muted-foreground mb-8 text-lg">
                Não perca nenhum show ou evento cultural. Cadastre-se para receber as novidades semanalmente.
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
                    <Select 
                      value={subscriberNeighborhood}
                      onValueChange={setSubscriberNeighborhood}
                    >
                      <SelectTrigger className="h-14 px-6 rounded-2xl border-none bg-white/50 backdrop-blur-sm focus:ring-secondary/20">
                        <SelectValue placeholder="Seu bairro (opcional)" />
                      </SelectTrigger>
                      <SelectContent>
                        {["Bancários", "Cacuia", "Cidade Universitária", "Cocotá", "Freguesia", "Galeão", "Jardim Carioca", "Jardim Guanabara", "Moneró", "Pitangueiras", "Portuguesa", "Praia da Bandeira", "Ribeira", "Tauá", "Zumbi"].sort().map(n => (
                          <SelectItem key={n} value={n}>{n}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex flex-col justify-center px-4">
                    <div className="flex items-center space-x-2">
                      <input 
                        type="checkbox" 
                        id="whatsapp-consent-landing" 
                        checked={whatsappConsent}
                        onChange={(e) => setWhatsappConsent(e.target.checked)}
                        className="h-4 w-4 rounded border-gray-300 text-secondary focus:ring-secondary/20 accent-secondary"
                      />
                      <label htmlFor="whatsapp-consent-landing" className="text-[11px] sm:text-xs font-medium text-foreground/70 leading-tight cursor-pointer">
                        Autorizo receber notificações, sugestões e promoções pelo WhatsApp.
                      </label>
                    </div>
                  </div>
                </div>
                <div className="pt-2">
                  <Button 
                    type="submit" 
                    disabled={isSubscribing}
                    className="w-full h-14 rounded-2xl font-black text-lg bg-[#25D366] hover:bg-[#20ba5a] text-white shadow-lg shadow-green-200/50 flex items-center justify-center gap-2 transition-all hover:scale-[1.02] active:scale-95"
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
            <h3 className="text-xl font-bold mb-2">Explore no Mapa</h3>
            <p className="text-muted-foreground text-sm">Localize bares, eventos e pontos culturais da Ilha do Governador.</p>
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
        <div className="mx-auto max-w-6xl flex flex-col items-center gap-8">
          <div className="flex flex-col items-center gap-6 text-center">
            <div className="inline-flex items-center gap-3 px-6 py-4 rounded-[2rem] glass border border-white/20 shadow-sm">
              <img src={logo} alt="Coé a Boa?" className="h-8 w-8 rounded-full ring-2 ring-primary/10" />
              <div className="flex flex-col items-start leading-none gap-0.5">
                <div className="flex items-center gap-1.5">
                  <span className="font-display text-base font-black text-primary tracking-tight">AgendIlha</span>
                  <span className="h-1 w-1 rounded-full bg-secondary/40" />
                  <span className="font-display text-sm font-bold text-secondary tracking-tight">Coé a Boa?</span>
                </div>
              </div>
            </div>
            
            <div className="text-[10px] text-foreground/30 font-mono uppercase tracking-[0.4em]">
              © {new Date().getFullYear()} — Ilha do Governador, RJ
            </div>
            <div className="mt-3 text-[11px] text-foreground/50 font-medium">
              ©2026 criado por <span className="font-bold text-foreground/80">TONI LIMA</span> — <a href="https://vexo-sistemas.lovable.app" target="_blank" rel="noreferrer" className="hover:text-primary transition-colors hover:underline">Vexo Sistemas</a>
            </div>
          </div>
        </div>
      </footer>

      <Onboarding />
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
    </div>
  );
}

import { useEffect, useRef, useState } from "react";
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
} from "lucide-react";
import { DiscoveryEventCard } from "@/components/DiscoveryEventCard";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import Header from "@/components/Header";
import logo from "@/assets/coeaboa-logo.jpg";

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
  const [events, setEvents] = useState<any[]>([]);
  const [todayEvents, setTodayEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [favorites, setFavorites] = useState<string[]>(() => {
    const saved = localStorage.getItem("agendilha_favorites");
    return saved ? JSON.parse(saved) : [];
  });
  const [subscriberEmail, setSubscriberEmail] = useState("");
  const [subscriberName, setSubscriberName] = useState("");
  const [isSubscribing, setIsSubmitting] = useState(false);

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
    if (!subscriberEmail) return;
    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from("newsletter_subscribers")
        .insert({ 
          email: subscriberEmail, 
          name: subscriberName,
          neighborhood: (window as any)._last_neighborhood || null
        });

      if (error) {
        if (error.code === "23505") {
          toast.info("Você já está cadastrado!");
        } else {
          throw error;
        }
      } else {
        toast.success("Inscrição realizada com sucesso!", {
          description: "Você receberá as novidades de shows e eventos."
        });
        setSubscriberEmail("");
        setSubscriberName("");
      }
    } catch (err) {
      console.error(err);
      toast.error("Erro ao realizar inscrição.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const [recommendedEvents, setRecommendedEvents] = useState<any[]>([]);

  useEffect(() => {
    async function loadEventsData() {
      const today = new Date().toISOString().split('T')[0];
      
      let query = supabase
        .from("submissions")
        .select("*")
        .eq('status', 'published')
        .order('date', { ascending: true });

      const { data: allPublished } = await query;

      if (allPublished) {
        setEvents(allPublished.slice(0, 10));
        setTodayEvents(allPublished.filter(e => e.date === today));
        
        // Simple IA recommendation logic
        if (profileLoaded && user) {
          const prefs = profile.musical_preferences || [];
          const home = profile.home_location;
          const work = profile.work_neighborhood;
          
          const recs = allPublished.filter(ev => {
            const matchStyle = prefs.some(p => ev.atrativo_style?.toLowerCase().includes(p.toLowerCase()));
            const matchNeighborhood = ev.address_neighborhood === home || ev.address_neighborhood === work;
            return matchStyle || matchNeighborhood;
          }).slice(0, 5);
          
          setRecommendedEvents(recs.length > 0 ? recs : allPublished.slice(0, 5));
        } else {
          setRecommendedEvents(allPublished.slice(0, 5));
        }
      }
      setLoading(false);
    }
    loadEventsData();
  }, [profileLoaded, user, profile.musical_preferences, profile.home_location, profile.work_neighborhood]);

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
       <section className="pt-28 sm:pt-40 pb-16 px-4 max-w-6xl mx-auto">
         <div className="text-center mb-12 animate-in fade-in slide-in-from-top-4 duration-1000">
           <div className="inline-flex items-center justify-center px-4 py-1.5 rounded-full bg-primary/5 border border-primary/10 mb-6 shadow-sm">
             <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary/70">Agenda Cultural da Ilha do Governador</span>
           </div>
           <h1 className="text-5xl sm:text-7xl font-black mb-6 font-display text-primary tracking-tightest leading-[0.9]">
             O que tem pra<br /><span className="text-secondary">hoje na Ilha?</span> 🌴
           </h1>
           <p className="text-muted-foreground text-lg sm:text-xl font-medium max-w-xl mx-auto mb-10 text-balance leading-relaxed">
             Shows, gastronomia e eventos. Tudo o que você precisa saber sobre a vida cultural da região.
           </p>
           
           <div className="flex flex-col sm:flex-row items-center justify-center gap-4 max-w-lg mx-auto">
             <Button 
               onClick={() => navigate("/agenda")}
               className="w-full sm:flex-1 h-14 rounded-full font-black text-lg gradient-sunset shadow-xl hover:scale-105 active:scale-95 transition-all uppercase tracking-wider"
             >
               Explorar Agenda
             </Button>
             {!user && (
               <Button 
                 variant="outline"
                 onClick={() => navigate("/auth")}
                 className="w-full sm:flex-1 h-14 rounded-full font-bold text-lg border-2 border-primary/20 text-primary bg-white/50 hover:bg-primary/5 transition-all shadow-md"
               >
                 Criar conta
               </Button>
             )}
           </div>
         </div>
 
         <div className="relative mb-16 max-w-3xl mx-auto reveal">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input 
            placeholder="Shows, teatros, festas..." 
            className="h-14 pl-12 rounded-full border-0 bg-secondary/10 text-lg shadow-sm"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Categories */}
        <div className="flex gap-4 overflow-x-auto pb-6 mb-8 scrollbar-none">
          {genres.map((g) => (
            <Button 
              key={g.id} 
              variant="outline" 
              className="rounded-full gap-2 px-6 h-12 shadow-sm shrink-0 border-border/50"
              onClick={() => navigate(`/agenda?category=${g.id}`)}
            >
              <div className={cn("p-1.5 rounded-full text-white", g.color)}>
                <g.icon className="h-3 w-3" />
              </div>
              {g.label}
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
                onClick={() => navigate(`/agenda?event=${ev.id}`)}
                isFavorite={favorites.includes(ev.id)}
                onFavoriteToggle={() => toggleFavorite(ev.id)}
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
          <div className="flex gap-6 overflow-x-auto pb-4 scrollbar-none">
            {events.map(ev => (
              <DiscoveryEventCard 
                key={ev.id} 
                event={ev} 
                onClick={() => navigate(`/agenda?event=${ev.id}`)}
                isFavorite={favorites.includes(ev.id)}
                onFavoriteToggle={() => toggleFavorite(ev.id)}
              />
            ))}
          </div>
        </section>

        {/* Recommendations AI Sections */}
        {events.length > 0 && (
          <>
            <section className="mb-12">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold font-display flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-primary" />
                  {user ? "No seu radar" : "Eventos perto de você"}
                </h2>
                <Link to="/agenda" className="text-primary font-bold flex items-center">Ver tudo <ChevronRight className="h-4 w-4"/></Link>
              </div>
              <div className="flex gap-6 overflow-x-auto pb-4 scrollbar-none">
                {recommendedEvents.map(ev => (
                  <DiscoveryEventCard 
                    key={ev.id} 
                    event={ev} 
                    onClick={() => navigate(`/agenda?event=${ev.id}`)}
                    isFavorite={favorites.includes(ev.id)}
                    onFavoriteToggle={() => toggleFavorite(ev.id)}
                  />
                ))}
              </div>
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
                  {recommendedEvents.slice(0, 3).map(ev => (
                    <DiscoveryEventCard 
                      key={ev.id} 
                      event={ev} 
                      variant="small"
                      onClick={() => navigate(`/agenda?event=${ev.id}`)}
                      isFavorite={favorites.includes(ev.id)}
                      onFavoriteToggle={() => toggleFavorite(ev.id)}
                    />
                  ))}
                </div>
              </section>
            )}
          </>
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
                  <Input 
                    placeholder="Seu nome" 
                    value={subscriberName}
                    onChange={(e) => setSubscriberName(e.target.value)}
                    className="h-14 px-6 rounded-2xl border-none bg-white/50 backdrop-blur-sm"
                  />
                  <Input 
                    type="email" 
                    placeholder="Seu e-mail" 
                    value={subscriberEmail}
                    onChange={(e) => setSubscriberEmail(e.target.value)}
                    required
                    className="h-14 px-6 rounded-2xl border-none bg-white/50 backdrop-blur-sm"
                  />
                </div>
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="flex-1">
                    <Select onValueChange={(val) => {
                      (window as any)._last_neighborhood = val;
                    }}>
                      <SelectTrigger className="h-14 px-6 rounded-2xl border-none bg-white/50 backdrop-blur-sm">
                        <SelectValue placeholder="Seu bairro (opcional)" />
                      </SelectTrigger>
                      <SelectContent>
                        {["Bancários", "Cacuia", "Cidade Universitária", "Cocotá", "Freguesia", "Galeão", "Jardim Carioca", "Jardim Guanabara", "Moneró", "Pitangueiras", "Portuguesa", "Praia da Bandeira", "Ribeira", "Tauá", "Zumbi"].sort().map(n => (
                          <SelectItem key={n} value={n}>{n}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Button 
                    type="submit" 
                    disabled={isSubscribing}
                    className="h-14 px-10 rounded-2xl font-black text-lg gradient-sunset shadow-lg"
                  >
                    {isSubscribing ? "Salvando..." : "Cadastrar"}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </section>

        {/* Map Placeholder */}
        <section className="rounded-3xl bg-muted/30 p-8 flex items-center justify-between mb-12 border border-border/50">
          <div>
            <h3 className="text-xl font-bold mb-2">Explore no Mapa</h3>
            <p className="text-muted-foreground">Veja o que está acontecendo perto de você</p>
          </div>
          <Button variant="secondary" className="rounded-full h-12 px-6 shadow-sm border border-border/40"><MapIcon className="mr-2 h-4 w-4"/> Abrir Mapa</Button>
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
          </div>
        </div>
      </footer>
    </div>
  );
}

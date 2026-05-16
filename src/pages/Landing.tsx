import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
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
} from "lucide-react";
import { DiscoveryEventCard } from "@/components/DiscoveryEventCard";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  { label: "Shows & Música", icon: Music, color: "bg-blue-500" },
  { label: "Cultura & Arte", icon: Sparkles, color: "bg-purple-500" },
  { label: "Gastronomia", icon: Globe2, color: "bg-orange-500" },
  { label: "Festas & Noite", icon: Megaphone, color: "bg-pink-500" },
  { label: "Esportes", icon: Calendar, color: "bg-green-500" },
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
  const navigate = useNavigate();
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [favorites, setFavorites] = useState<string[]>([]);

  useEffect(() => {
    async function loadEvents() {
      const { data } = await supabase
        .from("submissions")
        .select("*")
        .eq('status', 'published')
        .order('date', { ascending: true })
        .limit(10);
      
      if (data) setEvents(data);
      setLoading(false);
    }
    loadEvents();
  }, []);

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
      <section className="pt-24 pb-12 px-4 max-w-6xl mx-auto">
        <h1 className="text-4xl font-black mb-8 font-display">Descubra a Ilha 🌴</h1>
        <div className="relative mb-10">
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
            <Button key={g.label} variant="outline" className="rounded-full gap-2 px-6 h-12 shadow-sm shrink-0 border-border/50">
              <div className={cn("p-1.5 rounded-full text-white", g.color)}>
                <g.icon className="h-3 w-3" />
              </div>
              {g.label}
            </Button>
          ))}
        </div>

        {/* Featured Events */}
        <section className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold font-display">Eventos em alta</h2>
            <Link to="/agenda" className="text-primary font-bold flex items-center">Ver tudo <ChevronRight className="h-4 w-4"/></Link>
          </div>
          <div className="flex gap-6 overflow-x-auto pb-4 scrollbar-none">
            {events.map(ev => <DiscoveryEventCard key={ev.id} event={ev} onClick={() => navigate(`/agenda?event=${ev.id}`)} />)}
          </div>
        </section>

        {/* Map Placeholder */}
        <section className="rounded-3xl bg-secondary/10 p-8 flex items-center justify-between mb-12">
          <div>
            <h3 className="text-xl font-bold mb-2">Explore no Mapa</h3>
            <p className="text-muted-foreground">Veja o que está acontecendo perto de você</p>
          </div>
          <Button variant="secondary" className="rounded-full h-12 px-6 shadow-sm"><MapIcon className="mr-2 h-4 w-4"/> Abrir Mapa</Button>
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

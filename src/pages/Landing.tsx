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


      {/* ── Marquee de categorias ── */}
      <section className="py-8 sm:py-10 border-y border-border/60 bg-card overflow-hidden">
        <div className="flex marquee-track whitespace-nowrap">
          {[...marqueeWords, ...marqueeWords].map((w, i) => (
            <span key={i} className="flex items-center gap-6 px-6 font-display text-3xl sm:text-5xl font-medium text-foreground/30">
              {w}
              <span className="text-secondary">✦</span>
            </span>
          ))}
        </div>
      </section>

      {/* ── O que oferecemos ── */}
      <section id="oferecemos" className="py-24 sm:py-32 bg-background">
        <div className="mx-auto max-w-5xl px-6">
          <div className="max-w-2xl reveal">
            <p className="font-mono text-[10px] tracking-[0.25em] uppercase text-secondary">— O que oferecemos</p>
            <h2 className="mt-6 font-display text-4xl sm:text-6xl font-medium tracking-tightest leading-[0.98] text-balance">
              Uma plataforma feita para a{" "}
              <span className="font-serif italic font-normal text-primary">cultura local</span>.
            </h2>
            <p className="mt-7 text-foreground/65 text-base sm:text-lg max-w-xl leading-relaxed">
              Da curadoria à divulgação: tudo que você precisa para promover eventos
              da Ilha do Governador com clareza, elegância e alcance real.
            </p>
          </div>
        </div>
      </section>

      {/* ── Ecossistema ── */}
      <section id="ecossistema" className="relative py-24 sm:py-32 gradient-eco grain">
        <div className="mx-auto max-w-6xl">
          <div className="mb-14 sm:mb-20 reveal px-6 max-w-3xl">
            <p className="font-mono text-[10px] tracking-[0.25em] uppercase text-secondary">— Ecossistema</p>
            <h2 className="mt-6 font-display text-4xl sm:text-6xl font-medium tracking-tightest leading-[0.98]">
              Pessoas, eventos e tecnologia{" "}
              <span className="font-serif italic font-normal text-primary">em harmonia</span>.
            </h2>
          </div>

          <div
            className="
              flex sm:grid sm:grid-cols-2 lg:grid-cols-3
              gap-4
              overflow-x-auto sm:overflow-visible
              snap-x snap-mandatory sm:snap-none
              scroll-px-6 px-6
              pb-4 sm:pb-0
              scrollbar-none
              [-webkit-overflow-scrolling:touch]
            "
          >
            {ecosystem.map((c, i) => (
              <div
                key={c.title}
                className="
                  reveal group relative overflow-hidden
                  rounded-3xl p-7 sm:p-8
                  bg-card/80 backdrop-blur-xl border border-white/60
                  shadow-card hover:shadow-elevated
                  transition-all duration-700
                  hover:-translate-y-1
                  shrink-0 sm:shrink basis-[80%] xs:basis-[70%] sm:basis-auto
                  snap-start
                "
                style={{ transitionDelay: `${i * 70}ms` }}
              >
                <div className="flex items-start justify-between mb-10">
                  <div className="inline-flex items-center justify-center h-11 w-11 rounded-2xl bg-primary/[0.06] text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors duration-500">
                    <c.icon className="h-[18px] w-[18px]" strokeWidth={1.5} />
                  </div>
                  <span className="font-mono text-[10px] tabular-nums text-foreground/30 tracking-wider">
                    {String(i + 1).padStart(2, "0")} / {String(ecosystem.length).padStart(2, "0")}
                  </span>
                </div>
                <h3 className="font-display text-2xl font-medium text-foreground tracking-tight">{c.title}</h3>
                <p className="mt-2.5 text-sm text-foreground/60 leading-relaxed">{c.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Diferenciais ── */}
      <section id="diferenciais" className="py-24 sm:py-32 bg-background">
        <div className="mx-auto max-w-5xl px-6">
          <div className="text-center mb-16 reveal max-w-xl mx-auto">
            <p className="font-mono text-[10px] tracking-[0.25em] uppercase text-secondary">— Diferenciais</p>
            <h2 className="mt-6 font-display text-4xl sm:text-6xl font-medium tracking-tightest">
            Por que o{" "}
            <span className="font-serif italic font-normal text-primary">AgendIlha?</span>
            </h2>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-px bg-border/70 rounded-3xl overflow-hidden border border-border/70">
            {differentials.map((d, i) => (
              <div
                key={d.title}
                className="reveal text-center p-8 bg-card hover:bg-muted transition-colors duration-500"
                style={{ transitionDelay: `${i * 80}ms` }}
              >
                <div className="mx-auto inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/[0.06] text-primary mb-4">
                  <d.icon className="h-5 w-5" strokeWidth={1.5} />
                </div>
                <h3 className="font-display text-lg font-medium text-foreground tracking-tight">{d.title}</h3>
                <p className="mt-1.5 text-[13px] text-foreground/60">{d.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Agenda CTA ── */}
      <section className="py-20 sm:py-28 bg-background">
        <div className="mx-auto max-w-5xl px-6 reveal">
          <div className="relative overflow-hidden rounded-[2rem] gradient-eco-deep text-primary-foreground p-10 sm:p-16 grain">
            <div aria-hidden className="absolute -top-20 -right-20 h-72 w-72 rounded-full bg-secondary/20 blur-3xl" />
            <div aria-hidden className="absolute -bottom-20 -left-10 h-60 w-60 rounded-full bg-white/5 blur-3xl" />

            <div className="relative flex flex-col lg:flex-row items-start lg:items-end gap-10 justify-between">
              <div className="max-w-xl">
                <p className="font-mono text-[10px] tracking-[0.25em] uppercase text-primary-foreground/60">— Agenda Cultural</p>
                <h3 className="mt-5 font-display text-4xl sm:text-6xl font-medium tracking-tightest leading-[0.95] text-balance">
                  Exporte. Compartilhe.{" "}
                  <span className="font-serif italic font-normal text-secondary">Divulgue.</span>
                </h3>
                <p className="mt-6 text-primary-foreground/70 text-base leading-relaxed max-w-md">
                  Gere a Agenda Cultural em PDF ou crie uma landing page para divulgar
                  via WhatsApp, redes sociais ou imprensa.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-3 shrink-0 w-full lg:w-auto">
                 <Link to="/agenda" className="w-full sm:w-auto">
                  <Button className="w-full sm:w-auto rounded-full h-12 px-8 bg-white text-primary hover:bg-white/95 transition-all duration-200 hover:scale-[1.05] active:scale-[0.98] font-black shadow-lg border-2 border-white">
                    Abrir agenda
                  </Button>
                </Link>
                <Link to="/agenda" className="w-full sm:w-auto">
                  <Button variant="outline" className="w-full sm:w-auto rounded-full h-12 px-8 bg-transparent border-white text-white hover:bg-white/10 transition-all duration-200 hover:scale-[1.05] active:scale-[0.98] font-black border-2">
                    <FileDown className="h-4 w-4 mr-2" /> Baixar PDF
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Contato ── */}
      <section id="contato" className="py-24 sm:py-32 bg-background">
        <div className="mx-auto max-w-2xl px-6 text-center reveal">
          <p className="font-mono text-[10px] tracking-[0.25em] uppercase text-secondary">— Contato</p>
          <h3 className="mt-6 font-display text-4xl sm:text-6xl font-medium tracking-tightest leading-[0.98] text-balance">
            Vamos{" "}
            <span className="font-serif italic font-normal text-primary">conversar?</span>
          </h3>
          <p className="mt-7 text-foreground/65 text-base leading-relaxed max-w-md mx-auto">
            Tem um evento, parceria ou ideia? Nossa equipe está pronta para te atender.
          </p>
          <div className="mt-12">
            <a
              href="https://wa.me/5521999999999?text=Ol%C3%A1%2C%20quero%20saber%20mais%20sobre%20o%20AgendIlha"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button size="lg" className="rounded-full h-14 px-10 bg-primary text-primary-foreground hover:bg-primary/90 shadow-elevated font-display font-black text-lg transition-transform hover:scale-105 active:scale-95 border-2 border-primary">
                <MessageCircle className="h-5 w-5 mr-3" />
                Falar no WhatsApp
              </Button>
            </a>
          </div>
        </div>
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

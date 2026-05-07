import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
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
  ArrowUpRight,
  Menu,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
 import Header from "@/components/Header";
import logo from "@/assets/coeaboa-logo.jpg";

const sitelinks = [
  { href: "#oferecemos", label: "O que oferecemos" },
  { href: "#ecossistema", label: "Ecossistema" },
  { href: "#diferenciais", label: "Diferenciais" },
  { href: "#contato", label: "Contato" },
];

const ecosystem = [
  { icon: Calendar, title: "Agenda Cultural", desc: "Eventos da Ilha do Governador organizados por categoria, data e local." },
  { icon: Megaphone, title: "Divulgação Inteligente", desc: "Compartilhe via WhatsApp, exporte PDFs prontos ou gere uma landing page." },
  { icon: Users2, title: "Rede de Divulgadores", desc: "Espaço onde produtores, marcas e a comunidade somam forças." },
  { icon: FileDown, title: "Relatórios em PDF", desc: "Material pronto para imprensa, parceiros e grupos de WhatsApp." },
  { icon: Sparkles, title: "IA para Conteúdo", desc: "Geração assistida de descrições e landing pages com identidade local." },
  { icon: ShieldCheck, title: "Curadoria Confiável", desc: "Eventos passam por análise antes de entrar na agenda pública." },
];

const differentials = [
  { icon: Globe2, title: "Hiperlocal", desc: "Feito por e para a Ilha." },
  { icon: ShieldCheck, title: "Curadoria", desc: "Conteúdo verificado." },
  { icon: Sparkles, title: "Tecnologia", desc: "PDF, IA e WhatsApp integrados." },
  { icon: Users2, title: "Comunidade", desc: "Conecta produtores e moradores." },
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
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground antialiased font-body selection:bg-primary/15 selection:text-primary">
      {/* ── Header ── */}
       <Header />

      {/* ── Hero ── */}
      <section
        id="top"
        className="relative pt-28 pb-20 sm:pt-40 sm:pb-32 overflow-hidden gradient-eco gradient-mesh grain"
      >
        <div aria-hidden className="absolute -top-32 -left-32 h-80 w-80 rounded-full bg-primary/10 blur-3xl" />
        <div aria-hidden className="absolute top-20 right-[-100px] h-96 w-96 rounded-full bg-secondary/15 blur-3xl" />

        <div className="relative mx-auto max-w-4xl px-6 text-center animate-fade-in">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full glass mb-10">
            <span className="h-1.5 w-1.5 rounded-full bg-secondary animate-pulse" />
            <span className="font-mono text-[10px] tracking-[0.2em] uppercase text-foreground/65">
              Ilha do Governador · RJ
            </span>
          </div>

          <div className="space-y-4 mb-8">
            <h2 className="font-mono text-sm tracking-[0.3em] uppercase text-secondary font-semibold">AgendIlha</h2>
            <h1 className="font-display text-[clamp(2.75rem,8vw,6rem)] font-medium leading-[0.92] tracking-tightest text-foreground text-balance">
              A cultura da Ilha,
              <br />
              <span className="font-serif italic font-normal text-primary">reunida</span>{" "}
              num só lugar.
            </h1>
          </div>

          <p className="mt-8 text-base sm:text-lg text-foreground/65 max-w-xl mx-auto leading-relaxed text-balance">
            Eventos, divulgação inteligente e uma rede ativa de produtores
            e moradores — com curadoria, design e <em className="font-serif text-foreground/80">alma local</em>.
          </p>

          <div className="mt-10 flex flex-col xs:flex-row items-stretch xs:items-center justify-center gap-2.5 w-full xs:w-auto">
             <Link to="/agenda" className="w-full xs:w-auto">
              <Button size="lg" className="w-full rounded-full h-12 px-7 bg-primary text-primary-foreground hover:bg-primary/90 shadow-elevated transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]">
                Ver agenda <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
            </Link>
             <Button 
               size="lg" 
               variant="ghost" 
               asChild
               className="w-full xs:w-auto rounded-full h-12 px-7 text-foreground/80 hover:bg-white/60 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
             >
               <Link to="/enviar-evento">Cadastrar evento</Link>
             </Button>
          </div>

          {/* Floating logo chip */}
          <div className="mt-16 inline-flex items-center gap-3 px-4 py-2.5 rounded-full glass-strong shadow-glass">
            <img src={logo} alt="" className="h-8 w-8 rounded-full ring-1 ring-foreground/10" />
            <span className="font-mono text-[11px] tracking-wider text-foreground/60 uppercase">
              Feito com carinho
            </span>
          </div>
        </div>
      </section>

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
              <div className="flex flex-wrap gap-2.5 shrink-0">
                 <Link to="/agenda">
                  <Button className="rounded-full h-12 px-6 bg-background text-foreground hover:bg-background/90 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]">
                    <FileDown className="h-4 w-4 mr-1.5" />
                    Baixar PDF
                  </Button>
                </Link>
                <Link to="/agenda">
                  <Button variant="outline" className="rounded-full h-12 px-6 bg-transparent border-white/25 text-primary-foreground hover:bg-white/10 hover:text-primary-foreground transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]">
                    Ver agenda completa
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
          <div className="mt-10">
            <a
              href="https://wa.me/5521999999999?text=Ol%C3%A1%2C%20quero%20saber%20mais%20sobre%20o%20AgendIlha"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button size="lg" className="rounded-full h-12 px-8 bg-primary text-primary-foreground hover:bg-primary/90 shadow-elevated font-display font-bold">
                <MessageCircle className="h-4 w-4 mr-1.5" />
                Falar no WhatsApp
              </Button>
            </a>
          </div>
        </div>
      </section>

      <footer className="py-10 px-6 border-t border-border/60">
        <div className="mx-auto max-w-6xl flex flex-col sm:flex-row items-center justify-between gap-4 font-mono text-[11px] uppercase tracking-wider text-foreground/55">
          <div className="flex items-center gap-2 font-bold text-foreground/75">
            <img src={logo} alt="AgendIlha" className="h-6 w-6 rounded-full ring-1 ring-foreground/10" />
            <span>AgendIlha | Coé a Boa?</span>
          </div>
          <span>© {new Date().getFullYear()} — Ilha do Governador</span>
        </div>
      </footer>
    </div>
  );
}

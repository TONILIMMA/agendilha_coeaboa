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
    <div className="min-h-screen bg-background text-foreground antialiased selection:bg-foreground/10">
      {/* ── Header ── */}
      <header
        className={`fixed top-0 inset-x-0 z-50 transition-all duration-500 ${
          scrolled ? "glass border-b border-white/40" : "bg-transparent border-b border-transparent"
        }`}
      >
        <nav className="mx-auto max-w-6xl px-5 sm:px-8 h-16 flex items-center justify-between">
          <a href="#top" className="flex items-center gap-2.5 group">
            <img src={logo} alt="Coé a Boa?" className="h-9 w-9 rounded-full ring-1 ring-foreground/10 transition-transform group-hover:scale-105" />
            <span className="font-display text-[15px] sm:text-base font-medium tracking-tight text-foreground">
              Coé a Boa<span className="italic text-foreground/60">?</span>
            </span>
          </a>

          <ul className="hidden md:flex items-center gap-8 text-[13px] text-foreground/65">
            {sitelinks.map((l) => (
              <li key={l.href}>
                <a href={l.href} className="story-link hover:text-foreground transition-colors">
                  {l.label}
                </a>
              </li>
            ))}
          </ul>

          <div className="hidden md:flex items-center gap-1.5">
            <Link to="/auth">
              <Button size="sm" variant="ghost" className="text-foreground/75 hover:text-foreground rounded-full px-4">Entrar</Button>
            </Link>
            <Link to="/coeaboa">
              <Button size="sm" className="rounded-full bg-foreground text-background hover:bg-foreground/90 px-4">
                Ver agenda
              </Button>
            </Link>
          </div>

          <button
            className="md:hidden inline-flex items-center justify-center h-10 w-10 rounded-full hover:bg-white/50 transition"
            onClick={() => setMobileOpen((v) => !v)}
            aria-label="Abrir menu"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </nav>

        {mobileOpen && (
          <div className="md:hidden fixed inset-x-0 top-16 bottom-0 glass-strong border-t border-white/50 animate-fade-in overflow-y-auto">
            <ul className="px-6 py-8 space-y-1 text-base">
              {sitelinks.map((l) => (
                <li key={l.href}>
                  <a
                    href={l.href}
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center justify-between py-4 px-2 text-foreground/85 hover:text-foreground transition font-display text-xl"
                  >
                    {l.label}
                    <ArrowUpRight className="h-4 w-4 text-foreground/40" />
                  </a>
                </li>
              ))}
              <li className="pt-6 flex flex-col gap-2.5">
                <Link to="/auth" onClick={() => setMobileOpen(false)}>
                  <Button size="lg" variant="outline" className="w-full rounded-full bg-white/70">Entrar</Button>
                </Link>
                <Link to="/coeaboa" onClick={() => setMobileOpen(false)}>
                  <Button size="lg" className="w-full rounded-full bg-foreground text-background hover:bg-foreground/90">Ver agenda</Button>
                </Link>
              </li>
            </ul>
          </div>
        )}
      </header>

      {/* ── Hero ── */}
      <section
        id="top"
        className="relative pt-32 pb-24 sm:pt-44 sm:pb-36 overflow-hidden gradient-eco gradient-mesh grain"
      >
        <div aria-hidden className="absolute -top-32 -left-32 h-80 w-80 rounded-full bg-emerald-200/40 blur-3xl" />
        <div aria-hidden className="absolute top-10 right-[-100px] h-96 w-96 rounded-full bg-sky-200/40 blur-3xl" />
        <div aria-hidden className="absolute bottom-[-80px] left-1/3 h-72 w-72 rounded-full bg-amber-100/50 blur-3xl" />

        <div className="relative mx-auto max-w-3xl px-6 text-center animate-fade-in">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full glass text-[11px] tracking-[0.18em] uppercase text-foreground/65 mb-8">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Agenda cultural · Ilha do Governador
          </div>

          <h1 className="font-display text-[clamp(2.5rem,7vw,5rem)] font-normal leading-[1.02] tracking-tightest text-foreground text-balance">
            A cultura da Ilha,<br />
            <span className="italic text-foreground/70">reunida num só lugar.</span>
          </h1>

          <p className="mt-7 text-base sm:text-lg text-foreground/65 max-w-xl mx-auto leading-relaxed text-balance">
            Eventos, divulgação inteligente e uma rede ativa de produtores e moradores —
            tudo com curadoria, design e alma local.
          </p>

          <div className="mt-10 flex flex-col xs:flex-row items-stretch xs:items-center justify-center gap-3 w-full xs:w-auto">
            <Link to="/coeaboa" className="w-full xs:w-auto">
              <Button size="lg" className="w-full rounded-full h-12 px-7 bg-foreground text-background hover:bg-foreground/90 shadow-elevated">
                Ver agenda <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
            </Link>
            <Link to="/auth" className="w-full xs:w-auto">
              <Button size="lg" variant="ghost" className="w-full rounded-full h-12 px-7 text-foreground/80 hover:bg-white/50">
                Cadastrar evento
              </Button>
            </Link>
          </div>

          {/* Floating logo card */}
          <div className="mt-16 inline-flex items-center gap-3 px-4 py-2.5 rounded-full glass-strong shadow-glass">
            <img src={logo} alt="" className="h-8 w-8 rounded-full ring-1 ring-foreground/10" />
            <span className="text-xs text-foreground/60">Feito com carinho na Ilha do Governador</span>
          </div>
        </div>
      </section>

      {/* ── O que oferecemos ── */}
      <section id="oferecemos" className="py-24 sm:py-32 bg-background">
        <div className="mx-auto max-w-5xl px-6">
          <div className="max-w-2xl reveal">
            <p className="text-[11px] font-medium tracking-[0.2em] uppercase text-foreground/50">— O que oferecemos</p>
            <h2 className="mt-5 font-display text-3xl sm:text-5xl font-normal tracking-tight leading-[1.1] text-balance">
              Uma plataforma feita para a <em className="text-foreground/70">cultura local</em>.
            </h2>
            <p className="mt-6 text-foreground/65 text-base sm:text-lg max-w-xl leading-relaxed">
              Da curadoria à divulgação: tudo que você precisa para promover eventos
              da Ilha do Governador com clareza, elegância e alcance real.
            </p>
          </div>
        </div>
      </section>

      {/* ── Ecossistema ── */}
      <section id="ecossistema" className="relative py-20 sm:py-28 gradient-eco grain">
        <div className="mx-auto max-w-6xl">
          <div className="mb-14 sm:mb-16 reveal px-6 max-w-3xl">
            <p className="text-[11px] font-medium tracking-[0.2em] uppercase text-foreground/50">— Ecossistema</p>
            <h2 className="mt-5 font-display text-3xl sm:text-4xl font-normal tracking-tight leading-tight">
              Pessoas, eventos e tecnologia <em className="text-foreground/70">em harmonia</em>.
            </h2>
          </div>

          <div
            className="
              flex sm:grid sm:grid-cols-2 lg:grid-cols-3
              gap-3 sm:gap-4
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
                  bg-white/70 backdrop-blur-xl border border-white/60
                  shadow-card hover:shadow-elevated
                  transition-all duration-500
                  hover:-translate-y-1
                  shrink-0 sm:shrink basis-[80%] xs:basis-[70%] sm:basis-auto
                  snap-start
                "
                style={{ transitionDelay: `${i * 70}ms` }}
              >
                <div className="flex items-start justify-between mb-8">
                  <div className="inline-flex items-center justify-center h-11 w-11 rounded-2xl bg-foreground/[0.04] text-foreground/80 group-hover:bg-foreground group-hover:text-background transition-colors duration-500">
                    <c.icon className="h-[18px] w-[18px]" strokeWidth={1.5} />
                  </div>
                  <span className="text-[11px] tabular-nums text-foreground/30 font-medium">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                </div>
                <h3 className="font-display text-xl font-medium text-foreground tracking-tight">{c.title}</h3>
                <p className="mt-2 text-sm text-foreground/60 leading-relaxed">{c.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Diferenciais ── */}
      <section id="diferenciais" className="py-24 sm:py-32 bg-background">
        <div className="mx-auto max-w-5xl px-6">
          <div className="text-center mb-16 reveal max-w-xl mx-auto">
            <p className="text-[11px] font-medium tracking-[0.2em] uppercase text-foreground/50">— Diferenciais</p>
            <h2 className="mt-5 font-display text-3xl sm:text-4xl font-normal tracking-tight">
              Por que <em className="text-foreground/70">Coé a Boa?</em>
            </h2>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-px bg-border/60 rounded-3xl overflow-hidden border border-border/60">
            {differentials.map((d, i) => (
              <div
                key={d.title}
                className="reveal text-center p-8 bg-card hover:bg-white transition-colors duration-300"
                style={{ transitionDelay: `${i * 80}ms` }}
              >
                <div className="mx-auto inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-foreground/[0.04] text-foreground/80 mb-4">
                  <d.icon className="h-5 w-5" strokeWidth={1.5} />
                </div>
                <h3 className="font-display text-base font-medium text-foreground">{d.title}</h3>
                <p className="mt-1.5 text-[13px] text-foreground/60">{d.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Agenda CTA ── */}
      <section className="py-20 sm:py-28 bg-background">
        <div className="mx-auto max-w-5xl px-6 reveal">
          <div className="relative overflow-hidden rounded-[2rem] gradient-eco-deep text-white p-10 sm:p-16 grain">
            <div aria-hidden className="absolute -top-20 -right-20 h-72 w-72 rounded-full bg-white/10 blur-3xl" />
            <div aria-hidden className="absolute -bottom-20 -left-10 h-60 w-60 rounded-full bg-white/5 blur-3xl" />

            <div className="relative flex flex-col lg:flex-row items-start lg:items-end gap-10 justify-between">
              <div className="max-w-xl">
                <p className="text-[11px] font-medium tracking-[0.2em] uppercase text-white/60">— Agenda Cultural</p>
                <h3 className="mt-4 font-display text-3xl sm:text-5xl font-normal tracking-tight leading-[1.05] text-balance">
                  Exporte. Compartilhe. <em className="text-white/75">Divulgue.</em>
                </h3>
                <p className="mt-5 text-white/70 text-base leading-relaxed max-w-md">
                  Gere a Agenda Cultural em PDF ou crie uma landing page para divulgar
                  via WhatsApp, redes sociais ou imprensa.
                </p>
              </div>
              <div className="flex flex-wrap gap-2.5 shrink-0">
                <Link to="/coeaboa">
                  <Button className="rounded-full h-12 px-6 bg-white text-foreground hover:bg-white/90">
                    <FileDown className="h-4 w-4 mr-1.5" />
                    Baixar PDF
                  </Button>
                </Link>
                <Link to="/agenda">
                  <Button variant="outline" className="rounded-full h-12 px-6 bg-transparent border-white/30 text-white hover:bg-white/10 hover:text-white">
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
          <p className="text-[11px] font-medium tracking-[0.2em] uppercase text-foreground/50">— Contato</p>
          <h3 className="mt-5 font-display text-3xl sm:text-5xl font-normal tracking-tight leading-tight text-balance">
            Vamos <em className="text-foreground/70">conversar</em>?
          </h3>
          <p className="mt-6 text-foreground/65 text-base leading-relaxed max-w-md mx-auto">
            Tem um evento, parceria ou ideia? Nossa equipe está pronta para te atender.
          </p>
          <div className="mt-10">
            <a
              href="https://wa.me/5521999999999?text=Ol%C3%A1%2C%20quero%20saber%20mais%20sobre%20o%20Co%C3%A9%20a%20Boa"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button size="lg" className="rounded-full h-12 px-7 bg-foreground text-background hover:bg-foreground/90 shadow-elevated">
                <MessageCircle className="h-4 w-4 mr-1.5" />
                Falar no WhatsApp
              </Button>
            </a>
          </div>
        </div>
      </section>

      <footer className="py-10 px-6 border-t border-border/60">
        <div className="mx-auto max-w-6xl flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-foreground/55">
          <div className="flex items-center gap-2">
            <img src={logo} alt="" className="h-6 w-6 rounded-full ring-1 ring-foreground/10" />
            <span className="font-display text-sm text-foreground/70">Coé a Boa<span className="italic">?</span></span>
          </div>
          <span>© {new Date().getFullYear()} — Agenda cultural da Ilha do Governador</span>
        </div>
      </footer>
    </div>
  );
}

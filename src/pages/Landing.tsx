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
  { href: "#diferenciais", label: "Nossos diferenciais" },
  { href: "#contato", label: "Fale com o atendente" },
];

const ecosystem = [
  { icon: Calendar, title: "Agenda Cultural", desc: "Eventos da Ilha do Governador organizados por categoria, data e local.", tone: "text-emerald-600 bg-emerald-50" },
  { icon: Megaphone, title: "Divulgação Inteligente", desc: "Compartilhe via WhatsApp, exporte PDFs prontos ou gere uma landing page.", tone: "text-sky-600 bg-sky-50" },
  { icon: Users2, title: "Rede de Divulgadores", desc: "Espaço onde produtores, marcas e a comunidade somam forças.", tone: "text-slate-600 bg-slate-100" },
  { icon: FileDown, title: "Relatórios em PDF", desc: "Material pronto para imprensa, parceiros e grupos de WhatsApp.", tone: "text-emerald-600 bg-emerald-50" },
  { icon: Sparkles, title: "IA para Conteúdo", desc: "Geração assistida de descrições e landing pages com identidade local.", tone: "text-sky-600 bg-sky-50" },
  { icon: ShieldCheck, title: "Curadoria Confiável", desc: "Eventos passam por análise antes de entrar na agenda pública.", tone: "text-slate-600 bg-slate-100" },
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
    <div className="min-h-screen bg-background text-foreground antialiased font-body selection:bg-foreground/10">
      {/* ── Header glassmorphism ── */}
      <header
        className={`fixed top-0 inset-x-0 z-50 transition-all duration-500 ${
          scrolled ? "glass border-b border-white/40" : "bg-transparent border-b border-transparent"
        }`}
      >
        <nav className="mx-auto max-w-6xl px-5 sm:px-8 h-16 flex items-center justify-between">
          <a href="#top" className="flex items-center gap-2.5 group">
            <img src={logo} alt="Coé a Boa?" className="h-9 w-9 rounded-full ring-1 ring-foreground/10 transition-transform group-hover:scale-105" />
            <span className="text-[15px] sm:text-base font-semibold tracking-tight text-foreground">
              Coé a Boa<span className="text-primary">?</span>
            </span>
          </a>

          <ul className="hidden md:flex items-center gap-8 text-[13px] text-foreground/70">
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
                    className="flex items-center justify-between py-4 px-2 text-foreground/85 hover:text-foreground transition font-medium text-lg"
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

      {/* ── Hero: gradiente verde→azul→cinza + card glass com logo central ── */}
      <section
        id="top"
        className="relative pt-24 pb-16 sm:pt-36 sm:pb-28 overflow-hidden gradient-eco gradient-mesh"
      >
        <div aria-hidden className="absolute -top-32 -left-32 h-72 sm:h-96 w-72 sm:w-96 rounded-full bg-emerald-300/35 blur-3xl" />
        <div aria-hidden className="absolute top-10 right-[-100px] h-80 sm:h-[28rem] w-80 sm:w-[28rem] rounded-full bg-sky-300/35 blur-3xl" />
        <div aria-hidden className="absolute bottom-[-80px] left-1/3 h-64 sm:h-80 w-64 sm:w-80 rounded-full bg-slate-300/40 blur-3xl" />

        <div className="relative mx-auto max-w-3xl px-5 sm:px-6 text-center animate-fade-in">
          {/* Card glassmorphism com logo centralizado */}
          <div className="inline-flex flex-col items-center glass-strong rounded-[2rem] px-6 py-8 sm:px-14 sm:py-12 shadow-glass max-w-full">
            {/* Logo centralizado · borda fina */}
            <div className="rounded-full p-0.5 ring-1 ring-foreground/10 bg-white/80 shadow-card">
              <img
                src={logo}
                alt="Coé a Boa?"
                className="h-20 w-20 sm:h-28 sm:w-28 rounded-full"
              />
            </div>

            <div className="mt-5 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/60 border border-white/70 text-[10px] sm:text-[11px] tracking-[0.18em] uppercase text-foreground/65">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Agenda cultural · Ilha do Governador
            </div>

            <h1 className="mt-5 sm:mt-6 font-display text-[clamp(2.25rem,6.5vw,4rem)] font-normal tracking-tightest leading-[0.95] text-foreground text-balance">
              Coé a Boa<em className="text-primary not-italic">?</em>
            </h1>
            <p className="mt-3 text-sm sm:text-base text-foreground/65 max-w-md leading-relaxed">
              A agenda cultural da Ilha do Governador. Eventos, divulgação
              e comunidade num só lugar.
            </p>

            <div className="mt-6 sm:mt-7 flex flex-col xs:flex-row items-stretch xs:items-center justify-center gap-2.5 w-full xs:w-auto">
              <Link to="/coeaboa" className="w-full xs:w-auto">
                <Button size="lg" className="w-full rounded-full h-11 px-6 bg-foreground text-background hover:bg-foreground/90 shadow-elevated">
                  Ver agenda <ArrowRight className="ml-1 h-4 w-4" />
                </Button>
              </Link>
              <Link to="/auth" className="w-full xs:w-auto">
                <Button size="lg" variant="ghost" className="w-full rounded-full h-11 px-6 text-foreground/80 hover:bg-white/60">
                  Cadastrar evento
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Wave divider */}
        <svg className="absolute bottom-0 left-0 w-full text-background" viewBox="0 0 1440 80" preserveAspectRatio="none" aria-hidden>
          <path fill="currentColor" d="M0,40 C360,90 1080,-10 1440,40 L1440,80 L0,80 Z" />
        </svg>
      </section>

      {/* ── O que oferecemos ── */}
      <section id="oferecemos" className="py-20 sm:py-28 bg-background">
        <div className="mx-auto max-w-5xl px-6 text-center reveal">
          <p className="text-[11px] font-medium tracking-[0.2em] uppercase text-emerald-700">O que oferecemos</p>
          <h2 className="mt-4 font-display text-3xl sm:text-5xl font-normal tracking-tight leading-[1.05] text-balance max-w-2xl mx-auto">
            Uma plataforma feita para a <em className="text-foreground/70">cultura local</em>
          </h2>
          <p className="mt-5 text-foreground/65 text-sm sm:text-base max-w-xl mx-auto leading-relaxed">
            Da curadoria à divulgação: tudo o que você precisa para promover eventos
            da Ilha do Governador com clareza e elegância.
          </p>
        </div>
      </section>

      {/* ── Ecossistema ── */}
      <section id="ecossistema" className="relative py-16 sm:py-24 gradient-eco">
        <div className="mx-auto max-w-6xl">
          <div className="text-center mb-10 sm:mb-14 reveal px-6 max-w-2xl mx-auto">
            <p className="text-[11px] font-medium tracking-[0.2em] uppercase text-sky-700">Ecossistema</p>
            <h2 className="mt-4 font-display text-3xl sm:text-5xl font-normal tracking-tight leading-[1.05]">
              Pessoas, eventos e tecnologia <em className="text-foreground/70">em harmonia</em>
            </h2>
            <p className="md:hidden mt-3 text-xs text-foreground/55">Deslize para o lado →</p>
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
                  reveal group relative
                  rounded-3xl p-6 sm:p-7
                  bg-white/70 backdrop-blur-xl border border-white/60
                  shadow-card hover:shadow-elevated
                  transition-all duration-500
                  hover:-translate-y-1 hover:scale-[1.02]
                  active:scale-[0.99]
                  shrink-0 sm:shrink basis-[80%] xs:basis-[70%] sm:basis-auto
                  snap-start
                "
                style={{ transitionDelay: `${i * 70}ms` }}
              >
                <div className={`inline-flex items-center justify-center h-11 w-11 rounded-2xl mb-5 ${c.tone}`}>
                  <c.icon className="h-[18px] w-[18px]" strokeWidth={1.5} />
                </div>
                <h3 className="text-base sm:text-lg font-semibold text-foreground tracking-tight">{c.title}</h3>
                <p className="mt-1.5 text-sm text-foreground/60 leading-relaxed">{c.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Diferenciais ── */}
      <section id="diferenciais" className="py-20 sm:py-28 bg-background">
        <div className="mx-auto max-w-5xl px-6">
          <div className="text-center mb-12 sm:mb-14 reveal max-w-xl mx-auto">
            <p className="text-[11px] font-medium tracking-[0.2em] uppercase text-slate-600">Nossos diferenciais</p>
            <h2 className="mt-4 font-display text-3xl sm:text-5xl font-normal tracking-tight">
              Por que escolher o <em className="text-foreground/70">Coé a Boa<span className="not-italic text-primary">?</span></em>
            </h2>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-px bg-border/60 rounded-3xl overflow-hidden border border-border/60">
            {differentials.map((d, i) => (
              <div
                key={d.title}
                className="reveal text-center p-7 bg-card hover:bg-white transition-colors duration-300"
                style={{ transitionDelay: `${i * 80}ms` }}
              >
                <div className="mx-auto inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700 mb-4">
                  <d.icon className="h-5 w-5" strokeWidth={1.5} />
                </div>
                <h3 className="text-sm sm:text-base font-semibold text-foreground">{d.title}</h3>
                <p className="mt-1.5 text-[13px] text-foreground/60">{d.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Agenda CTA ── */}
      <section className="py-20 sm:py-28 bg-background">
        <div className="mx-auto max-w-5xl px-6 reveal">
          <div className="relative overflow-hidden rounded-[2rem] gradient-eco-deep text-white p-8 sm:p-14">
            <div aria-hidden className="absolute -top-20 -right-20 h-72 w-72 rounded-full bg-white/10 blur-3xl" />
            <div aria-hidden className="absolute -bottom-20 -left-10 h-60 w-60 rounded-full bg-white/5 blur-3xl" />

            <div className="relative flex flex-col lg:flex-row items-start lg:items-end gap-8 justify-between">
              <div className="max-w-xl">
                <p className="text-[11px] font-medium tracking-[0.2em] uppercase text-white/65">Agenda Cultural</p>
                <h3 className="mt-4 font-display text-3xl sm:text-5xl font-normal tracking-tight leading-[1.0] text-balance">
                  Exporte. Compartilhe. <em className="text-white/75">Divulgue.</em>
                </h3>
                <p className="mt-4 text-white/70 text-sm sm:text-base leading-relaxed max-w-md">
                  Gere a Agenda Cultural em PDF ou crie uma landing page para divulgar
                  via WhatsApp, redes sociais ou imprensa.
                </p>
              </div>
              <div className="flex flex-wrap gap-2.5 shrink-0">
                <Link to="/coeaboa">
                  <Button className="rounded-full h-11 px-5 bg-white text-foreground hover:bg-white/90">
                    <FileDown className="h-4 w-4 mr-1.5" />
                    Baixar PDF
                  </Button>
                </Link>
                <Link to="/agenda">
                  <Button variant="outline" className="rounded-full h-11 px-5 bg-transparent border-white/30 text-white hover:bg-white/10 hover:text-white">
                    Ver agenda completa
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Contato ── */}
      <section id="contato" className="py-20 sm:py-28 bg-background">
        <div className="mx-auto max-w-2xl px-6 text-center reveal">
          <p className="text-[11px] font-medium tracking-[0.2em] uppercase text-emerald-700">Fale com o atendente</p>
          <h3 className="mt-4 font-display text-3xl sm:text-5xl font-normal tracking-tight leading-[1.05] text-balance">
            Vamos <em className="text-foreground/70">conversar</em>
          </h3>
          <p className="mt-5 text-foreground/65 text-sm sm:text-base leading-relaxed max-w-md mx-auto">
            Tem um evento, parceria ou ideia? Nossa equipe está pronta para te atender.
          </p>
          <div className="mt-8">
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
            <span className="text-sm font-medium text-foreground/70">Coé a Boa<span className="text-primary">?</span></span>
          </div>
          <span>© {new Date().getFullYear()} — Agenda cultural da Ilha do Governador</span>
        </div>
      </footer>
    </div>
  );
}

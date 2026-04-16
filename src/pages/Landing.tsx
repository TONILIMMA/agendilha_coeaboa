import { useEffect, useRef } from "react";
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
  Menu,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import logo from "@/assets/coeaboa-logo.jpg";

const sitelinks = [
  { href: "#oferecemos", label: "O que oferecemos" },
  { href: "#ecossistema", label: "Ecossistema" },
  { href: "#diferenciais", label: "Nossos diferenciais" },
  { href: "#contato", label: "Fale com o atendente" },
];

const ecosystem = [
  {
    icon: Calendar,
    title: "Agenda Cultural",
    desc: "Eventos da Ilha do Governador organizados por categoria, data e local.",
    tone: "from-emerald-500/15 to-teal-500/10 text-emerald-700",
  },
  {
    icon: Megaphone,
    title: "Divulgação Inteligente",
    desc: "Compartilhe via WhatsApp, exporte PDFs prontos ou gere uma landing page.",
    tone: "from-sky-500/15 to-blue-500/10 text-sky-700",
  },
  {
    icon: Users2,
    title: "Rede de Divulgadores",
    desc: "Espaço onde produtores, marcas e a comunidade somam forças.",
    tone: "from-slate-500/15 to-zinc-500/10 text-slate-700",
  },
  {
    icon: FileDown,
    title: "Relatórios em PDF",
    desc: "Material pronto para imprensa, parceiros e grupos de WhatsApp.",
    tone: "from-emerald-500/15 to-teal-500/10 text-emerald-700",
  },
  {
    icon: Sparkles,
    title: "IA para Conteúdo",
    desc: "Geração assistida de descrições e landing pages com identidade local.",
    tone: "from-sky-500/15 to-blue-500/10 text-sky-700",
  },
  {
    icon: ShieldCheck,
    title: "Curadoria Confiável",
    desc: "Eventos passam por análise antes de entrar na agenda pública.",
    tone: "from-slate-500/15 to-zinc-500/10 text-slate-700",
  },
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

  return (
    <div className="min-h-screen bg-background text-foreground antialiased">
      {/* ── Glass Header ── */}
      <header className="fixed top-0 inset-x-0 z-50 glass border-b border-white/30">
        <nav className="mx-auto max-w-6xl px-4 sm:px-6 h-14 flex items-center justify-between">
          <a href="#top" className="flex items-center gap-2">
            <img src={logo} alt="Coé a Boa?" className="h-8 w-8 rounded-full ring-1 ring-foreground/10" />
            <span className="font-display font-semibold text-sm sm:text-base text-foreground">
              Coé a Boa<span className="text-primary">?</span>
            </span>
          </a>

          {/* Desktop nav */}
          <ul className="hidden md:flex items-center gap-7 text-sm text-foreground/75">
            {sitelinks.map((l) => (
              <li key={l.href}>
                <a href={l.href} className="story-link hover:text-foreground transition-colors">
                  {l.label}
                </a>
              </li>
            ))}
          </ul>

          <div className="hidden md:flex items-center gap-2">
            <Link to="/auth">
              <Button size="sm" variant="ghost" className="text-foreground/80">Entrar</Button>
            </Link>
            <Link to="/coeaboa">
              <Button size="sm" className="gradient-eco-deep text-white shadow-glass hover:opacity-95">
                Ver agenda
              </Button>
            </Link>
          </div>

          {/* Mobile burger */}
          <button
            className="md:hidden inline-flex items-center justify-center h-9 w-9 rounded-md hover:bg-white/40 transition"
            onClick={() => setMobileOpen((v) => !v)}
            aria-label="Abrir menu"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </nav>

        {/* Mobile drawer — fullscreen glass */}
        {mobileOpen && (
          <div className="md:hidden fixed inset-x-0 top-14 bottom-0 glass-strong border-t border-white/40 animate-fade-in overflow-y-auto">
            <ul className="px-6 py-6 space-y-1 text-base">
              {sitelinks.map((l) => (
                <li key={l.href}>
                  <a
                    href={l.href}
                    onClick={() => setMobileOpen(false)}
                    className="block py-4 px-3 rounded-xl text-foreground/85 hover:bg-white/60 active:bg-white/80 transition font-medium"
                  >
                    {l.label}
                  </a>
                </li>
              ))}
              <li className="pt-4 flex flex-col gap-2.5">
                <Link to="/auth" onClick={() => setMobileOpen(false)}>
                  <Button size="lg" variant="outline" className="w-full bg-white/70">Entrar</Button>
                </Link>
                <Link to="/coeaboa" onClick={() => setMobileOpen(false)}>
                  <Button size="lg" className="w-full gradient-eco-deep text-white">Ver agenda</Button>
                </Link>
              </li>
            </ul>
          </div>
        )}
      </header>

      {/* ── Hero ── */}
      <section
        id="top"
        className="relative pt-20 pb-14 sm:pt-32 sm:pb-28 overflow-hidden gradient-eco"
      >
        {/* soft ambient blobs */}
        <div aria-hidden className="absolute -top-24 -left-24 h-56 sm:h-72 w-56 sm:w-72 rounded-full bg-emerald-300/30 blur-3xl" />
        <div aria-hidden className="absolute top-20 right-[-80px] h-60 sm:h-80 w-60 sm:w-80 rounded-full bg-sky-300/30 blur-3xl" />
        <div aria-hidden className="absolute bottom-[-60px] left-1/3 h-56 sm:h-72 w-56 sm:w-72 rounded-full bg-slate-300/30 blur-3xl" />

        <div className="relative mx-auto max-w-3xl px-5 sm:px-6 text-center animate-fade-in">
          <div className="inline-flex flex-col items-center glass-strong rounded-3xl px-6 py-6 sm:px-12 sm:py-10 shadow-glass">
            <div className="rounded-full p-1 sm:p-1.5 ring-1 ring-foreground/10 bg-white/70 shadow-card">
              <img
                src={logo}
                alt="Coé a Boa?"
                className="h-20 w-20 sm:h-28 sm:w-28 rounded-full"
              />
            </div>
            <h1 className="mt-4 sm:mt-6 font-display text-2xl sm:text-4xl font-semibold tracking-tight text-foreground">
              Coé a Boa<span className="text-primary">?</span>
            </h1>
            <p className="mt-1.5 sm:mt-2 text-[13px] sm:text-base text-foreground/70 max-w-md leading-relaxed">
              A agenda cultural da Ilha do Governador.
              Eventos, divulgação e comunidade num só lugar.
            </p>

            <div className="mt-5 sm:mt-6 flex flex-col xs:flex-row flex-wrap items-stretch xs:items-center justify-center gap-2.5 w-full xs:w-auto">
              <Link to="/coeaboa" className="w-full xs:w-auto">
                <Button size="lg" className="w-full gradient-eco-deep text-white shadow-glass hover:opacity-95 hover-scale">
                  Ver agenda <ArrowRight className="ml-1.5 h-4 w-4" />
                </Button>
              </Link>
              <Link to="/auth" className="w-full xs:w-auto">
                <Button size="lg" variant="outline" className="w-full bg-white/60 hover:bg-white/80">
                  Cadastrar evento
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* wave divider */}
        <svg className="absolute bottom-0 left-0 w-full text-background" viewBox="0 0 1440 80" preserveAspectRatio="none" aria-hidden>
          <path fill="currentColor" d="M0,40 C360,90 1080,-10 1440,40 L1440,80 L0,80 Z" />
        </svg>
      </section>

      {/* ── O que oferecemos ── */}
      <section id="oferecemos" className="py-20 sm:py-24">
        <div className="mx-auto max-w-5xl px-6">
          <div className="text-center mb-12 reveal">
            <p className="text-xs font-medium tracking-widest uppercase text-primary">O que oferecemos</p>
            <h2 className="mt-2 font-display text-2xl sm:text-3xl font-semibold">
              Uma plataforma feita para a cultura local
            </h2>
            <p className="mt-3 text-foreground/70 max-w-xl mx-auto text-sm sm:text-base">
              Da curadoria à divulgação: tudo o que você precisa para promover eventos
              da Ilha do Governador com clareza e elegância.
            </p>
          </div>
        </div>
      </section>

      {/* ── Ecossistema ── */}
      <section id="ecossistema" className="relative py-16 sm:py-20 gradient-eco">
        <div className="mx-auto max-w-6xl px-0 sm:px-6">
          <div className="text-center mb-10 sm:mb-12 reveal px-6">
            <p className="text-xs font-medium tracking-widest uppercase text-emerald-700">Ecossistema</p>
            <h2 className="mt-2 font-display text-2xl sm:text-3xl font-semibold">
              Conectando pessoas, eventos e tecnologia
            </h2>
            <p className="md:hidden mt-2 text-xs text-foreground/55">Deslize para o lado →</p>
          </div>

          {/* Mobile: horizontal snap carousel · Desktop: grid */}
          <div
            className="
              flex sm:grid
              sm:grid-cols-2 lg:grid-cols-3
              gap-4 sm:gap-5
              overflow-x-auto sm:overflow-visible
              snap-x snap-mandatory sm:snap-none
              scroll-px-6 px-6 sm:px-0
              pb-4 sm:pb-0
              scrollbar-none
              [-webkit-overflow-scrolling:touch]
            "
          >
            {ecosystem.map((c, i) => (
              <div
                key={c.title}
                className="
                  reveal glass rounded-2xl p-5 sm:p-6
                  shadow-card hover:shadow-glass transition-all
                  hover-scale active:scale-[0.98]
                  shrink-0 sm:shrink basis-[78%] xs:basis-[68%] sm:basis-auto
                  snap-start
                "
                style={{ transitionDelay: `${i * 60}ms` }}
              >
                <div className={`inline-flex items-center justify-center rounded-xl p-3 mb-4 bg-gradient-to-br ${c.tone}`}>
                  <c.icon className="h-5 w-5" strokeWidth={1.6} />
                </div>
                <h3 className="font-display font-semibold text-base text-foreground">{c.title}</h3>
                <p className="mt-1.5 text-sm text-foreground/70 leading-relaxed">{c.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Diferenciais ── */}
      <section id="diferenciais" className="py-20 sm:py-24 bg-background">
        <div className="mx-auto max-w-5xl px-6">
          <div className="text-center mb-12 reveal">
            <p className="text-xs font-medium tracking-widest uppercase text-sky-700">Nossos diferenciais</p>
            <h2 className="mt-2 font-display text-2xl sm:text-3xl font-semibold">Por que escolher o Coé a Boa?</h2>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {differentials.map((d, i) => (
              <div
                key={d.title}
                className="reveal text-center p-5 rounded-2xl border border-border/60 bg-card hover:bg-white hover-scale transition"
                style={{ transitionDelay: `${i * 80}ms` }}
              >
                <div className="mx-auto inline-flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 mb-3">
                  <d.icon className="h-5 w-5" strokeWidth={1.6} />
                </div>
                <h3 className="font-display font-semibold text-sm text-foreground">{d.title}</h3>
                <p className="mt-1 text-xs text-foreground/65">{d.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Agenda / Divulgação CTA ── */}
      <section className="py-16 sm:py-20 gradient-eco-deep text-white">
        <div className="mx-auto max-w-4xl px-6 reveal">
          <div className="glass-strong text-foreground rounded-3xl p-8 sm:p-10 shadow-glass">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 justify-between">
              <div>
                <p className="text-xs font-medium tracking-widest uppercase text-emerald-700">Agenda Cultural</p>
                <h3 className="mt-1 font-display text-xl sm:text-2xl font-semibold">
                  Exporte, compartilhe, divulgue
                </h3>
                <p className="mt-2 text-sm text-foreground/70 max-w-md">
                  Gere a Agenda Cultural em PDF ou crie uma landing page para divulgar
                  via WhatsApp, redes sociais ou imprensa.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Link to="/coeaboa">
                  <Button className="gradient-eco-deep text-white hover:opacity-95">
                    <FileDown className="h-4 w-4 mr-1.5" />
                    Baixar PDF
                  </Button>
                </Link>
                <Link to="/agenda">
                  <Button variant="outline" className="bg-white/70 hover:bg-white">
                    Ver agenda completa
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Contato ── */}
      <section id="contato" className="py-16 sm:py-20 bg-background">
        <div className="mx-auto max-w-2xl px-6 text-center reveal">
          <p className="text-xs font-medium tracking-widest uppercase text-primary">Fale com o atendente</p>
          <h3 className="mt-2 font-display text-2xl sm:text-3xl font-semibold">Vamos conversar</h3>
          <p className="mt-3 text-sm text-foreground/70">
            Tem um evento, parceria ou ideia? Nossa equipe está pronta para te atender.
          </p>
          <div className="mt-6">
            <a
              href="https://wa.me/5521999999999?text=Ol%C3%A1%2C%20quero%20saber%20mais%20sobre%20o%20Co%C3%A9%20a%20Boa"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button size="lg" className="gradient-eco-deep text-white shadow-glass hover-scale">
                <MessageCircle className="h-4 w-4 mr-1.5" />
                Falar no WhatsApp
              </Button>
            </a>
          </div>
        </div>
      </section>

      <footer className="py-8 text-center text-xs text-foreground/55 border-t border-border/60">
        © {new Date().getFullYear()} Coé a Boa? — Agenda cultural da Ilha do Governador
      </footer>
    </div>
  );
}

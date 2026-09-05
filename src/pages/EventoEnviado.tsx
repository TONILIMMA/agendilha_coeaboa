import { Link, Navigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Clock,
  ArrowRight,
  ListChecks,
  Loader2,
  CheckCircle2,
  CalendarClock,
  MapPin,
  Mic2,
  Sparkles,
  Crown,
  Megaphone,
  PencilLine,
  Zap,
  Star,
  ImageIcon,
  RefreshCw,
  MessageCircle,
} from "lucide-react";
import { useSubmission } from "@/data";
import logoCoeABoa from "@/assets/coeaboa-logo.webp";
import { useState } from "react";

interface Submission {
  id: string;
  event_title: string | null;
  date: string | null;
  start_time?: string | null;
  location?: string | null;
  atrativo_name?: string | null;
  image_url?: string | null;
  status: string;
}

const ETAPAS = ["Enviado", "Em análise", "Publicado"];

function formatDateBR(date: string | null | undefined): string | null {
  if (!date) return null;
  const d = new Date(`${date}T00:00:00`);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString("pt-BR", {
    weekday: "short",
    day: "2-digit",
    month: "short",
  });
}

export default function EventoEnviado() {
  const { id } = useParams<{ id: string }>();
  const validId = !!id && /^[0-9a-f-]{10,}$/i.test(id);
  const { data: sub, isLoading: loading } = useSubmission<Submission>(
    validId ? id! : "",
    "id, event_title, date, start_time, location, atrativo_name, image_url, status"
  );
  const { data: pacotes = [] } = useHighlightPackages();
  const [destaqueAberto, setDestaqueAberto] = useState(false);
  const jaAbriu = useRef(false);

  // Convite ao destaque logo após o envio — uma única vez por evento.
  useEffect(() => {
    if (jaAbriu.current || !sub?.id) return;
    const chave = `destaque-visto:${sub.id}`;
    if (sessionStorage.getItem(chave)) return;
    jaAbriu.current = true;
    sessionStorage.setItem(chave, "1");
    const t = setTimeout(() => setDestaqueAberto(true), 900);
    return () => clearTimeout(t);
  }, [sub?.id]);

  if (!validId) {
    return <Navigate to="/meus-eventos" replace />;
  }

  const nomeEvento = sub?.event_title || "Seu evento";
  const dataFormatada = formatDateBR(sub?.date);
  const etapaAtual = sub?.status === "aprovado" ? 2 : 1;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 flex flex-col font-[family-name:var(--font-body)]">
      {/* Cabeçalho escuro */}
      <header className="w-full bg-slate-950 border-b border-slate-800/60 sticky top-0 z-20">
        <div className="mx-auto max-w-3xl px-4 h-16 sm:h-18 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5 group">
            <img
              src={logoCoeABoa}
              alt="COEABOA?"
              className="h-9 w-9 sm:h-10 sm:w-10 rounded-full shadow-md shadow-black/30 group-hover:scale-105 transition-transform"
            />
            <span className="font-black tracking-tight text-lg sm:text-xl">
              COE<span className="text-amber-400">A</span>BOA?
            </span>
          </Link>
          <Button
            asChild
            className="rounded-full bg-amber-400 text-slate-950 font-bold hover:bg-amber-300 shadow-lg shadow-amber-400/20 h-10 px-5"
          >
            <Link to="/divulgar">
              <Megaphone className="h-4 w-4 mr-2" />
              DIVULGAR
            </Link>
          </Button>
        </div>
      </header>

      <main className="flex-1 w-full mx-auto max-w-3xl px-4 py-8 sm:py-12 space-y-8 sm:space-y-10">
        {/* Mensagem central */}
        <div className="text-center space-y-3">
          <h1 className="text-2xl sm:text-4xl font-black tracking-tight leading-tight inline-flex flex-wrap items-center justify-center gap-2 sm:gap-3">
            <CheckCircle2 className="h-7 w-7 sm:h-10 sm:w-10 text-emerald-400" />
            Evento enviado para curadoria
          </h1>
          <p className="text-slate-400 text-sm sm:text-base max-w-md mx-auto">
            Recebemos tudo certinho. Avisaremos você no WhatsApp assim que houver decisão.
          </p>
        </div>

        {/* Bloco de status */}
        <section className="rounded-3xl border border-slate-800 bg-slate-900/80 p-5 sm:p-8 space-y-6 shadow-2xl shadow-black/30 backdrop-blur-sm">
          {loading ? (
            <p className="text-slate-400 inline-flex items-center gap-2 text-sm">
              <Loader2 className="h-4 w-4 animate-spin" /> Carregando detalhes…
            </p>
          ) : (
            <dl className="grid gap-5 sm:grid-cols-2">
              <div className="space-y-1">
                <dt className="text-[11px] uppercase tracking-widest text-slate-500 font-semibold">
                  Evento
                </dt>
                <dd className="font-bold text-base sm:text-lg leading-snug text-slate-50">
                  {nomeEvento}
                </dd>
              </div>
              <div className="space-y-1">
                <dt className="text-[11px] uppercase tracking-widest text-slate-500 font-semibold">
                  Data e horário
                </dt>
                <dd className="inline-flex items-center gap-2 font-medium text-slate-200">
                  <CalendarClock className="h-4 w-4 text-amber-400" />
                  {dataFormatada ?? "Data a confirmar"}
                  {sub?.start_time ? ` · ${sub.start_time.slice(0, 5)}` : ""}
                </dd>
              </div>
              <div className="space-y-1">
                <dt className="text-[11px] uppercase tracking-widest text-slate-500 font-semibold">
                  Local
                </dt>
                <dd className="inline-flex items-center gap-2 font-medium text-slate-200">
                  <MapPin className="h-4 w-4 text-amber-400" />
                  {sub?.location ?? "Local a confirmar"}
                </dd>
              </div>
              <div className="space-y-1">
                <dt className="text-[11px] uppercase tracking-widest text-slate-500 font-semibold">
                  Atrativo principal
                </dt>
                <dd className="inline-flex items-center gap-2 font-medium text-slate-200">
                  <Mic2 className="h-4 w-4 text-amber-400" />
                  {sub?.atrativo_name ?? "A definir"}
                </dd>
              </div>
            </dl>
          )}

          {/* Flyer do evento */}
          {!loading && (
            <div className="flex items-center gap-4 rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
              {sub?.image_url ? (
                <a
                  href={sub.image_url}
                  target="_blank"
                  rel="noreferrer"
                  className="shrink-0 group"
                  title="Ver flyer em tamanho original"
                >
                  <img
                    src={sub.image_url}
                    alt={`Flyer de ${nomeEvento}`}
                    className="h-20 w-20 sm:h-24 sm:w-24 rounded-xl object-cover shadow-lg shadow-black/40 ring-1 ring-slate-700 group-hover:ring-amber-400/60 transition"
                    loading="lazy"
                  />
                </a>
              ) : (
                <div className="h-20 w-20 sm:h-24 sm:w-24 shrink-0 rounded-xl bg-slate-800/80 flex items-center justify-center ring-1 ring-slate-700">
                  <ImageIcon className="h-7 w-7 text-slate-500" />
                </div>
              )}
              <div className="min-w-0 space-y-1.5">
                <p className="text-[11px] uppercase tracking-widest text-slate-500 font-semibold">
                  Flyer do evento
                </p>
                <p className="text-sm text-slate-300 leading-snug">
                  {sub?.image_url
                    ? "Prévia do flyer que vai junto com a publicação."
                    : "Um flyer padrão será gerado automaticamente na publicação."}
                </p>
                <Button
                  asChild
                  size="sm"
                  variant="secondary"
                  className="rounded-full h-8 px-4 text-xs bg-slate-800 text-slate-100 hover:bg-slate-700 border-none"
                >
                  <Link to="/meus-eventos">
                    <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
                    Alterar flyer
                  </Link>
                </Button>
              </div>
            </div>
          )}

          {/* Barra de progresso */}
          <div className="pt-2">
            <ol className="relative flex items-start justify-between">
              <div
                aria-hidden
                className="absolute left-0 right-0 top-4 h-1 rounded-full bg-slate-800"
              />
              <div
                aria-hidden
                className="absolute left-0 top-4 h-1 rounded-full bg-gradient-to-r from-purple-600 to-amber-400 transition-all"
                style={{ width: `${(etapaAtual / (ETAPAS.length - 1)) * 100}%` }}
              />
              {ETAPAS.map((etapa, i) => {
                const ativa = i <= etapaAtual;
                const atual = i === etapaAtual;
                return (
                  <li key={etapa} className="relative z-10 flex flex-col items-center gap-2 w-20 sm:w-24">
                    <span
                      className={`h-8 w-8 sm:h-9 sm:w-9 rounded-full flex items-center justify-center border-2 transition-colors shadow-md ${
                        ativa
                          ? "bg-amber-400 border-amber-400 text-slate-950 shadow-amber-400/30"
                          : "bg-slate-900 border-slate-700 text-slate-500"
                      }`}
                    >
                      {atual && i === 1 ? (
                        <Clock className="h-4 w-4 sm:h-5 sm:w-5 animate-[spin_6s_linear_infinite]" />
                      ) : (
                        <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5" />
                      )}
                    </span>
                    <span
                      className={`text-[11px] sm:text-xs font-semibold text-center ${
                        ativa ? "text-slate-100" : "text-slate-500"
                      }`}
                    >
                      {etapa}
                    </span>
                  </li>
                );
              })}
            </ol>
          </div>
        </section>

        {/* Destaque premium */}
        <section className="space-y-5">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-amber-400" />
            <h2 className="text-lg sm:text-xl font-bold tracking-tight text-slate-50">
              Quer mais visibilidade?
            </h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {/* Card roxo */}
            <div className="rounded-2xl bg-purple-600 p-5 sm:p-6 space-y-3 shadow-xl shadow-purple-900/40 border border-purple-500/30">
              <div className="h-10 w-10 rounded-full bg-purple-500/50 flex items-center justify-center shadow-inner">
                <Zap className="h-5 w-5 text-purple-100" />
              </div>
              <div>
                <h3 className="font-bold text-purple-50 text-base">Destaque Simples</h3>
                <p className="text-sm text-purple-100/80 leading-relaxed mt-1">
                  Seu evento ganha selo especial e destaque na agenda da semana.
                </p>
              </div>
            </div>
            {/* Card dourado */}
            <div className="rounded-2xl bg-amber-400 p-5 sm:p-6 space-y-3 shadow-xl shadow-amber-900/40 border border-amber-300/50">
              <div className="h-10 w-10 rounded-full bg-amber-300/60 flex items-center justify-center shadow-inner">
                <Crown className="h-5 w-5 text-amber-900" />
              </div>
              <div>
                <h3 className="font-bold text-amber-950 text-base">Destaque Plus</h3>
                <p className="text-sm text-amber-900/80 leading-relaxed mt-1">
                  Topo da agenda + chamada nos stories e no canal oficial.
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-base font-medium">
                R$
              </span>
              <Input
                inputMode="numeric"
                placeholder="Valor do destaque"
                value={valorDestaque}
                onChange={(e) => setValorDestaque(e.target.value)}
                className="h-12 rounded-xl bg-slate-900 border-slate-700 text-slate-50 placeholder:text-slate-500 pl-9 text-base focus-visible:ring-amber-400 focus-visible:ring-offset-slate-950"
              />
            </div>
            <Button className="h-12 rounded-xl px-6 font-bold bg-gradient-to-r from-purple-600 via-fuchsia-500 to-amber-400 text-white hover:opacity-90 shadow-lg shadow-purple-900/40 transition-opacity">
              <Star className="h-4 w-4 mr-2" />
              Destacar publicação
            </Button>
          </div>
        </section>

        {/* Ações rápidas */}
        <section className="space-y-3 pt-2">
          <Button
            asChild
            className="w-full h-12 rounded-full bg-purple-600 text-white hover:bg-purple-500 font-semibold shadow-lg shadow-purple-900/40"
          >
            <Link to="/meus-eventos">
              <ListChecks className="h-4 w-4 mr-2" />
              Acompanhar meus eventos
            </Link>
          </Button>
          <div className="grid gap-3 sm:grid-cols-2">
            <Button
              asChild
              variant="secondary"
              className="w-full h-11 rounded-full font-medium bg-slate-800 text-slate-100 hover:bg-slate-700 border-none"
            >
              <Link to="/agenda">
                Voltar para agenda
                <ArrowRight className="h-4 w-4 ml-2" />
              </Link>
            </Button>
            {sub?.status === "pendente" && (
              <Button
                asChild
                className="w-full h-11 rounded-full bg-amber-400 text-slate-950 hover:bg-amber-300 font-semibold shadow-lg shadow-amber-400/20"
              >
                <Link to="/meus-eventos">
                  <PencilLine className="h-4 w-4 mr-2" />
                  Editar informações
                </Link>
              </Button>
            )}
          </div>
        </section>
      </main>

      {/* Rodapé institucional */}
      <footer className="border-t border-slate-800 bg-slate-950 py-6 sm:py-8">
        <div className="mx-auto max-w-3xl px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs sm:text-sm text-slate-300 font-medium text-center sm:text-left">
            Agendilha / COEABOA? — Transparência e Cultura
          </p>
          <nav className="flex items-center gap-6 text-xs sm:text-sm">
            <a
              href="https://wa.me/5521999999999"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 text-slate-400 hover:text-amber-400 transition-colors"
            >
              <span className="h-5 w-5 rounded-full bg-emerald-500 flex items-center justify-center shadow-md shadow-emerald-500/30">
                <MessageCircle className="h-3 w-3 text-white" />
              </span>
              Fale Conosco
            </a>
            <Link
              to="/divulgar"
              className="text-slate-400 hover:text-amber-400 transition-colors"
            >
              Divulgação Geral
            </Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}

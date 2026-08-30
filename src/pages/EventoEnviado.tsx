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
  Send,
} from "lucide-react";
import { useSubmission } from "@/data";
import logoCoeABoa from "@/assets/coeaboa-logo.webp";
import { useState } from "react";

interface Submission {
  id: string;
  event_title: string | null;
  title?: string | null;
  date: string | null;
  start_time?: string | null;
  location?: string | null;
  atrativo_name?: string | null;
  status: string;
}

const ETAPAS = ["Enviado", "Em análise", "Publicado"];

function formatDateBR(date: string | null | undefined): string | null {
  if (!date) return null;
  const d = new Date(`${date}T00:00:00`);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString("pt-BR", { weekday: "short", day: "2-digit", month: "short" });
}

export default function EventoEnviado() {
  const { id } = useParams<{ id: string }>();
  const validId = !!id && /^[0-9a-f-]{10,}$/i.test(id);
  const { data: sub, isLoading: loading } = useSubmission<Submission>(
    validId ? id! : "",
    "id, event_title, title, date, start_time, location, atrativo_name, status"
  );
  const [valorDestaque, setValorDestaque] = useState("");

  if (!validId) {
    return <Navigate to="/meus-eventos" replace />;
  }

  const nomeEvento = sub?.event_title || sub?.title || "Seu evento";
  const dataFormatada = formatDateBR(sub?.date);
  const etapaAtual = sub?.status === "approved" ? 2 : 1;

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {/* Cabeçalho */}
      <header className="w-full border-b border-foreground/10 bg-background/80 backdrop-blur sticky top-0 z-10">
        <div className="mx-auto max-w-3xl px-4 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5 group">
            <img
              src={logoCoeABoa}
              alt="COEABOA?"
              className="h-9 w-9 rounded-full shadow-sm group-hover:scale-105 transition-transform"
            />
            <span className="font-black tracking-tight text-lg">
              COE<span className="text-amber-400">A</span>BOA?
            </span>
          </Link>
          <Button
            asChild
            className="rounded-full bg-amber-400 text-black font-bold hover:bg-amber-300 shadow-md shadow-amber-400/20"
          >
            <Link to="/divulgar">
              <Megaphone className="h-4 w-4 mr-2" />
              DIVULGAR
            </Link>
          </Button>
        </div>
      </header>

      <main className="flex-1 w-full mx-auto max-w-3xl px-4 py-10 sm:py-14 space-y-10">
        {/* Mensagem central */}
        <div className="text-center space-y-3">
          <h1 className="text-2xl sm:text-4xl font-black tracking-tight leading-tight inline-flex flex-wrap items-center justify-center gap-2">
            <CheckCircle2 className="h-7 w-7 sm:h-9 sm:w-9 text-emerald-400" />
            Evento enviado para curadoria
          </h1>
          <p className="text-foreground/60 text-sm sm:text-base max-w-md mx-auto">
            Recebemos tudo certinho. Avisaremos você no WhatsApp assim que houver decisão.
          </p>
        </div>

        {/* Bloco de status */}
        <section className="rounded-3xl border border-foreground/10 bg-muted/40 p-5 sm:p-7 space-y-6 shadow-xl">
          {loading ? (
            <p className="text-foreground/60 inline-flex items-center gap-2 text-sm">
              <Loader2 className="h-4 w-4 animate-spin" /> Carregando detalhes…
            </p>
          ) : (
            <dl className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1">
                <dt className="text-[11px] uppercase tracking-widest text-foreground/50 font-semibold">
                  Evento
                </dt>
                <dd className="font-bold text-base sm:text-lg leading-snug">{nomeEvento}</dd>
              </div>
              <div className="space-y-1">
                <dt className="text-[11px] uppercase tracking-widest text-foreground/50 font-semibold">
                  Data e horário
                </dt>
                <dd className="inline-flex items-center gap-2 font-medium">
                  <CalendarClock className="h-4 w-4 text-amber-400" />
                  {dataFormatada ?? "Data a confirmar"}
                  {sub?.start_time ? ` · ${sub.start_time.slice(0, 5)}` : ""}
                </dd>
              </div>
              <div className="space-y-1">
                <dt className="text-[11px] uppercase tracking-widest text-foreground/50 font-semibold">
                  Local
                </dt>
                <dd className="inline-flex items-center gap-2 font-medium">
                  <MapPin className="h-4 w-4 text-amber-400" />
                  {sub?.location ?? "Local a confirmar"}
                </dd>
              </div>
              <div className="space-y-1">
                <dt className="text-[11px] uppercase tracking-widest text-foreground/50 font-semibold">
                  Atrativo principal
                </dt>
                <dd className="inline-flex items-center gap-2 font-medium">
                  <Mic2 className="h-4 w-4 text-amber-400" />
                  {sub?.atrativo_name ?? "A definir"}
                </dd>
              </div>
            </dl>
          )}

          {/* Barra de progresso */}
          <div className="pt-2">
            <ol className="relative flex items-start justify-between">
              <div
                aria-hidden
                className="absolute left-0 right-0 top-4 h-1 rounded-full bg-foreground/10"
              />
              <div
                aria-hidden
                className="absolute left-0 top-4 h-1 rounded-full bg-gradient-to-r from-purple-500 to-amber-400 transition-all"
                style={{ width: `${(etapaAtual / (ETAPAS.length - 1)) * 100}%` }}
              />
              {ETAPAS.map((etapa, i) => {
                const ativa = i <= etapaAtual;
                const atual = i === etapaAtual;
                return (
                  <li key={etapa} className="relative z-10 flex flex-col items-center gap-2 w-20">
                    <span
                      className={`h-8 w-8 rounded-full flex items-center justify-center border-2 transition-colors ${
                        ativa
                          ? "bg-amber-400 border-amber-400 text-black"
                          : "bg-background border-foreground/20 text-foreground/40"
                      }`}
                    >
                      {atual && i === 1 ? (
                        <Clock className="h-4 w-4 animate-[spin_6s_linear_infinite]" />
                      ) : (
                        <CheckCircle2 className="h-4 w-4" />
                      )}
                    </span>
                    <span
                      className={`text-[11px] font-semibold text-center ${
                        ativa ? "text-foreground" : "text-foreground/40"
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
        <section className="space-y-4">
          <h2 className="text-lg sm:text-xl font-bold tracking-tight">
            Quer mais visibilidade?
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl bg-purple-600/90 p-5 space-y-2 shadow-lg shadow-purple-900/30">
              <Sparkles className="h-6 w-6 text-purple-100" />
              <h3 className="font-bold text-purple-50">Destaque Simples</h3>
              <p className="text-sm text-purple-100/80 leading-relaxed">
                Seu evento aparece com selo especial na agenda da semana.
              </p>
            </div>
            <div className="rounded-2xl bg-amber-400 p-5 space-y-2 shadow-lg shadow-amber-900/30">
              <Crown className="h-6 w-6 text-amber-900" />
              <h3 className="font-bold text-amber-950">Destaque Plus</h3>
              <p className="text-sm text-amber-900/80 leading-relaxed">
                Topo da agenda + chamada nos stories e no canal oficial.
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1">
              <Input
                inputMode="numeric"
                placeholder="Valor do destaque (R$)"
                value={valorDestaque}
                onChange={(e) => setValorDestaque(e.target.value)}
                className="h-12 rounded-xl bg-muted/40 border-foreground/15 text-base"
              />
            </div>
            <Button className="h-12 rounded-xl px-6 font-bold bg-gradient-to-r from-purple-600 via-fuchsia-500 to-amber-400 text-white hover:opacity-90 shadow-lg shadow-purple-900/30">
              <Sparkles className="h-4 w-4 mr-2" />
              Destacar publicação
            </Button>
          </div>
        </section>

        {/* Ações rápidas */}
        <section className="space-y-3 pt-2">
          <Button
            asChild
            className="w-full h-12 rounded-full bg-purple-600 text-white hover:bg-purple-500 font-semibold shadow-lg shadow-purple-900/30"
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
              className="w-full h-11 rounded-full font-medium"
            >
              <Link to="/agenda">
                Voltar para agenda
                <ArrowRight className="h-4 w-4 ml-2" />
              </Link>
            </Button>
            {sub?.status === "pending" && (
              <Button
                asChild
                className="w-full h-11 rounded-full bg-amber-400 text-black hover:bg-amber-300 font-semibold"
              >
                <Link to={`/meus-eventos?editar=${sub.id}`}>
                  <PencilLine className="h-4 w-4 mr-2" />
                  Editar informações
                </Link>
              </Button>
            )}
          </div>
        </section>
      </main>

      {/* Rodapé institucional */}
      <footer className="border-t border-foreground/10 py-6">
        <div className="mx-auto max-w-3xl px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-foreground/50">
            Agendilha / COEABOA? — Transparência e Cultura
          </p>
          <nav className="flex items-center gap-5 text-xs">
            <a
              href="https://wa.me/5521999999999"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 text-foreground/60 hover:text-foreground transition-colors"
            >
              <Send className="h-3.5 w-3.5" />
              Fale Conosco
            </a>
            <Link
              to="/divulgar"
              className="text-foreground/60 hover:text-foreground transition-colors"
            >
              Divulgação Geral
            </Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}

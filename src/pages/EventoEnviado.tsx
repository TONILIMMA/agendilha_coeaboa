import { Link, Navigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Clock, ShieldCheck, ArrowRight, ListChecks, Loader2 } from "lucide-react";
import { useSubmission } from "@/data";

interface Submission {
  id: string;
  event_title: string;
  date: string | null;
  status: string;
}

export default function EventoEnviado() {
  const { id } = useParams<{ id: string }>();
  // Defensive: this page only makes sense with a real submission id.
  const validId = !!id && /^[0-9a-f-]{10,}$/i.test(id);
  const { data: sub, isLoading: loading } = useSubmission<Submission>(
    validId ? id! : "",
    "id, event_title, date, status"
  );
  if (!validId) {
    return <Navigate to="/meus-eventos" replace />;
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-xl text-center space-y-10">
        {/* Selo de curadoria */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-foreground/15 bg-foreground/[0.03]">
          <ShieldCheck className="h-3.5 w-3.5 text-foreground/70" strokeWidth={2} />
          <span className="text-[11px] font-semibold uppercase tracking-[0.22em] text-foreground/70">
            Em análise pela curadoria
          </span>
        </div>

        <div className="space-y-4">
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-foreground leading-[1.1]">
            Recebemos seu evento.
            <br />
            <span className="text-foreground/60 font-light italic">Obrigado pela contribuição.</span>
          </h1>

          {!loading && sub && (
            <p className="text-foreground/70 text-base">
              <span className="font-semibold text-foreground">{sub.event_title}</span> entrou na
              fila com status <span className="font-medium">pendente</span>.
            </p>
          )}
          {loading && (
            <p className="text-foreground/60 inline-flex items-center justify-center gap-2 text-sm">
              <Loader2 className="h-4 w-4 animate-spin" /> Carregando detalhes…
            </p>
          )}
        </div>

        {/* Prazo estimado */}
        <div className="mx-auto max-w-md rounded-2xl border border-foreground/10 bg-foreground/[0.02] p-5 text-left">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 shrink-0 h-9 w-9 rounded-full bg-foreground/5 flex items-center justify-center">
              <Clock className="h-4 w-4 text-foreground/70" strokeWidth={2} />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-semibold text-foreground tracking-tight">
                Prazo estimado de análise
              </p>
              <p className="text-sm text-foreground/65 leading-relaxed">
                Até <span className="font-semibold text-foreground">48 horas úteis</span>. Eventos com
                data próxima entram na frente da fila.
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-3 pt-2">
          <Button
            asChild
            className="w-full h-12 rounded-full bg-foreground text-background hover:bg-foreground/90 font-semibold tracking-tight shadow-none"
          >
            <Link to="/meus-eventos">
              <ListChecks className="h-4 w-4 mr-2" />
              Acompanhar meus eventos
            </Link>
          </Button>
          <Button
            asChild
            variant="ghost"
            className="w-full h-11 rounded-full text-foreground/70 hover:text-foreground hover:bg-foreground/5"
          >
            <Link to="/agenda">
              Voltar para a agenda
              <ArrowRight className="h-4 w-4 ml-2" />
            </Link>
          </Button>
        </div>

        <p className="text-xs text-foreground/50 leading-relaxed pt-4">
          Avisaremos você no WhatsApp assim que houver decisão da curadoria.
        </p>
      </div>
    </div>
  );
}
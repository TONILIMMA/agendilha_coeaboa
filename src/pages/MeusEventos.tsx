import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useSubmissions } from "@/data";
import { EditarMeuEventoDialog, type EventoEditavel } from "@/components/divulgador/EditarMeuEventoDialog";
import { Pencil, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Calendar,
  Clock,
  Loader2,
  PlusCircle,
  ShieldCheck,
  XCircle,
  AlertCircle,
} from "lucide-react";
import { formatBrazilianDate } from "@/lib/date-utils";
import { SolicitarDivulgadorCard } from "@/components/divulgador/SolicitarDivulgadorCard";
import { useDivulgadorStatus } from "@/hooks/useDivulgadorStatus";
import { LoadingState } from "@/components/ui/LoadingState";

type StatusKey = "todos" | "pendente" | "aprovado" | "rejeitado";

interface Row {
  id: string;
  event_title: string;
  date: string | null;
  start_time: string | null;
  status: string;
  rejection_reason: string | null;
  admin_notes: string | null;
  approved_at: string | null;
  image_url: string | null;
  slug: string | null;
  created_at: string;
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string; Icon: any }> = {
    pendente: {
      label: "Em análise",
      cls: "border-amber-600/30 text-amber-700 bg-amber-50/60",
      Icon: Clock,
    },
    aprovado: {
      label: "Aprovado",
      cls: "border-emerald-600/30 text-emerald-700 bg-emerald-50/60",
      Icon: ShieldCheck,
    },
    publicado: {
      label: "Publicado",
      cls: "border-emerald-600/30 text-emerald-700 bg-emerald-50/60",
      Icon: ShieldCheck,
    },
    rejeitado: {
      label: "Rejeitado",
      cls: "border-red-600/30 text-red-700 bg-red-50/60",
      Icon: XCircle,
    },
  };
  const m = map[status] || {
    label: status,
    cls: "border-foreground/15 text-foreground/70 bg-foreground/5",
    Icon: AlertCircle,
  };
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[11px] font-semibold uppercase tracking-[0.14em] ${m.cls}`}
    >
      <m.Icon className="h-3 w-3" strokeWidth={2} />
      {m.label}
    </span>
  );
}

export default function MeusEventos() {
  const { user } = useAuth();
  const [tab, setTab] = useState<StatusKey>("todos");
  const { isDivulgador } = useDivulgadorStatus();
  const [editing, setEditing] = useState<EventoEditavel | null>(null);

  const { data: rows = [], isLoading: loading, refetch } = useSubmissions<Row>(
    {
      select:
        "id, event_title, date, start_time, end_time, location, description, status, rejection_reason, admin_notes, approved_at, image_url, slug, created_at, user_id",
      eq: user ? { user_id: user.id } : undefined,
    },
    { enabled: !!user }
  );

  const counts = useMemo(() => {
    const c = { todos: rows.length, pendente: 0, aprovado: 0, rejeitado: 0 } as Record<StatusKey, number>;
    rows.forEach((r) => {
      if (r.status === "pendente") c.pendente++;
      else if (r.status === "aprovado" || r.status === "publicado") c.aprovado++;
      else if (r.status === "rejeitado") c.rejeitado++;
    });
    return c;
  }, [rows]);

  const filtered = useMemo(() => {
    if (tab === "todos") return rows;
    if (tab === "aprovado")
      return rows.filter((r) => r.status === "aprovado" || r.status === "publicado");
    return rows.filter((r) => r.status === tab);
  }, [rows, tab]);

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-4 py-10 sm:py-14 space-y-8">
        <header className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-foreground/12 bg-foreground/[0.02] mb-3">
              <span className="text-[10px] font-semibold uppercase tracking-[0.22em] text-foreground/60">
                Curadoria · Painel do divulgador
              </span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-foreground">
              Meus eventos
            </h1>
            <p className="text-foreground/65 mt-1 text-sm">
              Acompanhe o status de tudo que você enviou para análise.
            </p>
          </div>
          {isDivulgador && (
            <Button
              asChild
              className="rounded-full h-11 bg-foreground text-background hover:bg-foreground/90 font-semibold tracking-tight shadow-none px-5"
            >
              <Link to="/enviar-evento">
                <PlusCircle className="h-4 w-4 mr-2" />
                Divulgar evento
              </Link>
            </Button>
          )}
        </header>

        <SolicitarDivulgadorCard />

        <Tabs value={tab} onValueChange={(v) => setTab(v as StatusKey)}>
          <TabsList className="bg-foreground/[0.04] rounded-full p-1">
            <TabsTrigger value="todos" className="rounded-full px-4">
              Todos <span className="ml-1.5 opacity-60">{counts.todos}</span>
            </TabsTrigger>
            <TabsTrigger value="pendente" className="rounded-full px-4">
              Em análise <span className="ml-1.5 opacity-60">{counts.pendente}</span>
            </TabsTrigger>
            <TabsTrigger value="aprovado" className="rounded-full px-4">
              Aprovados <span className="ml-1.5 opacity-60">{counts.aprovado}</span>
            </TabsTrigger>
            <TabsTrigger value="rejeitado" className="rounded-full px-4">
              Rejeitados <span className="ml-1.5 opacity-60">{counts.rejeitado}</span>
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {loading ? (
          <LoadingState message="Carregando seus rolês…" />
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center space-y-3 border border-dashed border-foreground/15 rounded-2xl">
            <p className="text-foreground/65 text-sm">Nada por aqui ainda.</p>
            {isDivulgador ? (
              <Button
                asChild
                variant="outline"
                className="rounded-full border-foreground/15 hover:bg-foreground/5"
              >
                <Link to="/enviar-evento">Divulgar meu primeiro evento</Link>
              </Button>
            ) : (
              <p className="text-xs text-foreground/55">
                Pra criar ou editar eventos você precisa de acesso de Divulgador — peça acima.
              </p>
            )}
          </div>
        ) : (
          <ul className="space-y-3">
            {filtered.map((r) => (
              <li
                key={r.id}
                className="group flex gap-4 p-4 rounded-2xl border border-foreground/10 hover:border-foreground/25 bg-background transition-colors"
              >
                <div className="hidden sm:block shrink-0 w-20 h-20 rounded-xl overflow-hidden bg-foreground/5">
                  {r.image_url ? (
                    <img
                      src={r.image_url}
                      alt={r.event_title}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-foreground/30">
                      <Calendar className="h-6 w-6" />
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0 space-y-2">
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="font-semibold tracking-tight text-foreground truncate">
                      {r.event_title}
                    </h3>
                    <StatusBadge status={r.status} />
                  </div>
                  <p className="text-xs text-foreground/60 flex items-center gap-2">
                    <Calendar className="h-3 w-3" />
                    {r.date ? formatBrazilianDate(r.date) : "Data a confirmar"}
                    {r.start_time && ` · ${r.start_time}`}
                  </p>
                  {r.status === "rejeitado" && r.rejection_reason && (
                    <p className="text-xs text-red-700 bg-red-50/60 border border-red-200/60 rounded-md px-2 py-1.5">
                      <span className="font-semibold">Motivo: </span>
                      {r.rejection_reason}
                    </p>
                  )}
                  {isDivulgador && user && r.user_id === user.id && (
                    <div className="pt-1">
                      {r.status === "publicado" ? (
                        <span className="inline-flex items-center gap-1.5 text-[11px] text-foreground/55">
                          <Lock className="h-3 w-3" />
                          Já publicado — peça alteração pra curadoria.
                        </span>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          className="rounded-full h-8 text-xs border-foreground/15 hover:bg-foreground/5"
                          onClick={() => setEditing(r as unknown as EventoEditavel)}
                        >
                          <Pencil className="h-3.5 w-3.5 mr-1.5" />
                          Editar
                        </Button>
                      )}
                    </div>
                  )}
                  {(r.status === "aprovado" || r.status === "publicado") && r.slug && (
                    <Link
                      to={`/evento/${r.slug}`}
                      className="inline-block text-xs font-semibold text-foreground/80 hover:text-foreground underline underline-offset-4"
                    >
                      Ver na agenda →
                    </Link>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <EditarMeuEventoDialog
        evento={editing}
        open={!!editing}
        onOpenChange={(v) => !v && setEditing(null)}
        onSaved={() => refetch?.()}
      />
    </div>
  );
}
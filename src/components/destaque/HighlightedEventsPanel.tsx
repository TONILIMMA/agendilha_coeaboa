import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CalendarClock, Eye, EyeOff, Loader2, Plus, Star, StarOff } from "lucide-react";
import { toast } from "sonner";
import { handleError } from "@/lib/error-handler";
import { LoadingState } from "@/components/ui/LoadingState";
import {
  useHighlightActions,
  useHighlightCandidates,
  useHighlightedEvents,
  type HighlightedEvent,
} from "@/data/useHighlights";
import { useHighlightPackages, formatDuration, formatPriceBRL } from "@/data/useHighlightPackages";
import { HIGHLIGHT_STATUS_LABEL, highlightDaysLeft, type HighlightStatus } from "@/lib/highlights";

const FILTROS: { value: HighlightStatus | "todos"; label: string }[] = [
  { value: "todos", label: "Todos" },
  { value: "ativo", label: "Ativos" },
  { value: "expirado", label: "Expirados" },
  { value: "escondido", label: "Escondidos" },
];

function statusBadge(status: HighlightStatus) {
  const label = HIGHLIGHT_STATUS_LABEL[status];
  if (status === "ativo") return <Badge className="bg-emerald-600 hover:bg-emerald-600">{label}</Badge>;
  if (status === "expirado") return <Badge variant="destructive">{label}</Badge>;
  if (status === "escondido") return <Badge variant="outline">{label}</Badge>;
  return <Badge variant="secondary">{label}</Badge>;
}

function formatData(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });
}

export function HighlightedEventsPanel() {
  const { data: destaques = [], isLoading } = useHighlightedEvents();
  const { data: pacotes = [] } = useHighlightPackages();
  const { ativar, estender, esconder, encerrar } = useHighlightActions();

  const [filtro, setFiltro] = useState<HighlightStatus | "todos">("todos");
  const [busca, setBusca] = useState("");
  const [novoRole, setNovoRole] = useState<string>("");
  const [novoPacote, setNovoPacote] = useState<string>("");
  const { data: candidatos = [], isLoading: loadingCandidatos } = useHighlightCandidates(busca);

  const lista = useMemo(
    () => (filtro === "todos" ? destaques : destaques.filter((d) => d.status === filtro)),
    [destaques, filtro],
  );

  const ativos = destaques.filter((d) => d.status === "ativo").length;

  async function handleAtivar() {
    const pacote = pacotes.find((p) => p.id === novoPacote);
    if (!novoRole || !pacote) {
      toast.error("Escolha o rolê e o plano de destaque.");
      return;
    }
    try {
      await ativar.mutateAsync({
        eventId: novoRole,
        packageId: pacote.id,
        durationDays: pacote.duration_days,
      });
      toast.success(`Destaque ligado por ${formatDuration(pacote.duration_days)}.`);
      setNovoRole("");
      setNovoPacote("");
    } catch (e) {
      handleError(e, "Não deu pra ligar o destaque agora");
    }
  }

  async function handleEstender(item: HighlightedEvent) {
    const dias = item.package_duration_days ?? 7;
    try {
      await estender.mutateAsync({ eventId: item.id, days: dias, currentUntil: item.highlight_until });
      toast.success(`Destaque estendido por ${formatDuration(dias)}.`);
    } catch (e) {
      handleError(e, "Não deu pra estender o destaque");
    }
  }

  async function handleEsconder(item: HighlightedEvent) {
    try {
      await esconder.mutateAsync({ eventId: item.id, hidden: !item.highlight_hidden });
      toast.success(item.highlight_hidden ? "Destaque de volta na vitrine." : "Destaque escondido da vitrine.");
    } catch (e) {
      handleError(e, "Não deu pra mudar a visibilidade");
    }
  }

  async function handleEncerrar(item: HighlightedEvent) {
    try {
      await encerrar.mutateAsync(item.id);
      toast.success("Destaque encerrado.");
    } catch (e) {
      handleError(e, "Não deu pra encerrar o destaque");
    }
  }

  return (
    <div className="space-y-5">
      <Card className="rounded-2xl">
        <CardContent className="pt-5 space-y-4">
          <div className="space-y-1">
            <h2 className="font-bold text-base">Ligar um destaque</h2>
            <p className="text-xs text-muted-foreground">
              Escolha o rolê e o plano. O prazo é calculado automaticamente pela duração do plano.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="busca-role">Procurar rolê</Label>
              <Input
                id="busca-role"
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                placeholder="Digite parte do nome"
                className="h-11"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Rolê</Label>
              <Select value={novoRole} onValueChange={setNovoRole}>
                <SelectTrigger className="h-11">
                  <SelectValue placeholder={loadingCandidatos ? "Carregando…" : "Selecione o rolê"} />
                </SelectTrigger>
                <SelectContent>
                  {candidatos.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {(c.event_title || "Rolê sem título") + (c.date ? ` · ${c.date}` : "")}
                    </SelectItem>
                  ))}
                  {candidatos.length === 0 && (
                    <div className="px-3 py-2 text-xs text-muted-foreground">
                      Nenhum rolê disponível pra destacar.
                    </div>
                  )}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Plano</Label>
              <Select value={novoPacote} onValueChange={setNovoPacote}>
                <SelectTrigger className="h-11">
                  <SelectValue placeholder="Selecione o plano" />
                </SelectTrigger>
                <SelectContent>
                  {pacotes.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name} · {formatPriceBRL(p.price_cents)} · {formatDuration(p.duration_days)}
                    </SelectItem>
                  ))}
                  {pacotes.length === 0 && (
                    <div className="px-3 py-2 text-xs text-muted-foreground">
                      Nenhum plano ativo. Crie um na aba Pacotes.
                    </div>
                  )}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button
                onClick={() => void handleAtivar()}
                disabled={ativar.isPending}
                className="h-11 w-full font-bold"
              >
                {ativar.isPending ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Plus className="h-4 w-4 mr-2" />
                )}
                Ligar destaque
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs text-muted-foreground mr-1">
          {ativos} destaque{ativos === 1 ? "" : "s"} valendo agora
        </span>
        {FILTROS.map((f) => (
          <Button
            key={f.value}
            size="sm"
            variant={filtro === f.value ? "default" : "outline"}
            onClick={() => setFiltro(f.value)}
            className="rounded-full"
          >
            {f.label}
          </Button>
        ))}
      </div>

      {isLoading ? (
        <LoadingState message="Carregando destaques…" />
      ) : lista.length === 0 ? (
        <p className="text-sm text-muted-foreground py-6">
          Nenhum rolê nesse status. Ligue um destaque no bloco acima.
        </p>
      ) : (
        <div className="space-y-3">
          {lista.map((item) => {
            const dias = highlightDaysLeft(item);
            return (
              <Card key={item.id} className="rounded-2xl">
                <CardContent className="pt-4 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-bold truncate">{item.event_title || "Rolê sem título"}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {[item.date, item.address_neighborhood].filter(Boolean).join(" · ") || "—"}
                      </p>
                    </div>
                    {statusBadge(item.status)}
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                    <div>
                      <p className="text-muted-foreground">Plano</p>
                      <p className="font-semibold">{item.package_name ?? "Manual"}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Começou</p>
                      <p className="font-semibold">{formatData(item.highlight_starts_at)}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Vale até</p>
                      <p className="font-semibold">{formatData(item.highlight_until)}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Faltam</p>
                      <p className="font-semibold">
                        {dias === null ? "Sem prazo" : dias === 0 ? "Acabou" : formatDuration(dias)}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 pt-1">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => void handleEstender(item)}
                      disabled={estender.isPending}
                    >
                      <CalendarClock className="h-4 w-4 mr-2" />
                      Estender {formatDuration(item.package_duration_days ?? 7)}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => void handleEsconder(item)}
                      disabled={esconder.isPending}
                    >
                      {item.highlight_hidden ? (
                        <>
                          <Eye className="h-4 w-4 mr-2" />
                          Mostrar na vitrine
                        </>
                      ) : (
                        <>
                          <EyeOff className="h-4 w-4 mr-2" />
                          Esconder
                        </>
                      )}
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-destructive hover:text-destructive"
                      onClick={() => void handleEncerrar(item)}
                      disabled={encerrar.isPending}
                    >
                      {item.status === "ativo" ? (
                        <StarOff className="h-4 w-4 mr-2" />
                      ) : (
                        <Star className="h-4 w-4 mr-2" />
                      )}
                      Encerrar destaque
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

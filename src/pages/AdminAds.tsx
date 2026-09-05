import { useMemo, useState } from "react";
import { Navigate } from "react-router-dom";
import { PageContainer } from "@/components/ui/PageContainer";
import { LoadingState } from "@/components/ui/LoadingState";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Check, ShoppingBag, Sparkles, X } from "lucide-react";
import { toast } from "sonner";
import { handleError } from "@/lib/error-handler";
import { useAppPermissions } from "@/hooks/useAppPermissions";
import { useAllAds, useModerateAd, type Ad, type AdStatus } from "@/data/useAds";
import { useAdPlans, formatDurationDays, formatPriceBRL } from "@/data/useAdPlans";
import { AdCard } from "@/components/anuncios/AdCard";

const FILTROS: { valor: AdStatus | "todos"; label: string }[] = [
  { valor: "pendente", label: "Em análise" },
  { valor: "publicado", label: "Publicados" },
  { valor: "recusado", label: "Recusados" },
  { valor: "todos", label: "Todos" },
];

export default function AdminAds() {
  const { isAdmin, loading: permsLoading } = useAppPermissions();
  const { data: anuncios = [], isLoading } = useAllAds(isAdmin);
  const { data: planos = [] } = useAdPlans(true);
  const moderar = useModerateAd();

  const [filtro, setFiltro] = useState<AdStatus | "todos">("pendente");
  const [motivos, setMotivos] = useState<Record<string, string>>({});
  const [planoEscolhido, setPlanoEscolhido] = useState<Record<string, string>>({});

  const lista = useMemo(
    () => (filtro === "todos" ? anuncios : anuncios.filter((a) => a.status === filtro)),
    [anuncios, filtro],
  );

  async function aplicar(id: string, patch: Parameters<typeof moderar.mutateAsync>[0]["patch"], msg: string) {
    try {
      await moderar.mutateAsync({ id, patch });
      toast.success(msg);
    } catch (e) {
      handleError(e, "Não deu pra atualizar o anúncio");
    }
  }

  function publicar(ad: Ad) {
    void aplicar(
      ad.id,
      { status: "publicado", rejection_reason: null, published_at: new Date().toISOString() },
      "Anúncio publicado.",
    );
  }

  function recusar(ad: Ad) {
    const motivo = (motivos[ad.id] ?? "").trim();
    if (motivo.length < 5) {
      toast.error("Escreva o motivo pra pessoa saber o que ajustar.");
      return;
    }
    void aplicar(ad.id, { status: "recusado", rejection_reason: motivo }, "Anúncio recusado.");
  }

  function ativarDestaque(ad: Ad) {
    const planoId = planoEscolhido[ad.id];
    const plano = planos.find((p) => p.id === planoId);
    if (!plano) {
      toast.error("Escolha o plano contratado.");
      return;
    }
    const ate = new Date();
    ate.setDate(ate.getDate() + plano.duration_days);
    void aplicar(
      ad.id,
      { is_highlight: true, highlight_plan_id: plano.id, highlight_until: ate.toISOString() },
      `Destaque ${plano.name} ativado por ${formatDurationDays(plano.duration_days)}.`,
    );
  }

  function tirarDestaque(ad: Ad) {
    void aplicar(
      ad.id,
      { is_highlight: false, highlight_plan_id: null, highlight_until: null },
      "Destaque removido.",
    );
  }

  if (permsLoading) return <LoadingState message="Verificando seu acesso…" fullPage />;
  if (!isAdmin) return <Navigate to="/" replace />;

  return (
    <PageContainer>
      <div className="space-y-6">
        <header className="space-y-2">
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight inline-flex items-center gap-2">
            <ShoppingBag className="h-6 w-6 text-primary" />
            Anúncios
          </h1>
          <p className="text-sm text-muted-foreground max-w-2xl leading-relaxed">
            Confira, publique ou recuse anúncios e ligue o destaque de quem contratou.
          </p>
        </header>

        <div className="flex gap-2 overflow-x-auto pb-1">
          {FILTROS.map((f) => (
            <button key={f.valor} type="button" onClick={() => setFiltro(f.valor)}>
              <Badge
                variant={filtro === f.valor ? "default" : "outline"}
                className="cursor-pointer whitespace-nowrap"
              >
                {f.label}
              </Badge>
            </button>
          ))}
        </div>

        {isLoading ? (
          <LoadingState message="Carregando anúncios…" />
        ) : lista.length === 0 ? (
          <div className="rounded-2xl border border-dashed p-8 text-center">
            <p className="font-semibold">Nada nessa lista agora.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {lista.map((ad) => (
              <Card key={ad.id} className="rounded-2xl">
                <CardContent className="pt-6 space-y-4">
                  <AdCard ad={ad} showStatus />

                  <p className="text-sm text-muted-foreground leading-relaxed line-clamp-4">
                    {ad.description}
                  </p>

                  <div className="flex flex-wrap gap-2">
                    {ad.status !== "publicado" && (
                      <Button size="sm" onClick={() => publicar(ad)} className="font-semibold">
                        <Check className="h-4 w-4 mr-1.5" />
                        Publicar
                      </Button>
                    )}
                    {ad.is_highlight ? (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => tirarDestaque(ad)}
                        className="font-semibold"
                      >
                        Tirar destaque
                      </Button>
                    ) : (
                      <div className="flex flex-wrap items-end gap-2">
                        <div className="space-y-1">
                          <Label htmlFor={`plano-${ad.id}`} className="text-xs">
                            Plano contratado
                          </Label>
                          <Select
                            value={planoEscolhido[ad.id] ?? ""}
                            onValueChange={(v) =>
                              setPlanoEscolhido((prev) => ({ ...prev, [ad.id]: v }))
                            }
                          >
                            <SelectTrigger id={`plano-${ad.id}`} className="h-9 w-56">
                              <SelectValue placeholder="Escolha o plano" />
                            </SelectTrigger>
                            <SelectContent>
                              {planos.map((p) => (
                                <SelectItem key={p.id} value={p.id}>
                                  {p.name} · {formatPriceBRL(p.price_cents)} ·{" "}
                                  {formatDurationDays(p.duration_days)}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => ativarDestaque(ad)}
                          className="font-semibold"
                        >
                          <Sparkles className="h-4 w-4 mr-1.5" />
                          Ativar destaque
                        </Button>
                      </div>
                    )}
                  </div>

                  {ad.status !== "recusado" && (
                    <div className="flex flex-wrap items-end gap-2">
                      <div className="space-y-1 flex-1 min-w-[220px]">
                        <Label htmlFor={`motivo-${ad.id}`} className="text-xs">
                          Motivo da recusa
                        </Label>
                        <Input
                          id={`motivo-${ad.id}`}
                          value={motivos[ad.id] ?? ""}
                          onChange={(e) =>
                            setMotivos((prev) => ({ ...prev, [ad.id]: e.target.value }))
                          }
                          placeholder="Ex.: faltou foto do produto"
                          className="h-9"
                        />
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => recusar(ad)}
                        className="text-destructive hover:text-destructive font-semibold"
                      >
                        <X className="h-4 w-4 mr-1.5" />
                        Recusar
                      </Button>
                    </div>
                  )}

                  {ad.status === "recusado" && ad.rejection_reason && (
                    <p className="text-xs text-destructive">Motivo: {ad.rejection_reason}</p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </PageContainer>
  );
}

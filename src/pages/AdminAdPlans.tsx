import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useAppPermissions } from "@/hooks/useAppPermissions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Loader2, Plus, Save, ShoppingBag, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { handleError } from "@/lib/error-handler";
import { LoadingState } from "@/components/ui/LoadingState";
import { PageContainer } from "@/components/ui/PageContainer";
import { centsToInput, formatPriceBRL, inputToCents } from "@/data/useAdPlans";

interface Plano {
  id: string;
  name: string;
  description: string | null;
  benefits: string;
  price_reais: string;
  duration_days: string;
  is_active: boolean;
  display_order: number;
  novo?: boolean;
}

export default function AdminAdPlans() {
  const { user } = useAuth();
  const { isAdmin, loading: permsLoading } = useAppPermissions();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [planos, setPlanos] = useState<Plano[]>([]);

  useEffect(() => {
    if (!isAdmin) return;
    void carregar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin]);

  async function carregar() {
    setLoading(true);
    const { data, error } = await supabase
      .from("ad_plans")
      .select("id, name, description, benefits, price_cents, duration_days, is_active, display_order")
      .order("display_order", { ascending: true });
    if (error) {
      handleError(error, "Não deu pra carregar os planos de anúncio");
    } else {
      setPlanos(
        (data ?? []).map((p) => ({
          id: p.id,
          name: p.name,
          description: p.description,
          benefits: (p.benefits ?? []).join("\n"),
          price_reais: centsToInput(p.price_cents),
          duration_days: String(p.duration_days),
          is_active: p.is_active,
          display_order: p.display_order,
        })),
      );
    }
    setLoading(false);
  }

  function atualizar(id: string, campo: keyof Plano, valor: unknown) {
    setPlanos((prev) => prev.map((p) => (p.id === id ? { ...p, [campo]: valor } : p)));
  }

  function adicionar() {
    setPlanos((prev) => [
      ...prev,
      {
        id: `novo-${Date.now()}`,
        name: "",
        description: "",
        benefits: "",
        price_reais: "0,00",
        duration_days: "7",
        is_active: true,
        display_order: prev.length + 1,
        novo: true,
      },
    ]);
  }

  async function salvar(plano: Plano) {
    const nome = plano.name.trim();
    if (nome.length < 3) {
      toast.error("Dê um nome ao plano (mínimo 3 letras).");
      return;
    }
    const cents = inputToCents(plano.price_reais);
    if (cents === null) {
      toast.error("Valor inválido. Use algo como 60,00.");
      return;
    }
    const dias = Number(plano.duration_days);
    if (!Number.isInteger(dias) || dias < 1) {
      toast.error("Informe a duração em dias (número inteiro maior que zero).");
      return;
    }

    setSaving(plano.id);
    const payload = {
      name: nome,
      description: plano.description?.trim() || null,
      benefits: plano.benefits
        .split("\n")
        .map((b) => b.trim())
        .filter(Boolean),
      price_cents: cents,
      duration_days: dias,
      is_active: plano.is_active,
      display_order: plano.display_order,
      updated_by: user?.id ?? null,
    };

    const { error } = plano.novo
      ? await supabase.from("ad_plans").insert(payload)
      : await supabase.from("ad_plans").update(payload).eq("id", plano.id);
    setSaving(null);

    if (error) {
      handleError(error, "Não deu pra salvar o plano");
      return;
    }
    toast.success(`${nome} salvo. Já aparece assim para quem anuncia.`);
    void carregar();
  }

  async function remover(plano: Plano) {
    if (plano.novo) {
      setPlanos((prev) => prev.filter((p) => p.id !== plano.id));
      return;
    }
    setSaving(plano.id);
    const { error } = await supabase.from("ad_plans").delete().eq("id", plano.id);
    setSaving(null);
    if (error) {
      handleError(error, "Não deu pra remover o plano");
      return;
    }
    toast.success("Plano removido.");
    void carregar();
  }

  if (permsLoading) return <LoadingState message="Verificando seu acesso…" fullPage />;
  if (!isAdmin) return <Navigate to="/" replace />;

  return (
    <PageContainer>
      <div className="space-y-6">
        <header className="space-y-2">
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight inline-flex items-center gap-2">
            <ShoppingBag className="h-6 w-6 text-primary" />
            Planos de anúncio
          </h1>
          <p className="text-sm text-muted-foreground max-w-2xl leading-relaxed">
            Defina nome, valor, prazo e benefícios de cada plano. Quem anuncia vê exatamente o que
            você salvar aqui. Planos desativados não aparecem para ninguém.
          </p>
        </header>

        {loading ? (
          <LoadingState message="Carregando planos…" />
        ) : (
          <div className="space-y-4">
            {planos.length === 0 && (
              <p className="text-sm text-muted-foreground">
                Nenhum plano cadastrado ainda. Crie o primeiro no botão abaixo.
              </p>
            )}

            {planos.map((plano) => (
              <Card key={plano.id} className="rounded-2xl">
                <CardHeader className="flex flex-row items-center justify-between gap-3 pb-3">
                  <CardTitle className="text-base font-bold flex items-center gap-2">
                    {plano.name || "Novo plano"}
                    {plano.is_active ? (
                      <Badge variant="secondary">Ativo</Badge>
                    ) : (
                      <Badge variant="outline">Desativado</Badge>
                    )}
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <Label htmlFor={`ativo-${plano.id}`} className="text-xs text-muted-foreground">
                      Mostrar
                    </Label>
                    <Switch
                      id={`ativo-${plano.id}`}
                      checked={plano.is_active}
                      onCheckedChange={(v) => atualizar(plano.id, "is_active", v)}
                    />
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <Label htmlFor={`nome-${plano.id}`}>Nome do plano</Label>
                      <Input
                        id={`nome-${plano.id}`}
                        value={plano.name}
                        onChange={(e) => atualizar(plano.id, "name", e.target.value)}
                        placeholder="Ex.: Premium"
                        className="h-11"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor={`ordem-${plano.id}`}>Ordem de exibição</Label>
                      <Input
                        id={`ordem-${plano.id}`}
                        inputMode="numeric"
                        value={String(plano.display_order)}
                        onChange={(e) =>
                          atualizar(plano.id, "display_order", Number(e.target.value) || 0)
                        }
                        className="h-11"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor={`valor-${plano.id}`}>Valor (R$)</Label>
                      <Input
                        id={`valor-${plano.id}`}
                        inputMode="decimal"
                        value={plano.price_reais}
                        onChange={(e) => atualizar(plano.id, "price_reais", e.target.value)}
                        placeholder="60,00"
                        className="h-11"
                      />
                      <p className="text-[11px] text-muted-foreground">
                        Aparece como {formatPriceBRL(inputToCents(plano.price_reais) ?? 0)}
                      </p>
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor={`dias-${plano.id}`}>Duração (dias)</Label>
                      <Input
                        id={`dias-${plano.id}`}
                        inputMode="numeric"
                        value={plano.duration_days}
                        onChange={(e) => atualizar(plano.id, "duration_days", e.target.value)}
                        placeholder="15"
                        className="h-11"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor={`desc-${plano.id}`}>Resumo do plano</Label>
                    <Textarea
                      id={`desc-${plano.id}`}
                      value={plano.description ?? ""}
                      onChange={(e) => atualizar(plano.id, "description", e.target.value)}
                      placeholder="Seu anúncio no topo do carrossel de destaques."
                      rows={2}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor={`benef-${plano.id}`}>Benefícios (um por linha)</Label>
                    <Textarea
                      id={`benef-${plano.id}`}
                      value={plano.benefits}
                      onChange={(e) => atualizar(plano.id, "benefits", e.target.value)}
                      placeholder={"Topo do carrossel\nSelo de destaque\nCompartilhamento nos stories"}
                      rows={4}
                    />
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Button
                      onClick={() => void salvar(plano)}
                      disabled={saving === plano.id}
                      className="font-semibold"
                    >
                      {saving === plano.id ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Save className="h-4 w-4 mr-2" />
                      )}
                      Salvar
                    </Button>
                    <Button
                      variant="ghost"
                      onClick={() => void remover(plano)}
                      disabled={saving === plano.id}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Remover
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}

            <Button variant="outline" onClick={adicionar} className="font-semibold">
              <Plus className="h-4 w-4 mr-2" />
              Novo plano de anúncio
            </Button>
          </div>
        )}
      </div>
    </PageContainer>
  );
}

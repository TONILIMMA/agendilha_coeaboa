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
import { Loader2, Plus, Save, Sparkles, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { handleError } from "@/lib/error-handler";
import { LoadingState } from "@/components/ui/LoadingState";
import { PageContainer } from "@/components/ui/PageContainer";
import { formatPriceBRL } from "@/data/useHighlightPackages";

interface Pacote {
  id: string;
  name: string;
  description: string | null;
  price_reais: string;
  duration_days: string;
  is_active: boolean;
  display_order: number;
  novo?: boolean;
}

function toReais(cents: number): string {
  return (cents / 100).toFixed(2).replace(".", ",");
}

function toCents(valor: string): number | null {
  const limpo = valor.replace(/[^\d,.-]/g, "").replace(/\./g, "").replace(",", ".");
  const n = Number(limpo);
  if (!Number.isFinite(n) || n < 0) return null;
  return Math.round(n * 100);
}

export default function AdminDestaques() {
  const { user } = useAuth();
  const { hasPermission, loading: permsLoading } = useAppPermissions();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [pacotes, setPacotes] = useState<Pacote[]>([]);

  const canManage = hasPermission("events.read"); // Administrador ou Master

  useEffect(() => {
    if (!canManage) return;
    void carregar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canManage]);

  async function carregar() {
    setLoading(true);
    const { data, error } = await supabase
      .from("highlight_packages")
      .select("id, name, description, price_cents, duration_days, is_active, display_order")
      .order("display_order", { ascending: true });
    if (error) {
      handleError(error, "Não deu pra carregar os planos de destaque");
    } else {
      setPacotes(
        (data ?? []).map((p) => ({
          id: p.id,
          name: p.name,
          description: p.description,
          price_reais: toReais(p.price_cents),
          duration_days: String(p.duration_days),
          is_active: p.is_active,
          display_order: p.display_order,
        })),
      );
    }
    setLoading(false);
  }

  function atualizar(id: string, campo: keyof Pacote, valor: unknown) {
    setPacotes((prev) => prev.map((p) => (p.id === id ? { ...p, [campo]: valor } : p)));
  }

  function adicionar() {
    const id = `novo-${Date.now()}`;
    setPacotes((prev) => [
      ...prev,
      {
        id,
        name: "",
        description: "",
        price_reais: "0,00",
        duration_days: "7",
        is_active: true,
        display_order: prev.length + 1,
        novo: true,
      },
    ]);
  }

  async function salvar(pacote: Pacote) {
    const nome = pacote.name.trim();
    if (nome.length < 3) {
      toast.error("Dê um nome ao plano (mínimo 3 letras).");
      return;
    }
    const cents = toCents(pacote.price_reais);
    if (cents === null) {
      toast.error("Valor inválido. Use algo como 30,00.");
      return;
    }
    const dias = Number(pacote.duration_days);
    if (!Number.isInteger(dias) || dias < 1) {
      toast.error("Informe a duração em dias (número inteiro maior que zero).");
      return;
    }

    setSaving(pacote.id);
    const payload = {
      name: nome,
      description: pacote.description?.trim() || null,
      price_cents: cents,
      duration_days: dias,
      is_active: pacote.is_active,
      display_order: pacote.display_order,
      updated_by: user?.id ?? null,
    };

    const { error } = pacote.novo
      ? await supabase.from("highlight_packages").insert(payload)
      : await supabase.from("highlight_packages").update(payload).eq("id", pacote.id);
    setSaving(null);

    if (error) {
      handleError(error, "Não deu pra salvar o plano");
      return;
    }
    toast.success(`${nome} salvo. Já aparece assim para os divulgadores.`);
    void carregar();
  }

  async function remover(pacote: Pacote) {
    if (pacote.novo) {
      setPacotes((prev) => prev.filter((p) => p.id !== pacote.id));
      return;
    }
    setSaving(pacote.id);
    const { error } = await supabase.from("highlight_packages").delete().eq("id", pacote.id);
    setSaving(null);
    if (error) {
      handleError(error, "Não deu pra remover o plano");
      return;
    }
    toast.success("Plano removido.");
    void carregar();
  }

  if (permsLoading) return <LoadingState label="Verificando seu acesso…" />;
  if (!canManage) return <Navigate to="/" replace />;

  return (
    <PageContainer>
      <div className="space-y-6">
        <header className="space-y-2">
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight inline-flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-primary" />
            Planos de destaque
          </h1>
          <p className="text-sm text-muted-foreground max-w-2xl leading-relaxed">
            Defina os valores e prazos do destaque. O que você salvar aqui é exatamente o que o
            divulgador vê depois de enviar o rolê. Planos desativados não aparecem para ninguém.
          </p>
        </header>

        {loading ? (
          <LoadingState label="Carregando planos…" />
        ) : (
          <div className="space-y-4">
            {pacotes.length === 0 && (
              <p className="text-sm text-muted-foreground">
                Nenhum plano cadastrado ainda. Crie o primeiro no botão abaixo.
              </p>
            )}

            {pacotes.map((pacote) => (
              <Card key={pacote.id} className="rounded-2xl">
                <CardHeader className="flex flex-row items-center justify-between gap-3 pb-3">
                  <CardTitle className="text-base font-bold flex items-center gap-2">
                    {pacote.name || "Novo plano"}
                    {pacote.is_active ? (
                      <Badge variant="secondary">Ativo</Badge>
                    ) : (
                      <Badge variant="outline">Desativado</Badge>
                    )}
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <Label htmlFor={`ativo-${pacote.id}`} className="text-xs text-muted-foreground">
                      Mostrar
                    </Label>
                    <Switch
                      id={`ativo-${pacote.id}`}
                      checked={pacote.is_active}
                      onCheckedChange={(v) => atualizar(pacote.id, "is_active", v)}
                    />
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <Label htmlFor={`nome-${pacote.id}`}>Nome do plano</Label>
                      <Input
                        id={`nome-${pacote.id}`}
                        value={pacote.name}
                        onChange={(e) => atualizar(pacote.id, "name", e.target.value)}
                        placeholder="Ex.: Destaque Plus"
                        className="h-11"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor={`ordem-${pacote.id}`}>Ordem de exibição</Label>
                      <Input
                        id={`ordem-${pacote.id}`}
                        inputMode="numeric"
                        value={String(pacote.display_order)}
                        onChange={(e) =>
                          atualizar(pacote.id, "display_order", Number(e.target.value) || 0)
                        }
                        className="h-11"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor={`valor-${pacote.id}`}>Valor (R$)</Label>
                      <Input
                        id={`valor-${pacote.id}`}
                        inputMode="decimal"
                        value={pacote.price_reais}
                        onChange={(e) => atualizar(pacote.id, "price_reais", e.target.value)}
                        placeholder="30,00"
                        className="h-11"
                      />
                      <p className="text-[11px] text-muted-foreground">
                        Aparece como {formatPriceBRL(toCents(pacote.price_reais) ?? 0)}
                      </p>
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor={`dias-${pacote.id}`}>Duração (dias)</Label>
                      <Input
                        id={`dias-${pacote.id}`}
                        inputMode="numeric"
                        value={pacote.duration_days}
                        onChange={(e) => atualizar(pacote.id, "duration_days", e.target.value)}
                        placeholder="7"
                        className="h-11"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor={`desc-${pacote.id}`}>O que o divulgador ganha</Label>
                    <Textarea
                      id={`desc-${pacote.id}`}
                      value={pacote.description ?? ""}
                      onChange={(e) => atualizar(pacote.id, "description", e.target.value)}
                      placeholder="Seu flyer em evidência no carrossel de até 10 eventos."
                      rows={2}
                    />
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Button
                      onClick={() => void salvar(pacote)}
                      disabled={saving === pacote.id}
                      className="font-semibold"
                    >
                      {saving === pacote.id ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Save className="h-4 w-4 mr-2" />
                      )}
                      Salvar
                    </Button>
                    <Button
                      variant="ghost"
                      onClick={() => void remover(pacote)}
                      disabled={saving === pacote.id}
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
              Novo plano de destaque
            </Button>
          </div>
        )}
      </div>
    </PageContainer>
  );
}

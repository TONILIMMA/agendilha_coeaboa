import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useAppPermissions } from "@/hooks/useAppPermissions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Loader2, MessageSquare, Save, RotateCcw, Eye } from "lucide-react";
import { toast } from "sonner";
import { TEMPLATE_VARIABLES, renderTemplate } from "@/lib/whatsapp";
import { handleError } from "@/lib/error-handler";
import { LoadingState } from "@/components/ui/LoadingState";
import { PageContainer } from "@/components/ui/PageContainer";

type Kind = "approved" | "rejected";

const SAMPLE_VARS: Record<string, string> = {
  nome: "Maria",
  titulo: "Show Acústico no Píer",
  data: "20/06/2026",
  hora: "20:00",
  local: "Espaço Cultural Garagem, Centro",
  url: "https://agendilha.lovable.app/evento/show-acustico-no-pier",
  motivo: "Faltam informações de localização exata e horário de término.",
  meus_eventos_url: "https://agendilha.lovable.app/meus-eventos",
};

const MAX_LEN = 1500;

export default function AdminWhatsAppTemplates() {
  const { user } = useAuth();
  const { hasPermission, loading: permsLoading } = useAppPermissions();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<Kind | null>(null);
  const [bodies, setBodies] = useState<Record<Kind, string>>({ approved: "", rejected: "" });
  const [original, setOriginal] = useState<Record<Kind, string>>({ approved: "", rejected: "" });

  const canManage = hasPermission("events.read"); // admin or master

  useEffect(() => {
    if (!canManage) return;
    (async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("whatsapp_templates")
        .select("kind, body");
      if (error) {
        handleError(error, "Erro ao carregar templates");
      } else {
        const next = { approved: "", rejected: "" } as Record<Kind, string>;
        (data || []).forEach((row: any) => {
          if (row.kind === "approved" || row.kind === "rejected") next[row.kind as Kind] = row.body;
        });
        setBodies(next);
        setOriginal(next);
      }
      setLoading(false);
    })();
  }, [canManage]);

  async function handleSave(kind: Kind) {
    const body = bodies[kind].trim();
    if (body.length < 20) {
      toast.error("Template muito curto (mínimo 20 caracteres).");
      return;
    }
    if (body.length > MAX_LEN) {
      toast.error(`Template muito longo (máximo ${MAX_LEN} caracteres).`);
      return;
    }
    setSaving(kind);
    const { error } = await supabase
      .from("whatsapp_templates")
      .update({ body, updated_by: user?.id ?? null })
      .eq("kind", kind);
    setSaving(null);
    if (error) {
      handleError(error, "Erro ao salvar template");
    } else {
      toast.success("Template salvo com sucesso.");
      setOriginal((p) => ({ ...p, [kind]: body }));
    }
  }

  function insertVar(kind: Kind, varKey: string) {
    setBodies((p) => ({ ...p, [kind]: `${p[kind]}{{${varKey}}}` }));
  }

  if (permsLoading || loading) return <LoadingState message="Carregando templates…" />;
  if (!canManage) return <Navigate to="/" replace />;

  return (
    <div className="animate-fade-in mx-auto max-w-5xl px-4 py-8 space-y-6">
      <header className="space-y-1">
        <div className="flex items-center gap-2 text-primary">
          <MessageSquare className="h-4 w-4" />
          <span className="text-[10px] font-black uppercase tracking-[0.2em]">Backoffice</span>
        </div>
        <h1 className="text-2xl md:text-3xl font-black tracking-tight uppercase">Templates WhatsApp</h1>
        <p className="text-muted-foreground text-xs sm:text-sm">
          Mensagens enviadas automaticamente ao divulgador quando o evento é aprovado ou rejeitado.
        </p>
      </header>

      <Card className="border-border bg-muted/20">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-bold uppercase tracking-wider">Variáveis disponíveis</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          {TEMPLATE_VARIABLES.map((v) => (
            <Badge key={v.key} variant="outline" className="font-mono text-[11px]" title={v.desc}>
              {`{{${v.key}}}`}
            </Badge>
          ))}
        </CardContent>
      </Card>

      {(["approved", "rejected"] as Kind[]).map((kind) => {
        const body = bodies[kind];
        const dirty = body !== original[kind];
        const preview = renderTemplate(body, SAMPLE_VARS);
        return (
          <Card key={kind} className="border-border">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="text-base font-black">
                  {kind === "approved" ? "✅ Aprovação" : "❌ Rejeição"}
                </span>
                <span className={`text-[10px] font-bold ${body.length > MAX_LEN ? "text-rose-600" : "text-muted-foreground"}`}>
                  {body.length} / {MAX_LEN}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase tracking-wide">Template</Label>
                <Textarea
                  value={body}
                  onChange={(e) => setBodies((p) => ({ ...p, [kind]: e.target.value.slice(0, MAX_LEN + 50) }))}
                  rows={10}
                  className="font-mono text-sm leading-relaxed"
                />
                <div className="flex flex-wrap gap-1">
                  {TEMPLATE_VARIABLES.map((v) => (
                    <Button
                      key={v.key}
                      type="button"
                      size="sm"
                      variant="outline"
                      className="h-7 text-[10px] font-mono"
                      onClick={() => insertVar(kind, v.key)}
                    >
                      + {`{{${v.key}}}`}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase tracking-wide flex items-center gap-2">
                  <Eye className="h-3.5 w-3.5" /> Pré-visualização (com dados de exemplo)
                </Label>
                <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-4 text-sm whitespace-pre-wrap leading-relaxed">
                  {preview || <span className="text-muted-foreground italic">— vazio —</span>}
                </div>
              </div>

              <div className="flex flex-wrap gap-2 justify-end">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={!dirty}
                  onClick={() => setBodies((p) => ({ ...p, [kind]: original[kind] }))}
                >
                  <RotateCcw className="h-4 w-4 mr-2" /> Desfazer
                </Button>
                <Button
                  size="sm"
                  disabled={!dirty || saving === kind}
                  onClick={() => handleSave(kind)}
                  className="bg-emerald-600 hover:bg-emerald-700"
                >
                  {saving === kind ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                  Salvar template
                </Button>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { PageContainer } from "@/components/ui/PageContainer";
import { LoadingState } from "@/components/ui/LoadingState";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { toast } from "sonner";
import { User, Save } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useAppPermissions } from "@/hooks/useAppPermissions";
import { usePromotorProfile, upsertPromotorProfile } from "@/data/usePromotorProfile";
import { formatPhoneDisplay, validateBrazilianMobile } from "@/lib/whatsapp";

const TIPOS = [
  { v: "artista", l: "Artista / Músico" },
  { v: "produtor", l: "Produtor / Organizador" },
  { v: "estabelecimento", l: "Local / Estabelecimento" },
  { v: "outro", l: "Outro" },
];

/**
 * Página do perfil de Promotor/Divulgador.
 * - `/promotor/perfil` edita o próprio perfil.
 * - `?user=<uuid>` (apenas admin/master) edita o perfil de outro usuário para curadoria.
 */
export default function PromotorPerfil() {
  const { user } = useAuth();
  const { isAdmin, isMaster } = useAppPermissions();
  const [params] = useSearchParams();
  const targetUserId = params.get("user") || user?.id || undefined;
  const isEditingOther = !!params.get("user") && params.get("user") !== user?.id;
  const canEdit = !isEditingOther || isAdmin || isMaster;

  const { profile, loading, refetch } = usePromotorProfile(targetUserId);
  const [nome, setNome] = useState("");
  const [whats, setWhats] = useState("");
  const [tipo, setTipo] = useState<string>("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!loading) {
      setNome(profile?.promotor_nome ?? "");
      setWhats(profile?.promotor_whatsapp ?? "");
      setTipo(profile?.tipo_promotor ?? "");
    }
  }, [loading, profile]);

  const onSave = async () => {
    if (!targetUserId) return;
    if (!nome.trim()) {
      toast.error("Informe o nome do divulgador.");
      return;
    }
    if (whats.trim()) {
      const v = validateBrazilianMobile(whats);
      if (!v.valid) {
        toast.error((v as any).reason || "WhatsApp inválido.");
        return;
      }
    }
    setSaving(true);
    const { error } = await upsertPromotorProfile({
      user_id: targetUserId,
      promotor_nome: nome,
      promotor_whatsapp: whats,
      tipo_promotor: tipo || null,
    });
    setSaving(false);
    if (error) {
      toast.error("Não deu pra salvar seu perfil. Tenta de novo.");
      return;
    }
    toast.success("Perfil de divulgador atualizado.");
    refetch();
  };

  if (loading) return <LoadingState />;

  return (
    <PageContainer>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5 text-primary" />
            Meu perfil de Divulgador
          </CardTitle>
          <CardDescription>
            Esses dados vão pré-preencher os campos de divulgador nos próximos eventos que você divulgar.
            {isEditingOther && (isAdmin || isMaster) && (
              <span className="block mt-1 text-amber-600">Editando perfil de outro usuário (curadoria).</span>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="promotor-nome">Nome do divulgador *</Label>
            <Input
              id="promotor-nome"
              value={nome}
              disabled={!canEdit}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Como quer aparecer na divulgação?"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="promotor-whats">WhatsApp do divulgador</Label>
            <Input
              id="promotor-whats"
              inputMode="tel"
              value={whats}
              disabled={!canEdit}
              onChange={(e) => setWhats(formatPhoneDisplay(e.target.value))}
              placeholder="(21) 9XXXX-XXXX"
            />
            <p className="text-xs text-muted-foreground">
              Deixe em branco pra usar o WhatsApp do seu cadastro base a cada evento.
            </p>
          </div>
          <div className="space-y-2">
            <Label>Tipo de divulgador</Label>
            <RadioGroup value={tipo} onValueChange={setTipo} className="grid gap-2 sm:grid-cols-2">
              {TIPOS.map((opt) => (
                <label
                  key={opt.v}
                  className="flex items-center gap-2 rounded-md border p-2 cursor-pointer hover:bg-muted/40 text-sm"
                >
                  <RadioGroupItem value={opt.v} disabled={!canEdit} />
                  <span>{opt.l}</span>
                </label>
              ))}
            </RadioGroup>
          </div>
          <div className="pt-2">
            <Button onClick={onSave} disabled={!canEdit || saving}>
              <Save className="h-4 w-4 mr-1.5" />
              {saving ? "Salvando..." : "Salvar perfil"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </PageContainer>
  );
}
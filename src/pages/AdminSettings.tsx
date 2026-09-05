import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { useAppPermissions } from "@/hooks/useAppPermissions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Loader2, MessageCircle, RotateCcw, Save, Settings2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { LoadingState } from "@/components/ui/LoadingState";
import { PageContainer } from "@/components/ui/PageContainer";
import { handleError } from "@/lib/error-handler";
import {
  DEFAULT_SETTINGS,
  SETTING_KEYS,
  useAppSettings,
  useSaveAppSettings,
} from "@/data/useAppSettings";
import { formatWhatsappInput, isValidWhatsapp, buildWhatsappUrl } from "@/lib/whatsapp";

const KEYS = [
  SETTING_KEYS.teamWhatsapp,
  SETTING_KEYS.destaqueEventoTitulo,
  SETTING_KEYS.destaqueEventoTexto,
  SETTING_KEYS.destaqueAnuncioTitulo,
  SETTING_KEYS.destaqueAnuncioTexto,
  SETTING_KEYS.destaqueCta,
] as const;

type Form = Record<string, string>;

export default function AdminSettings() {
  const { hasPermission, loading: permsLoading } = useAppPermissions();
  const { data: settings, isLoading } = useAppSettings();
  const save = useSaveAppSettings();
  const [form, setForm] = useState<Form>({ ...DEFAULT_SETTINGS });

  const canManage = hasPermission("events.read");

  useEffect(() => {
    if (settings) {
      const next: Form = {};
      KEYS.forEach((k) => (next[k] = settings[k] ?? DEFAULT_SETTINGS[k]));
      setForm(next);
    }
  }, [settings]);

  const dirty = KEYS.some((k) => (form[k] ?? "") !== (settings?.[k] ?? DEFAULT_SETTINGS[k]));

  const whatsapp = form[SETTING_KEYS.teamWhatsapp] ?? "";
  const whatsappOk = whatsapp.trim() === "" || isValidWhatsapp(whatsapp);
  const previewUrl = whatsappOk && whatsapp.trim()
    ? buildWhatsappUrl(whatsapp, "Oi! Quero contratar um destaque.")
    : null;

  function set(key: string, value: string) {
    setForm((p) => ({ ...p, [key]: value }));
  }

  async function salvar() {
    if (!whatsappOk) {
      toast.error("Confere o WhatsApp da equipe: precisa ter DDD e número completo.");
      return;
    }
    const vazio = KEYS.filter(
      (k) => k !== SETTING_KEYS.teamWhatsapp && !(form[k] ?? "").trim(),
    );
    if (vazio.length > 0) {
      toast.error("Os textos do destaque não podem ficar vazios.");
      return;
    }
    try {
      const payload: Form = {};
      KEYS.forEach((k) => (payload[k] = (form[k] ?? "").trim()));
      await save.mutateAsync(payload);
      toast.success("Configurações salvas.");
    } catch (e) {
      handleError(e, "Não deu pra salvar as configurações");
    }
  }

  if (permsLoading || isLoading) return <LoadingState message="Carregando configurações…" />;
  if (!canManage) return <Navigate to="/" replace />;

  return (
    <PageContainer maxWidth="4xl">
      <header className="space-y-1">
        <div className="flex items-center gap-2 text-primary">
          <Settings2 className="h-4 w-4" />
          <span className="text-[10px] font-black uppercase tracking-[0.2em]">Backoffice</span>
        </div>
        <h1 className="text-2xl md:text-3xl font-black tracking-tight uppercase">Configurações</h1>
        <p className="text-muted-foreground text-xs sm:text-sm">
          Número oficial da equipe e os textos do convite de destaque, sem precisar mexer no código.
        </p>
      </header>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base font-black">
            <MessageCircle className="h-4 w-4 text-emerald-600" />
            WhatsApp oficial da equipe
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-2">
            <Label htmlFor="team-whatsapp" className="text-xs font-bold uppercase tracking-wide">
              Número que recebe as contratações de destaque
            </Label>
            <Input
              id="team-whatsapp"
              inputMode="numeric"
              placeholder="(21) 99999-9999"
              value={whatsapp}
              onChange={(e) => set(SETTING_KEYS.teamWhatsapp, formatWhatsappInput(e.target.value))}
              aria-invalid={!whatsappOk}
              className={!whatsappOk ? "border-destructive" : ""}
            />
            {!whatsappOk ? (
              <p className="text-xs text-destructive font-medium">
                Número incompleto. Use DDD + número, ex.: (21) 99999-9999.
              </p>
            ) : (
              <p className="text-xs text-muted-foreground">
                Todo botão de destaque abre uma conversa com esse número. Deixe vazio para a pessoa
                escolher o contato.
              </p>
            )}
            {previewUrl && (
              <a
                href={previewUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-semibold text-emerald-700 underline break-all"
              >
                Testar conversa
              </a>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base font-black">
            <Sparkles className="h-4 w-4 text-primary" />
            Convite de destaque
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="space-y-2">
            <Label className="text-xs font-bold uppercase tracking-wide">Título (rolês)</Label>
            <Input
              value={form[SETTING_KEYS.destaqueEventoTitulo] ?? ""}
              maxLength={120}
              onChange={(e) => set(SETTING_KEYS.destaqueEventoTitulo, e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label className="text-xs font-bold uppercase tracking-wide">Texto (rolês)</Label>
            <Textarea
              rows={3}
              maxLength={600}
              value={form[SETTING_KEYS.destaqueEventoTexto] ?? ""}
              onChange={(e) => set(SETTING_KEYS.destaqueEventoTexto, e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label className="text-xs font-bold uppercase tracking-wide">Título (anúncios)</Label>
            <Input
              value={form[SETTING_KEYS.destaqueAnuncioTitulo] ?? ""}
              maxLength={120}
              onChange={(e) => set(SETTING_KEYS.destaqueAnuncioTitulo, e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label className="text-xs font-bold uppercase tracking-wide">Texto (anúncios)</Label>
            <Textarea
              rows={3}
              maxLength={600}
              value={form[SETTING_KEYS.destaqueAnuncioTexto] ?? ""}
              onChange={(e) => set(SETTING_KEYS.destaqueAnuncioTexto, e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label className="text-xs font-bold uppercase tracking-wide">Botão de contratação</Label>
            <Input
              value={form[SETTING_KEYS.destaqueCta] ?? ""}
              maxLength={40}
              onChange={(e) => set(SETTING_KEYS.destaqueCta, e.target.value)}
            />
          </div>

          <div className="rounded-2xl border bg-muted/30 p-4 space-y-2">
            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
              Pré-visualização
            </p>
            <p className="font-black text-base">{form[SETTING_KEYS.destaqueEventoTitulo]}</p>
            <p className="text-sm text-muted-foreground whitespace-pre-line">
              {form[SETTING_KEYS.destaqueEventoTexto]}
            </p>
            <div className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-xs font-bold text-primary-foreground">
              <Sparkles className="h-3.5 w-3.5" />
              {form[SETTING_KEYS.destaqueCta]}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-wrap justify-end gap-2">
        <Button
          variant="outline"
          disabled={!dirty}
          onClick={() => {
            const next: Form = {};
            KEYS.forEach((k) => (next[k] = settings?.[k] ?? DEFAULT_SETTINGS[k]));
            setForm(next);
          }}
        >
          <RotateCcw className="h-4 w-4 mr-2" /> Desfazer
        </Button>
        <Button onClick={salvar} disabled={!dirty || save.isPending} className="font-bold">
          {save.isPending ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Save className="h-4 w-4 mr-2" />
          )}
          Salvar configurações
        </Button>
      </div>
    </PageContainer>
  );
}

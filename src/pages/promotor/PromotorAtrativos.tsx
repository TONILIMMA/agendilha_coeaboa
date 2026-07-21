import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Plus, Sparkles, Pencil, Trash2, Loader2, FileDown, FileStack, Eye } from "lucide-react";
import { exportAtrativoToPdf, exportAtrativosConsolidatedPdf } from "@/lib/exportEventPdf";
import { PrintPreviewDialog, PrintPreviewSheet } from "@/components/pdf/PrintPreviewDialog";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { handleError } from "@/lib/error-handler";
import { PromotorBadge } from "@/components/promotor/PromotorBadge";
import { PhotoGallery } from "@/components/media/PhotoGallery";
import { AtrativoAutocomplete } from "@/components/atrativos/AtrativoAutocomplete";
import {
  EstabelecimentoAutocomplete,
  EstabelecimentoSuggestion,
} from "@/components/estabelecimentos/EstabelecimentoAutocomplete";
import { ROUTES } from "@/routes/config";

interface Atrativo {
  id: string;
  name: string;
  type: string | null;
  description: string | null;
  estabelecimento_id: string | null;
  tipo_atrativo?: string | null;
  estilos?: string[] | null;
  pais?: string | null;
  estado?: string | null;
  cidade_regiao?: string | null;
  membros_equipe?: string | null;
  responsavel_nome?: string | null;
  responsavel_telefone?: string | null;
  responsavel_email?: string | null;
  responsavel_redes?: string | null;
  fotos?: string[] | null;
  logo_url?: string | null;
  is_approved?: boolean;
}

const TIPOS_ATRATIVO = ["Música", "Artes cênicas", "Turismo", "Outros"];
const ESTILOS_POR_TIPO: Record<string, string[]> = {
  "Música": ["Samba", "Pagode", "Rock", "Pop", "MPB", "Funk", "Sertanejo", "Eletrônico", "Gospel", "Jazz"],
  "Artes cênicas": ["Teatro", "Dança", "Stand-up", "Performance", "Circo"],
  "Turismo": ["Passeio guiado", "Trilha", "Náutico", "Gastronômico", "Cultural"],
  "Outros": ["Feira", "Workshop", "Palestra", "Exposição"],
};

const empty = {
  name: "",
  type: "",
  description: "",
  estabelecimento_id: null as string | null,
  estabelecimento_nome: "",
  tipo_atrativo: "",
  estilos: [] as string[],
  pais: "Brasil",
  estado: "RJ",
  cidade_regiao: "",
  membros_equipe: "",
  responsavel_nome: "",
  responsavel_telefone: "",
  responsavel_email: "",
  responsavel_redes: "",
  fotos: [] as string[],
};

export default function PromotorAtrativos() {
  const { user } = useAuth();
  const [items, setItems] = useState<Atrativo[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<string | null>(null);
  const [form, setForm] = useState({ ...empty });
  const [saving, setSaving] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewMode, setPreviewMode] = useState<"single" | "consolidated">("consolidated");
  const [previewSingleId, setPreviewSingleId] = useState<string | null>(null);

  const toggleSelected = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const atrativoToSheet = (a: Atrativo, idx: number, total: number): PrintPreviewSheet => ({
    title: a.name,
    subtitle: total > 1 ? `Ficha ${idx + 1} de ${total} — Atrativos AgendIlha` : "Ficha do atrativo",
    description: a.description,
    rows: [
      { label: "Tipo", value: a.tipo_atrativo || a.type || "—" },
      { label: "Estilos", value: (a.estilos || []).join(", ") || "—" },
      { label: "WhatsApp", value: a.responsavel_telefone || "—" },
      { label: "E-mail", value: a.responsavel_email || "—" },
    ],
  });

  const selectedItems = useMemo(
    () => items.filter((a) => selected.has(a.id)),
    [items, selected],
  );

  const previewSheets: PrintPreviewSheet[] = useMemo(() => {
    if (previewMode === "single") {
      const one = items.find((a) => a.id === previewSingleId);
      return one ? [atrativoToSheet(one, 0, 1)] : [];
    }
    return selectedItems.map((a, i) => atrativoToSheet(a, i, selectedItems.length));
  }, [previewMode, previewSingleId, selectedItems, items]);

  const handleDownloadPreview = () => {
    if (previewMode === "single") {
      const one = items.find((a) => a.id === previewSingleId);
      if (!one) return;
      exportAtrativoToPdf({
        name: one.name,
        tipo_atrativo: one.tipo_atrativo,
        estilos: one.estilos,
        description: one.description,
        contact_whatsapp: one.responsavel_telefone,
        email: one.responsavel_email,
      });
    } else {
      exportAtrativosConsolidatedPdf(
        selectedItems.map((a) => ({
          name: a.name,
          tipo_atrativo: a.tipo_atrativo,
          estilos: a.estilos,
          description: a.description,
          contact_whatsapp: a.responsavel_telefone,
          email: a.responsavel_email,
        })),
      );
    }
    setPreviewOpen(false);
  };

  const load = async () => {
    if (!user) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("atrativos")
      .select("id, name, type, description, estabelecimento_id, tipo_atrativo, estilos, pais, estado, cidade_regiao, membros_equipe, responsavel_nome, responsavel_telefone, responsavel_email, responsavel_redes, fotos, is_approved")
      .eq("responsavel_id", user.id)
      .order("name");
    if (error) handleError(error, "Erro ao carregar atrativos");
    else setItems((data ?? []) as Atrativo[]);
    setLoading(false);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const reset = () => {
    setEditing(null);
    setForm({ ...empty });
  };

  const startEdit = async (a: Atrativo) => {
    let nome = "";
    if (a.estabelecimento_id) {
      const { data } = await supabase
        .from("estabelecimentos")
        .select("nome")
        .eq("id", a.estabelecimento_id)
        .maybeSingle();
      nome = data?.nome ?? "";
    }
    setEditing(a.id);
    setForm({
      name: a.name,
      type: a.type ?? "",
      description: a.description ?? "",
      estabelecimento_id: a.estabelecimento_id,
      estabelecimento_nome: nome,
      tipo_atrativo: a.tipo_atrativo ?? "",
      estilos: a.estilos ?? [],
      pais: a.pais ?? "Brasil",
      estado: a.estado ?? "RJ",
      cidade_regiao: a.cidade_regiao ?? "",
      membros_equipe: a.membros_equipe ?? "",
      responsavel_nome: a.responsavel_nome ?? "",
      responsavel_telefone: a.responsavel_telefone ?? "",
      responsavel_email: a.responsavel_email ?? "",
      responsavel_redes: a.responsavel_redes ?? "",
      fotos: a.fotos ?? [],
    });
  };

  const handleSelectEstab = (e: EstabelecimentoSuggestion) => {
    setForm((f) => ({
      ...f,
      estabelecimento_id: e.id,
      estabelecimento_nome: e.nome,
    }));
  };

  const handleSelectAtrativo = (a: { name: string; type: string | null; estabelecimento_id: string | null }) => {
    // Apenas pré-preenche o formulário; o usuário ainda salva como NOVO atrativo dele.
    setForm((f) => ({
      ...f,
      name: a.name,
      type: a.type ?? f.type,
      estabelecimento_id: a.estabelecimento_id ?? f.estabelecimento_id,
    }));
  };

  const save = async () => {
    if (!user) return;
    if (!form.name.trim()) {
      toast.error("Informe o título do atrativo.");
      return;
    }
    setSaving(true);
    try {
      // Inline-create estabelecimento se o usuário digitou um nome sem selecionar existente
      let estabId = form.estabelecimento_id;
      const nomeEstab = form.estabelecimento_nome.trim();
      if (!estabId && nomeEstab) {
        const { data: novo, error: eErr } = await supabase
          .from("estabelecimentos")
          .insert({ nome: nomeEstab, responsavel_id: user.id })
          .select("id")
          .single();
        if (eErr) throw eErr;
        estabId = novo.id;
        toast.success(`Estabelecimento "${nomeEstab}" criado.`);
      }

      const payload = {
        name: form.name.trim(),
        type: form.type || null,
        description: form.description || null,
        estabelecimento_id: estabId,
        tipo_atrativo: form.tipo_atrativo || null,
        estilos: form.estilos.length ? form.estilos : null,
        pais: form.pais || null,
        estado: form.estado || null,
        cidade_regiao: form.cidade_regiao || null,
        membros_equipe: form.membros_equipe || null,
        responsavel_nome: form.responsavel_nome || null,
        responsavel_telefone: form.responsavel_telefone || null,
        responsavel_email: form.responsavel_email || null,
        responsavel_redes: form.responsavel_redes || null,
        fotos: form.fotos,
      };
      if (editing) {
        const { error } = await supabase.from("atrativos").update(payload).eq("id", editing);
        if (error) throw error;
        toast.success("Atrativo atualizado.");
      } else {
        const { error } = await supabase.from("atrativos").insert({
          ...payload,
          responsavel_id: user.id,
          created_by: user.id,
        });
        if (error) throw error;
        toast.success("Atrativo cadastrado.");
      }
      reset();
      load();
    } catch (err) {
      handleError(err, "Não foi possível salvar");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id: string) => {
    if (!confirm("Remover este atrativo?")) return;
    const { error } = await supabase.from("atrativos").delete().eq("id", id);
    if (error) handleError(error, "Erro ao remover");
    else {
      toast.success("Removido.");
      load();
    }
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto pb-12">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <PromotorBadge />
          <h1 className="text-2xl sm:text-3xl font-black font-display mt-2">
            Meus atrativos
          </h1>
          <p className="text-sm text-muted-foreground">
            Cadastre as atrações sob sua responsabilidade.
          </p>
        </div>
        <Link to={ROUTES.PROMOTOR_ESTABELECIMENTOS}>
          <Button variant="outline">Ir para Estabelecimentos</Button>
        </Link>
      </div>

      <Card className="p-5 space-y-4">
        <h2 className="font-bold text-lg">
          {editing ? "Editar atrativo" : "Novo atrativo"}
        </h2>

        <div className="space-y-1.5">
          <Label className="text-sm font-semibold">Título*</Label>
          <AtrativoAutocomplete
            value={form.name}
            onChange={(v) => setForm({ ...form, name: v })}
            onSelect={handleSelectAtrativo}
            placeholder="Ex: Sunset no Galeão"
          />
          <p className="text-xs text-muted-foreground">
            Sugestões aparecem ao digitar. Selecionar pré-preenche os campos.
          </p>
        </div>

        <div className="space-y-1.5">
          <Label className="text-sm font-semibold">Tipo</Label>
          <Input
            value={form.type}
            onChange={(e) => setForm({ ...form, type: e.target.value })}
            placeholder="Show, festival, feira…"
          />
        </div>

        {/* Bloco: Tipo de atrativo + estilos condicionais */}
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label className="text-sm font-semibold">Categoria do atrativo</Label>
            <Select
              value={form.tipo_atrativo}
              onValueChange={(v) => setForm({ ...form, tipo_atrativo: v, estilos: [] })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Ex: Música, Artes cênicas…" />
              </SelectTrigger>
              <SelectContent>
                {TIPOS_ATRATIVO.map((t) => (
                  <SelectItem key={t} value={t}>{t}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {form.tipo_atrativo && ESTILOS_POR_TIPO[form.tipo_atrativo] && (
            <div className="space-y-2">
              <Label className="text-sm font-semibold">Estilos</Label>
              <p className="text-xs text-muted-foreground">Marque quantos combinarem.</p>
              <div className="flex flex-wrap gap-2">
                {ESTILOS_POR_TIPO[form.tipo_atrativo].map((s) => {
                  const on = form.estilos.includes(s);
                  return (
                    <Badge
                      key={s}
                      variant="outline"
                      className={cn(
                        "cursor-pointer px-3 py-1 rounded-full transition-all",
                        on ? "bg-primary text-primary-foreground border-primary" : "hover:bg-primary/10"
                      )}
                      onClick={() =>
                        setForm((f) => ({
                          ...f,
                          estilos: on ? f.estilos.filter((x) => x !== s) : [...f.estilos, s],
                        }))
                      }
                    >
                      {s}
                    </Badge>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        <div className="space-y-1.5">
          <Label className="text-sm font-semibold">Estabelecimento</Label>
          <EstabelecimentoAutocomplete
            value={form.estabelecimento_nome}
            onChange={(v) =>
              setForm({ ...form, estabelecimento_nome: v, estabelecimento_id: null })
            }
            onSelect={handleSelectEstab}
            placeholder="Vincule a um estabelecimento"
          />
        </div>

        <div className="space-y-1.5">
          <Label className="text-sm font-semibold">Descrição</Label>
          <Textarea
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            rows={3}
          />
        </div>

        {/* Bloco: Local / Origem */}
        <div className="space-y-3">
          <p className="text-xs uppercase font-bold text-muted-foreground tracking-wider">Local / Origem</p>
          <div className="grid sm:grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <Label className="text-sm font-semibold">País</Label>
              <Input value={form.pais} onChange={(e) => setForm({ ...form, pais: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-semibold">Estado</Label>
              <Input value={form.estado} onChange={(e) => setForm({ ...form, estado: e.target.value })} placeholder="RJ" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-semibold">Cidade / Região</Label>
              <Input value={form.cidade_regiao} onChange={(e) => setForm({ ...form, cidade_regiao: e.target.value })} placeholder="Ilha do Governador" />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-sm font-semibold">Integrantes / Equipe</Label>
            <Textarea
              value={form.membros_equipe}
              onChange={(e) => setForm({ ...form, membros_equipe: e.target.value })}
              rows={2}
              placeholder="Ex: João (voz), Ana (guitarra)…"
            />
          </div>
        </div>

        {/* Bloco: Responsável pelos contatos */}
        <div className="space-y-3">
          <p className="text-xs uppercase font-bold text-muted-foreground tracking-wider">Responsável pelos contatos</p>
          <div className="grid sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-sm font-semibold">Nome</Label>
              <Input value={form.responsavel_nome} onChange={(e) => setForm({ ...form, responsavel_nome: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-semibold">Telefone / WhatsApp</Label>
              <Input value={form.responsavel_telefone} onChange={(e) => setForm({ ...form, responsavel_telefone: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-semibold">E-mail</Label>
              <Input value={form.responsavel_email} onChange={(e) => setForm({ ...form, responsavel_email: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-semibold">Redes sociais</Label>
              <Input value={form.responsavel_redes} onChange={(e) => setForm({ ...form, responsavel_redes: e.target.value })} placeholder="@instagram, Facebook…" />
            </div>
          </div>
        </div>

        {user && (
          <div className="space-y-3">
            <p className="text-xs uppercase font-bold text-muted-foreground tracking-wider">Mídia</p>
            <PhotoGallery
              urls={form.fotos}
              onChange={(next) => setForm({ ...form, fotos: next })}
              kind="atrativos"
              ownerUserId={user.id}
              targetId={editing}
              label="Fotos, logo e portfólio"
              helper="Até 8 imagens. Aparecem na ficha do atrativo e nos eventos ligados a ele."
            />
          </div>
        )}

        <div className="flex gap-2">
          <Button onClick={save} disabled={saving}>
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : editing ? (
              "Salvar alterações"
            ) : (
              <>
                <Plus className="h-4 w-4 mr-1" /> Cadastrar
              </>
            )}
          </Button>
          {editing && (
            <Button variant="ghost" onClick={reset}>
              Cancelar
            </Button>
          )}
        </div>
      </Card>

      <div className="space-y-3">
        {items.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 justify-between p-3 rounded-lg bg-muted/40 border">
            <div className="text-xs text-muted-foreground">
              {selected.size > 0
                ? `${selected.size} atrativo${selected.size > 1 ? "s" : ""} selecionado${selected.size > 1 ? "s" : ""}`
                : "Selecione atrativos pra gerar um PDF consolidado."}
            </div>
            <div className="flex gap-2">
              {selected.size > 0 && (
                <Button size="sm" variant="ghost" onClick={() => setSelected(new Set())}>
                  Limpar seleção
                </Button>
              )}
              <Button
                size="sm"
                disabled={selected.size === 0}
                onClick={() => {
                  setPreviewMode("consolidated");
                  setPreviewOpen(true);
                }}
                className="gap-1"
              >
                <FileStack className="h-4 w-4" />
                PDF consolidado ({selected.size})
              </Button>
            </div>
          </div>
        )}
        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : items.length === 0 ? (
          <Card className="p-8 text-center text-muted-foreground text-sm">
            Você ainda não cadastrou nenhum atrativo.
          </Card>
        ) : (
          items.map((a) => (
            <Card key={a.id} className="p-4 flex items-start gap-3">
              <Checkbox
                checked={selected.has(a.id)}
                onCheckedChange={() => toggleSelected(a.id)}
                aria-label={`Selecionar ${a.name}`}
                className="mt-1"
              />
              <div className="h-10 w-10 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center shrink-0">
                <Sparkles className="h-5 w-5" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-bold truncate">{a.name}</h3>
                <p className="text-xs text-muted-foreground truncate">
                  {[a.type, a.description].filter(Boolean).join(" · ") || "Sem detalhes"}
                </p>
                <div className="mt-1">
                  {a.is_approved ? (
                    <Badge variant="outline" className="text-[10px] border-emerald-500 text-emerald-700">Aprovado</Badge>
                  ) : (
                    <Badge variant="outline" className="text-[10px] border-amber-500 text-amber-700">Aguardando aprovação</Badge>
                  )}
                </div>
              </div>
              <div className="flex gap-1">
                <Button size="icon" variant="ghost" onClick={() => startEdit(a)} aria-label="Editar">
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => {
                    setPreviewMode("single");
                    setPreviewSingleId(a.id);
                    setPreviewOpen(true);
                  }}
                  aria-label="Ver e baixar PDF"
                  title="Ver prévia pra impressão"
                >
                  <FileDown className="h-4 w-4" />
                </Button>
                <Button size="icon" variant="ghost" onClick={() => remove(a.id)} aria-label="Remover">
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            </Card>
          ))
        )}
      </div>

      <PrintPreviewDialog
        open={previewOpen}
        onOpenChange={setPreviewOpen}
        title={previewMode === "single" ? "Ficha do atrativo — pronta pra imprimir" : "PDF consolidado dos atrativos"}
        helper={
          previewMode === "single"
            ? "Assim vai sair o PDF. Confira antes de baixar."
            : `Um PDF único com ${previewSheets.length} ficha${previewSheets.length > 1 ? "s" : ""} — uma por página.`
        }
        sheets={previewSheets}
        downloadLabel={previewMode === "single" ? "Baixar PDF" : `Baixar PDF consolidado (${previewSheets.length})`}
        onDownload={handleDownloadPreview}
      />
    </div>
  );
}
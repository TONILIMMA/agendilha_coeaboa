import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Plus, MapPin, Pencil, Trash2, Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { handleError } from "@/lib/error-handler";
import { PromotorBadge } from "@/components/promotor/PromotorBadge";
import { useProfile } from "@/hooks/useProfile";
import { PhotoGallery } from "@/components/media/PhotoGallery";
import { ROUTES } from "@/routes/config";
import {
  useMyEstabelecimentos,
  useUpsertEstabelecimento,
  useDeleteEstabelecimento,
  type EstabelecimentoRow,
} from "@/data/useEstabelecimentos";

type Estab = EstabelecimentoRow;

const TIPOS_ESTAB = [
  "Bar", "Restaurante", "Casa de show", "Quiosque",
  "Centro cultural", "Igreja", "Praça", "Clube", "Outro",
];

const empty = {
  nome: "",
  endereco: "",
  bairro: "",
  tipo: "",
  contato: "",
  tipos: [] as string[],
  anotacoes: "",
  temCnpj: false,
  cnpj: "",
  responsavel_nome: "",
  responsavel_telefone: "",
  responsavel_email: "",
  responsavel_redes: "",
  fotos: [] as string[],
};

export default function PromotorEstabelecimentos() {
  const { user } = useAuth();
  const { profile } = useProfile();
  const { data: items = [], isLoading: loading } = useMyEstabelecimentos(user?.id);
  const upsert = useUpsertEstabelecimento();
  const remove_ = useDeleteEstabelecimento();
  const [editing, setEditing] = useState<string | null>(null);
  const [form, setForm] = useState({ ...empty });
  const saving = upsert.isPending;

  const reset = () => {
    setEditing(null);
    setForm({
      ...empty,
      responsavel_nome: profile?.responsible_name || "",
      responsavel_telefone: profile?.phone || "",
      responsavel_email: profile?.email || "",
    });
  };

  const startEdit = (e: Estab) => {
    setEditing(e.id);
    setForm({
      nome: e.nome ?? "",
      endereco: e.endereco ?? "",
      bairro: e.bairro ?? "",
      tipo: e.tipo ?? "",
      contato: e.contato ?? "",
      tipos: e.tipos ?? [],
      anotacoes: e.anotacoes ?? "",
      temCnpj: !!e.cnpj,
      cnpj: e.cnpj ?? "",
      responsavel_nome: e.responsavel_nome ?? "",
      responsavel_telefone: e.responsavel_telefone ?? "",
      responsavel_email: e.responsavel_email ?? "",
      responsavel_redes: e.responsavel_redes ?? "",
      fotos: e.fotos ?? [],
    });
  };

  const save = async () => {
    if (!user) return;
    if (!form.nome.trim()) {
      toast.error("Informe o nome do estabelecimento.");
      return;
    }
    try {
      const commonPatch = {
        tipos: form.tipos.length ? form.tipos : null,
        anotacoes: form.anotacoes || null,
        cnpj: form.temCnpj && form.cnpj ? form.cnpj : null,
        responsavel_nome: form.responsavel_nome || null,
        responsavel_telefone: form.responsavel_telefone || null,
        responsavel_email: form.responsavel_email || null,
        responsavel_redes: form.responsavel_redes || null,
        fotos: form.fotos,
      };
      if (editing) {
        await upsert.mutateAsync({
          id: editing,
          payload: {
            nome: form.nome.trim(),
            endereco: form.endereco || null,
            bairro: form.bairro || null,
            tipo: form.tipo || null,
            contato: form.contato || null,
            ...commonPatch,
          },
        });
        toast.success("Estabelecimento atualizado.");
      } else {
        await upsert.mutateAsync({
          payload: {
            nome: form.nome.trim(),
            endereco: form.endereco || null,
            bairro: form.bairro || null,
            tipo: form.tipo || null,
            contato: form.contato || null,
            responsavel_id: user.id,
            created_by: user.id,
            ...commonPatch,
          },
        });
        toast.success("Estabelecimento cadastrado.");
      }
      reset();
    } catch (err) {
      handleError(err, "Não foi possível salvar");
    }
  };

  const remove = async (id: string) => {
    if (!confirm("Remover este estabelecimento?")) return;
    try {
      await remove_.mutateAsync(id);
      toast.success("Removido.");
    } catch (err) {
      handleError(err, "Erro ao remover");
    }
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto pb-12">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <PromotorBadge />
          <h1 className="text-2xl sm:text-3xl font-black font-display mt-2">
            Meus estabelecimentos
          </h1>
          <p className="text-sm text-muted-foreground">
            Somente você pode editar os estabelecimentos cadastrados aqui.
          </p>
        </div>
        <Link to={ROUTES.PROMOTOR_ATRATIVOS}>
          <Button variant="outline">Ir para Atrativos</Button>
        </Link>
      </div>

      <Card className="p-5 space-y-4">
        <h2 className="font-bold text-lg">
          {editing ? "Editar estabelecimento" : "Novo estabelecimento"}
        </h2>

        {/* Bloco: Básico */}
        <div className="space-y-3">
          <p className="text-xs uppercase font-bold text-muted-foreground tracking-wider">Informações básicas</p>
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Nome*" value={form.nome} onChange={(v) => setForm({ ...form, nome: v })} />
            <Field label="Endereço" value={form.endereco} onChange={(v) => setForm({ ...form, endereco: v })} />
            <Field label="Bairro" value={form.bairro} onChange={(v) => setForm({ ...form, bairro: v })} />
            <Field label="Contato geral" value={form.contato} onChange={(v) => setForm({ ...form, contato: v })} placeholder="WhatsApp ou e-mail" />
          </div>
        </div>

        {/* Bloco: Tipos (multi) */}
        <div className="space-y-2">
          <Label className="text-sm font-semibold">Tipo de estabelecimento</Label>
          <p className="text-xs text-muted-foreground">Toque em quantos combinarem.</p>
          <div className="flex flex-wrap gap-2">
            {TIPOS_ESTAB.map((t) => {
              const on = form.tipos.includes(t);
              return (
                <Badge
                  key={t}
                  variant="outline"
                  className={cn(
                    "cursor-pointer px-3 py-1 rounded-full transition-all",
                    on ? "bg-primary text-primary-foreground border-primary" : "hover:bg-primary/10"
                  )}
                  onClick={() =>
                    setForm((f) => ({
                      ...f,
                      tipos: on ? f.tipos.filter((x) => x !== t) : [...f.tipos, t],
                    }))
                  }
                >
                  {t}
                </Badge>
              );
            })}
          </div>
        </div>

        {/* Bloco: Responsável pelos contatos */}
        <div className="space-y-3">
          <p className="text-xs uppercase font-bold text-muted-foreground tracking-wider">Responsável pelos contatos</p>
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Nome" value={form.responsavel_nome} onChange={(v) => setForm({ ...form, responsavel_nome: v })} />
            <Field label="Telefone / WhatsApp" value={form.responsavel_telefone} onChange={(v) => setForm({ ...form, responsavel_telefone: v })} />
            <Field label="E-mail" value={form.responsavel_email} onChange={(v) => setForm({ ...form, responsavel_email: v })} />
            <Field label="Redes sociais" value={form.responsavel_redes} onChange={(v) => setForm({ ...form, responsavel_redes: v })} placeholder="@instagram, Facebook…" />
          </div>
        </div>

        {/* Bloco: Extras */}
        <div className="space-y-3">
          <p className="text-xs uppercase font-bold text-muted-foreground tracking-wider">Extras (opcional)</p>
          <div className="flex items-center gap-2">
            <input
              id="temCnpj"
              type="checkbox"
              checked={form.temCnpj}
              onChange={(e) => setForm({ ...form, temCnpj: e.target.checked })}
              className="h-4 w-4"
            />
            <Label htmlFor="temCnpj" className="text-sm cursor-pointer">Tem CNPJ (pessoa jurídica)</Label>
          </div>
          {form.temCnpj && (
            <Field label="CNPJ" value={form.cnpj} onChange={(v) => setForm({ ...form, cnpj: v })} placeholder="00.000.000/0000-00" />
          )}
          <div className="space-y-1.5">
            <Label className="text-sm font-semibold">Anotações</Label>
            <Textarea
              value={form.anotacoes}
              onChange={(e) => setForm({ ...form, anotacoes: e.target.value })}
              placeholder="Observações internas sobre o lugar."
              rows={3}
            />
          </div>
        </div>

        {user && (
          <div className="space-y-3">
            <p className="text-xs uppercase font-bold text-muted-foreground tracking-wider">Fotos</p>
            <PhotoGallery
              urls={form.fotos}
              onChange={(next) => setForm({ ...form, fotos: next })}
              kind="estabelecimentos"
              ownerUserId={user.id}
              targetId={editing}
              label="Fachada, logo e outras fotos"
              helper="Envie até 8 imagens. Elas aparecem na página do estabelecimento."
            />
          </div>
        )}

        <div className="flex gap-2">
          <Button onClick={save} disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : editing ? "Salvar alterações" : (<><Plus className="h-4 w-4 mr-1" /> Cadastrar</>)}
          </Button>
          {editing && (
            <Button variant="ghost" onClick={reset}>
              Cancelar
            </Button>
          )}
        </div>
      </Card>

      <div className="space-y-3">
        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : items.length === 0 ? (
          <Card className="p-8 text-center text-muted-foreground text-sm">
            Você ainda não cadastrou nenhum estabelecimento.
          </Card>
        ) : (
          items.map((e) => (
            <Card key={e.id} className="p-4 flex items-start gap-3">
              <div className="h-10 w-10 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                <MapPin className="h-5 w-5" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-bold truncate">{e.nome}</h3>
                <p className="text-xs text-muted-foreground truncate">
                  {[e.tipo, e.bairro, e.endereco].filter(Boolean).join(" · ") || "Sem detalhes"}
                </p>
                <div className="mt-1">
                  {e.is_approved ? (
                    <Badge variant="outline" className="text-[10px] border-emerald-500 text-emerald-700">Aprovado</Badge>
                  ) : (
                    <Badge variant="outline" className="text-[10px] border-amber-500 text-amber-700">Aguardando aprovação</Badge>
                  )}
                </div>
              </div>
              <div className="flex gap-1">
                <Button size="icon" variant="ghost" onClick={() => startEdit(e)} aria-label="Editar">
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button size="icon" variant="ghost" onClick={() => remove(e.id)} aria-label="Remover">
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-sm font-semibold">{label}</Label>
      <Input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} />
    </div>
  );
}
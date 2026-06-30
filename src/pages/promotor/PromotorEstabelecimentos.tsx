import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Plus, MapPin, Pencil, Trash2, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { handleError } from "@/lib/error-handler";
import { PromotorBadge } from "@/components/promotor/PromotorBadge";
import { ROUTES } from "@/routes/config";

interface Estab {
  id: string;
  nome: string;
  endereco: string | null;
  bairro: string | null;
  tipo: string | null;
  contato: string | null;
}

const empty = { nome: "", endereco: "", bairro: "", tipo: "", contato: "" };

export default function PromotorEstabelecimentos() {
  const { user } = useAuth();
  const [items, setItems] = useState<Estab[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<string | null>(null);
  const [form, setForm] = useState({ ...empty });
  const [saving, setSaving] = useState(false);

  const load = async () => {
    if (!user) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("estabelecimentos")
      .select("id, nome, endereco, bairro, tipo, contato")
      .eq("responsavel_id", user.id)
      .order("nome");
    if (error) handleError(error, "Erro ao carregar estabelecimentos");
    else setItems((data ?? []) as Estab[]);
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

  const startEdit = (e: Estab) => {
    setEditing(e.id);
    setForm({
      nome: e.nome ?? "",
      endereco: e.endereco ?? "",
      bairro: e.bairro ?? "",
      tipo: e.tipo ?? "",
      contato: e.contato ?? "",
    });
  };

  const save = async () => {
    if (!user) return;
    if (!form.nome.trim()) {
      toast.error("Informe o nome do estabelecimento.");
      return;
    }
    setSaving(true);
    try {
      if (editing) {
        const { error } = await supabase
          .from("estabelecimentos")
          .update({
            nome: form.nome.trim(),
            endereco: form.endereco || null,
            bairro: form.bairro || null,
            tipo: form.tipo || null,
            contato: form.contato || null,
          })
          .eq("id", editing);
        if (error) throw error;
        toast.success("Estabelecimento atualizado.");
      } else {
        const { error } = await supabase.from("estabelecimentos").insert({
          nome: form.nome.trim(),
          endereco: form.endereco || null,
          bairro: form.bairro || null,
          tipo: form.tipo || null,
          contato: form.contato || null,
          responsavel_id: user.id,
          created_by: user.id,
        });
        if (error) throw error;
        toast.success("Estabelecimento cadastrado.");
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
    if (!confirm("Remover este estabelecimento?")) return;
    const { error } = await supabase.from("estabelecimentos").delete().eq("id", id);
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
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Nome*" value={form.nome} onChange={(v) => setForm({ ...form, nome: v })} />
          <Field label="Tipo" value={form.tipo} onChange={(v) => setForm({ ...form, tipo: v })} placeholder="Bar, restaurante…" />
          <Field label="Endereço" value={form.endereco} onChange={(v) => setForm({ ...form, endereco: v })} />
          <Field label="Bairro" value={form.bairro} onChange={(v) => setForm({ ...form, bairro: v })} />
          <Field label="Contato" value={form.contato} onChange={(v) => setForm({ ...form, contato: v })} placeholder="WhatsApp ou e-mail" />
        </div>
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
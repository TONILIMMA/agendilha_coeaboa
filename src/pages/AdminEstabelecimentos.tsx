import { useEffect, useMemo, useState } from "react";
import { Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useAppPermissions } from "@/hooks/useAppPermissions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Building2, Plus, Search, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { LoadingState } from "@/components/ui/LoadingState";
import { EmptyState } from "@/components/ui/EmptyState";
import {
  EstabelecimentoCard,
  type EstabelecimentoRow,
} from "@/components/estabelecimentos/EstabelecimentoCard";

export default function AdminEstabelecimentos() {
  const { user, loading: authLoading } = useAuth();
  const { isAdmin, isMaster, loading: permsLoading } = useAppPermissions();
  const [rows, setRows] = useState<EstabelecimentoRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [creating, setCreating] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [newForm, setNewForm] = useState({
    nome: "", endereco: "", bairro: "", cep: "", numero: "", complemento: "", tipo: "", contato: "",
  });

  async function fetchAll() {
    setLoading(true);
    const { data, error } = await supabase
      .from("estabelecimentos")
      .select("id, nome, endereco, bairro, cep, numero, complemento, tipo, contato, responsavel_id, created_by, created_at, updated_at, is_approved, responsavel_nome, responsavel_telefone, responsavel_email")
      .order("nome", { ascending: true });
    if (error) toast.error("Erro ao carregar estabelecimentos", { description: error.message });
    else setRows((data ?? []) as EstabelecimentoRow[]);
    setLoading(false);
  }

  useEffect(() => {
    if (isAdmin) fetchAll();
  }, [isAdmin]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter(
      (e) =>
        e.nome.toLowerCase().includes(q) ||
        (e.bairro ?? "").toLowerCase().includes(q) ||
        (e.endereco ?? "").toLowerCase().includes(q)
    );
  }, [rows, search]);

  async function handleSave(id: string, patch: Partial<EstabelecimentoRow>) {
    const { error } = await supabase.from("estabelecimentos").update(patch).eq("id", id);
    if (error) {
      toast.error("Erro ao salvar", { description: error.message });
      return false;
    }
    toast.success("Estabelecimento atualizado");
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } as EstabelecimentoRow : r)));
    return true;
  }

  async function handleDelete(id: string) {
    const { error } = await supabase.from("estabelecimentos").delete().eq("id", id);
    if (error) {
      toast.error("Erro ao excluir", { description: error.message });
      return;
    }
    toast.success("Estabelecimento removido");
    setRows((prev) => prev.filter((r) => r.id !== id));
  }

  async function handleApprove(id: string, approve: boolean) {
    const patch: any = approve
      ? { is_approved: true, approved_at: new Date().toISOString(), approved_by: user?.id ?? null }
      : { is_approved: false, approved_at: null, approved_by: null };
    const { error } = await supabase.from("estabelecimentos").update(patch).eq("id", id);
    if (error) {
      toast.error("Não deu pra atualizar a aprovação", { description: error.message });
      return;
    }
    toast.success(approve ? "Cadastro aprovado — já aparece nas buscas do público" : "Aprovação revertida");
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, is_approved: approve } as EstabelecimentoRow : r)));
  }

  async function handleCreate() {
    if (!newForm.nome.trim() || !user) return;
    setCreating(true);
    const payload = {
      nome: newForm.nome.trim(),
      endereco: newForm.endereco.trim() || null,
      bairro: newForm.bairro.trim() || null,
      cep: newForm.cep.trim() || null,
      numero: newForm.numero.trim() || null,
      complemento: newForm.complemento.trim() || null,
      tipo: newForm.tipo.trim() || null,
      contato: newForm.contato.trim() || null,
      responsavel_id: user.id,
      created_by: user.id,
    };
    const { data, error } = await supabase
      .from("estabelecimentos")
      .insert(payload)
      .select("*")
      .single();
    setCreating(false);
    if (error || !data) {
      toast.error("Erro ao criar", { description: error?.message });
      return;
    }
    toast.success("Estabelecimento cadastrado");
    setRows((prev) => [...prev, data as EstabelecimentoRow].sort((a, b) => a.nome.localeCompare(b.nome)));
    setShowNew(false);
    setNewForm({ nome: "", endereco: "", bairro: "", cep: "", numero: "", complemento: "", tipo: "", contato: "" });
  }

  if (authLoading || permsLoading) return <LoadingState fullPage message="Verificando permissões..." />;
  if (!user || !isAdmin) return <Navigate to="/" replace />;

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <SectionHeader
        title="Estabelecimentos"
        subtitle="Locais cadastrados na agenda — clique no card para ver os detalhes e editar."
        rightElement={
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-4 py-2 bg-muted/50 rounded-full border border-border">
              <Building2 className="h-4 w-4 text-primary" />
              <span className="text-sm font-bold">{rows.length}</span>
            </div>
            <Button size="sm" className="gap-2" onClick={() => setShowNew((v) => !v)}>
              <Plus className="h-4 w-4" />
              Novo
            </Button>
          </div>
        }
      />

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por nome, bairro ou endereço..."
          className="pl-10 h-11"
        />
      </div>

      {showNew && (
        <Card className="border-primary/30">
          <CardContent className="p-4 sm:p-5 space-y-3">
            <h3 className="font-bold">Novo estabelecimento</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <NewField label="Nome*" value={newForm.nome} onChange={(v) => setNewForm({ ...newForm, nome: v })} />
              <NewField label="Tipo" value={newForm.tipo} onChange={(v) => setNewForm({ ...newForm, tipo: v })} placeholder="bar, restaurante..." />
              <NewField label="Endereço" value={newForm.endereco} onChange={(v) => setNewForm({ ...newForm, endereco: v })} />
              <NewField label="Número" value={newForm.numero} onChange={(v) => setNewForm({ ...newForm, numero: v })} />
              <NewField label="Bairro" value={newForm.bairro} onChange={(v) => setNewForm({ ...newForm, bairro: v })} />
              <NewField label="CEP" value={newForm.cep} onChange={(v) => setNewForm({ ...newForm, cep: v })} />
              <NewField label="Complemento" value={newForm.complemento} onChange={(v) => setNewForm({ ...newForm, complemento: v })} />
              <NewField label="Contato" value={newForm.contato} onChange={(v) => setNewForm({ ...newForm, contato: v })} />
            </div>
            <div className="flex gap-2">
              <Button size="sm" onClick={handleCreate} disabled={creating || !newForm.nome.trim()}>
                {creating ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Plus className="h-4 w-4 mr-2" />}
                Cadastrar
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setShowNew(false)} disabled={creating}>
                Cancelar
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {loading ? (
        <LoadingState message="Carregando estabelecimentos..." />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Building2}
          title="Nenhum estabelecimento"
          description={search ? "Tente outra busca." : "Comece cadastrando o primeiro local."}
        />
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filtered.map((e) => (
            <EstabelecimentoCard
              key={e.id}
              estab={e}
              canEdit={
                isMaster ||
                isAdmin ||
                e.responsavel_id === user.id ||
                e.created_by === user.id
              }
              canDelete={isMaster || isAdmin}
              canApprove={isMaster || isAdmin}
              onSave={handleSave}
              onDelete={handleDelete}
              onApprove={handleApprove}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function NewField({
  label, value, onChange, placeholder,
}: { label: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <div className="space-y-1">
      <Label className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">{label}</Label>
      <Input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="h-10" />
    </div>
  );
}
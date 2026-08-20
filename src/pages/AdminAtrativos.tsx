import { useMemo, useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useAppPermissions } from "@/hooks/useAppPermissions";
import {
  useAllAtrativos,
  useUpsertAtrativo,
  useDeleteAtrativo,
  type AtrativoRow,
} from "@/data/useAtrativos";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Sparkles, Plus, Search, Loader2, Pencil, Trash2, Check, X, ShieldCheck, ChevronDown, ChevronUp } from "lucide-react";
import { toast } from "sonner";
import { handleError } from "@/lib/error-handler";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { LoadingState } from "@/components/ui/LoadingState";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageContainer } from "@/components/ui/PageContainer";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

/**
 * Admin/Master: gestão completa de Atrativos.
 * Lista tudo, permite editar, aprovar/desaprovar e excluir.
 */
export default function AdminAtrativos() {
  const { user, loading: authLoading } = useAuth();
  const { isAdmin, isMaster, isCollaborator, hasPermission, loading: permsLoading } = useAppPermissions();
  const canManage = isAdmin || isMaster || isCollaborator || hasPermission("events.update");
  const canDelete = isAdmin || isMaster || hasPermission("events.delete");
  const { data: rows = [], isLoading: loading } = useAllAtrativos(canManage);
  const upsert = useUpsertAtrativo();
  const remove_ = useDeleteAtrativo();

  const [search, setSearch] = useState("");
  const [showNew, setShowNew] = useState(false);
  const [newForm, setNewForm] = useState({ name: "", type: "", description: "" });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<AtrativoRow>>({});
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter(
      (a) =>
        a.name.toLowerCase().includes(q) ||
        (a.type ?? "").toLowerCase().includes(q),
    );
  }, [rows, search]);

  async function handleCreate() {
    if (!newForm.name.trim() || !user) return;
    try {
      await upsert.mutateAsync({
        payload: {
          name: newForm.name.trim(),
          type: newForm.type.trim() || null,
          description: newForm.description.trim() || null,
          responsavel_id: user.id,
          created_by: user.id,
        },
      });
      toast.success("Atrativo cadastrado");
      setShowNew(false);
      setNewForm({ name: "", type: "", description: "" });
    } catch (err) {
      handleError(err, "Erro ao cadastrar atrativo");
    }
  }

  function startEdit(row: AtrativoRow) {
    setEditingId(row.id);
    setEditForm({ name: row.name, type: row.type, description: row.description });
  }

  async function saveEdit(id: string) {
    try {
      await upsert.mutateAsync({ id, payload: {
        name: (editForm.name ?? "").toString().trim(),
        type: editForm.type?.toString().trim() || null,
        description: editForm.description?.toString().trim() || null,
      } });
      toast.success("Atrativo atualizado");
      setEditingId(null);
    } catch (err) {
      handleError(err, "Erro ao salvar");
    }
  }

  async function toggleApprove(row: AtrativoRow) {
    const approve = !row.is_approved;
    try {
      await upsert.mutateAsync({
        id: row.id,
        payload: approve
          ? { is_approved: true, approved_at: new Date().toISOString(), approved_by: user?.id ?? null }
          : { is_approved: false, approved_at: null, approved_by: null },
      });
      toast.success(approve ? "Atrativo aprovado" : "Aprovação revertida");
    } catch (err) {
      handleError(err, "Não deu pra atualizar aprovação");
    }
  }

  async function handleDelete(id: string) {
    try {
      await remove_.mutateAsync(id);
      toast.success("Atrativo removido");
    } catch (err) {
      handleError(err, "Erro ao excluir");
    }
  }

  if (authLoading || permsLoading) return <LoadingState fullPage message="Verificando permissões..." />;
  if (!user || (!canManage && !isCollaborator)) return <Navigate to="/" replace />;

  return (
    <PageContainer maxWidth="5xl">
      <SectionHeader
        title="Atrativos"
        subtitle="Festas, rodas, shows, projetos — a curadoria oficial da agenda."
        rightElement={
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-4 py-2 bg-muted/50 rounded-full border border-border">
              <Sparkles className="h-4 w-4 text-primary" />
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
          placeholder="Buscar por nome ou categoria..."
          className="pl-10 h-11"
        />
      </div>

      {showNew && (
        <Card className="border-primary/30">
          <CardContent className="p-4 sm:p-5 space-y-3">
            <h3 className="font-bold">Novo atrativo</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Field label="Nome*" value={newForm.name} onChange={(v) => setNewForm({ ...newForm, name: v })} />
              <Field label="Categoria" value={newForm.type} onChange={(v) => setNewForm({ ...newForm, type: v })} placeholder="samba, rock, stand-up..." />
              <div className="sm:col-span-2">
                <Field label="Descrição" value={newForm.description} onChange={(v) => setNewForm({ ...newForm, description: v })} />
              </div>
            </div>
            <div className="flex gap-2">
              <Button size="sm" onClick={handleCreate} disabled={upsert.isPending || !newForm.name.trim()}>
                {upsert.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Plus className="h-4 w-4 mr-2" />}
                Cadastrar
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setShowNew(false)}>Cancelar</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {loading ? (
        <LoadingState message="Carregando atrativos..." />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Sparkles}
          title="Nenhum atrativo"
          description={search ? "Tente outra busca." : "Cadastre o primeiro atrativo."}
        />
      ) : (
        <div className="grid grid-cols-1 gap-3">
          {filtered.map((a) => {
            const isEditing = editingId === a.id;
            const isExpanded = expandedId === a.id || isEditing;
            return (
              <Card
                key={a.id}
                className={`overflow-hidden transition-all duration-300 ${
                  isExpanded ? "shadow-md ring-2 ring-primary/20" : "hover:shadow-md"
                } ${a.is_approved ? "" : "border-amber-300"}`}
              >
                <CardContent className="p-0">
                  <button
                    type="button"
                    onClick={() => {
                      if (isEditing) return;
                      setExpandedId((v) => (v === a.id ? null : a.id));
                    }}
                    aria-expanded={isExpanded}
                    className="w-full text-left p-4 flex items-start justify-between gap-3"
                  >
                    <div className="min-w-0 flex-1">
                      <h4 className="font-bold truncate">{a.name}</h4>
                      <p className="text-xs text-muted-foreground">
                        {[a.type, a.tipo_atrativo].filter(Boolean).join(" · ") || "sem categoria"}
                      </p>
                      {a.description && !isExpanded && (
                        <p className="text-sm text-muted-foreground mt-1 line-clamp-1">{a.description}</p>
                      )}
                    </div>
                    <div className="shrink-0 flex items-center gap-2">
                      {a.is_approved ? (
                        <span className="text-xs px-2 py-1 rounded-full bg-green-100 text-green-800 inline-flex items-center gap-1">
                          <ShieldCheck className="h-3 w-3" /> aprovado
                        </span>
                      ) : (
                        <span className="text-xs px-2 py-1 rounded-full bg-amber-100 text-amber-800">
                          pendente
                        </span>
                      )}
                      {isExpanded ? (
                        <ChevronUp className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <ChevronDown className="h-4 w-4 text-muted-foreground" />
                      )}
                    </div>
                  </button>

                  {isExpanded && (
                    <div className="border-t border-border bg-muted/20 p-4 space-y-3 animate-in slide-in-from-top-2 duration-200">
                      {isEditing ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <Field label="Nome*" value={String(editForm.name ?? "")} onChange={(v) => setEditForm({ ...editForm, name: v })} />
                      <Field label="Categoria" value={String(editForm.type ?? "")} onChange={(v) => setEditForm({ ...editForm, type: v })} />
                      <div className="sm:col-span-2">
                        <Field label="Descrição" value={String(editForm.description ?? "")} onChange={(v) => setEditForm({ ...editForm, description: v })} />
                      </div>
                    </div>
                      ) : a.description ? (
                        <p className="text-sm text-muted-foreground whitespace-pre-wrap">{a.description}</p>
                      ) : null}

                  <div className="flex flex-wrap gap-2">
                    {isEditing ? (
                      <>
                        <Button size="sm" onClick={() => saveEdit(a.id)} disabled={upsert.isPending}>
                          <Check className="h-4 w-4 mr-1" /> Salvar
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => setEditingId(null)}>
                          <X className="h-4 w-4 mr-1" /> Cancelar
                        </Button>
                      </>
                    ) : (
                      <>
                        {(isAdmin || isMaster || a.responsavel_id === user.id || hasPermission("events.update")) && (
                          <Button size="sm" variant="outline" onClick={() => startEdit(a)}>
                            <Pencil className="h-4 w-4 mr-1" /> Editar
                          </Button>
                        )}
                        {(isAdmin || isMaster) && (
                          <Button size="sm" variant="outline" onClick={() => toggleApprove(a)}>
                            <ShieldCheck className="h-4 w-4 mr-1" />
                            {a.is_approved ? "Reverter aprovação" : "Aprovar"}
                          </Button>
                        )}
                        {(isAdmin || isMaster || hasPermission("events.delete")) && (
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button size="sm" variant="destructive">
                                <Trash2 className="h-4 w-4 mr-1" /> Excluir
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Excluir atrativo?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  "{a.name}" será removido. Essa ação não pode ser desfeita.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDelete(a.id)}>Excluir</AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        )}
                      </>
                    )}

                  </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </PageContainer>
  );
}

function Field({
  label, value, onChange, placeholder,
}: { label: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <div className="space-y-1">
      <Label className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">{label}</Label>
      <Input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="h-10" />
    </div>
  );
}
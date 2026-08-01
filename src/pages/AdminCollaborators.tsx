import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useAppPermissions as usePermissions } from "@/hooks/usePermissions";
import { Navigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose,
} from "@/components/ui/dialog";
import { Loader2, Plus, Trash2, Users, Shield, Edit2, UserCheck, ShieldCheck, Mail, Phone, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { LoadingState } from "@/components/ui/LoadingState";
import { EmptyState } from "@/components/ui/EmptyState";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { cn } from "@/lib/utils";
import {
  useCollaborators,
  useUpsertCollaborator,
  useDeleteCollaborator,
  type Collaborator,
} from "@/data/useCollaborators";
import { handleError } from "@/lib/error-handler";

const emptyForm = {
  name: "",
  email: "",
  role_title: "Colaborador",
  user_id: "",
  can_submit: true,
  can_approve: false,
  can_edit: false,
  can_delete: false,
  is_active: true,
};

export default function AdminCollaborators() {
  const { user, isAdmin, loading: authLoading } = useAuth();
  const perms = usePermissions();
  const hasAccess = isAdmin || (perms.loaded && perms.canApprove);
  const { data: collaborators = [], isLoading: loading } = useCollaborators(hasAccess);
  const upsert = useUpsertCollaborator();
  const remove_ = useDeleteCollaborator();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const saving = upsert.isPending;

  const { data: availableUsers = [] } = useProfileOptions(hasAccess);

  function openNewDialog() {
    setEditingId(null);
    setForm(emptyForm);
    setDialogOpen(true);
  }

  function openEditDialog(collab: Collaborator) {
    setEditingId(collab.id);
    setForm({
      name: collab.name,
      email: collab.email || "",
      role_title: collab.role_title,
      user_id: collab.user_id,
      can_submit: collab.can_submit,
      can_approve: collab.can_approve,
      can_edit: collab.can_edit,
      can_delete: collab.can_delete,
      is_active: collab.is_active,
    });
    setDialogOpen(true);
  }

  async function handleSave() {
    if (!form.name.trim()) {
      toast.error("Nome é obrigatório");
      return;
    }
    if (!form.user_id.trim()) {
      toast.error("Selecione um usuário");
      return;
    }
    const payload = {
      name: form.name.trim(),
      email: form.email.trim() || null,
      role_title: form.role_title.trim(),
      user_id: form.user_id,
      can_submit: form.can_submit,
      can_approve: form.can_approve,
      can_edit: form.can_edit,
      can_delete: form.can_delete,
      is_active: form.is_active,
    };
    try {
      await upsert.mutateAsync({ id: editingId, payload });
      toast.success(editingId ? "Colaborador atualizado!" : "Colaborador adicionado!");
      setDialogOpen(false);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "";
      if (!editingId && msg.includes("duplicate")) {
        toast.error("Este usuário já é um colaborador");
      } else {
        handleError(err, editingId ? "Erro ao atualizar" : "Erro ao criar");
      }
    }
  }

  async function handleDelete(id: string) {
    try {
      await remove_.mutateAsync(id);
      toast.success("Colaborador removido");
    } catch (err) {
      handleError(err, "Erro ao remover colaborador");
    }
  }

  if (authLoading) return <LoadingState fullPage message="Carregando..." />;
  if (!user || !hasAccess) return <Navigate to="/" replace />;

  const permissionLabels = [
    { key: "can_submit", label: "Enviar eventos", icon: "📤" },
    { key: "can_approve", label: "Liberar eventos", icon: "✅" },
    { key: "can_edit", label: "Editar eventos", icon: "✏️" },
    { key: "can_delete", label: "Excluir eventos", icon: "🗑️" },
  ] as const;

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      <SectionHeader 
        title="Colaboradores" 
        subtitle="Gerencie os membros da equipe e suas permissões operacionais no AgendIlha."
        rightElement={
          <Button size="sm" onClick={openNewDialog} className="rounded-full px-6 font-bold shadow-sm">
            <Plus className="h-4 w-4 mr-1.5" />
            Adicionar Colaborador
          </Button>
        }
      />

      {loading ? (
        <LoadingState message="Buscando colaboradores..." />
      ) : collaborators.length === 0 ? (
        <EmptyState 
          icon={UserCheck}
          title="Nenhum colaborador cadastrado"
          description="Você ainda não adicionou membros à sua equipe de moderação."
          actionLabel="Adicionar agora"
          onAction={openNewDialog}
        />
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {collaborators.map((collab) => (
            <Card key={collab.id} className="group hover:shadow-md transition-all border-border overflow-hidden">
              <CardContent className="p-0">
                <div className="flex flex-col md:flex-row md:items-center p-5 gap-6">
                  <div className="flex-1 flex items-center gap-4">
                    <div className={cn(
                      "h-12 w-12 rounded-full flex items-center justify-center shrink-0 border-2",
                      collab.is_active ? "bg-primary/5 border-primary/20 text-primary" : "bg-muted border-muted-foreground/20 text-muted-foreground"
                    )}>
                      <Shield className="h-6 w-6" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-bold text-lg text-foreground">{collab.name}</h3>
                        <Badge variant="outline" className="text-[10px] font-bold uppercase tracking-widest px-2 py-0 border-primary/30 text-primary bg-primary/5">
                          {collab.role_title}
                        </Badge>
                        {!collab.is_active && (
                          <Badge variant="secondary" className="text-[10px] font-bold uppercase tracking-widest px-2 py-0">Inativo</Badge>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-x-4 gap-y-1 items-center text-sm text-muted-foreground mt-1">
                        {collab.email && (
                          <span className="flex items-center gap-1.5">
                            <Mail className="h-3.5 w-3.5" />
                            {collab.email}
                          </span>
                        )}
                        <span className="text-[10px] uppercase tracking-widest font-mono opacity-60">
                          ID: {collab.user_id.slice(0, 8)}...
                        </span>
                      </div>
                      
                      <div className="flex flex-wrap gap-1.5 mt-3">
                        {permissionLabels.map(({ key, label }) => (
                          collab[key] && (
                            <Badge key={key} variant="secondary" className="text-[10px] font-medium bg-muted/50 text-muted-foreground border-none">
                              {label}
                            </Badge>
                          )
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 justify-end shrink-0">
                    <Button size="icon" variant="ghost" onClick={() => openEditDialog(collab)} className="h-9 w-9 rounded-full">
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button size="icon" variant="ghost" onClick={() => handleDelete(collab.id)} className="h-9 w-9 text-rose-500 hover:text-rose-600 hover:bg-rose-50 rounded-full">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Unified Modal for Create/Edit */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md rounded-3xl border-none shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-black uppercase tracking-tight">
              {editingId ? "Editar Colaborador" : "Novo Colaborador"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-6 py-4">
            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase tracking-widest opacity-70">Vincular a Usuário</Label>
              <select
                className="w-full h-11 rounded-xl border border-input bg-background px-4 py-2 text-sm focus:ring-2 focus:ring-primary/20 transition-all outline-none"
                value={form.user_id}
                onChange={(e) => {
                  const uid = e.target.value;
                  setForm(prev => ({ ...prev, user_id: uid }));
                  const found = availableUsers.find(u => u.id === uid);
                  if (found && !form.name) {
                    setForm(prev => ({ ...prev, name: found.name }));
                  }
                }}
              >
                <option value="">Selecione um usuário...</option>
                {availableUsers.map(u => (
                  <option key={u.id} value={u.id}>
                    {u.name} {u.phone ? `(${u.phone})` : ""}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase tracking-widest opacity-70">Nome de Exibição</Label>
                <Input className="h-11 rounded-xl" value={form.name} onChange={(e) => setForm(prev => ({ ...prev, name: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase tracking-widest opacity-70">Título / Cargo</Label>
                <Input className="h-11 rounded-xl" value={form.role_title} onChange={(e) => setForm(prev => ({ ...prev, role_title: e.target.value }))} placeholder="Ex: Moderador" />
              </div>
            </div>

            <div className="space-y-3">
              <Label className="text-xs font-bold uppercase tracking-widest opacity-70">Permissões de Acesso</Label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-muted/30 p-4 rounded-2xl border border-border/50">
                {permissionLabels.map(({ key, label }) => (
                  <div key={key} className="flex items-center gap-3">
                    <Checkbox
                      id={`perm-${key}`}
                      checked={form[key]}
                      onCheckedChange={(checked) => setForm(prev => ({ ...prev, [key]: !!checked }))}
                      className="rounded-md"
                    />
                    <label htmlFor={`perm-${key}`} className="text-sm font-medium cursor-pointer select-none">{label}</label>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-3 p-4 bg-primary/5 rounded-2xl border border-primary/10">
              <Checkbox
                id="is_active"
                checked={form.is_active}
                onCheckedChange={(checked) => setForm(prev => ({ ...prev, is_active: !!checked }))}
              />
              <label htmlFor="is_active" className="text-sm font-bold text-primary cursor-pointer select-none">Colaborador em atividade (Ativo)</label>
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <DialogClose asChild>
              <Button variant="ghost" className="rounded-full font-bold">Cancelar</Button>
            </DialogClose>
            <Button className="rounded-full px-8 font-bold shadow-lg shadow-primary/20" onClick={handleSave} disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              {editingId ? "Salvar Alterações" : "Criar Colaborador"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

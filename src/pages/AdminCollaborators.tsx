import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { usePermissions } from "@/hooks/usePermissions";
import { Navigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose,
} from "@/components/ui/dialog";
import { Loader2, Plus, Trash2, Users, Shield, Edit2 } from "lucide-react";
import { toast } from "sonner";

interface Collaborator {
  id: string;
  user_id: string;
  name: string;
  email: string | null;
  role_title: string;
  can_submit: boolean;
  can_approve: boolean;
  can_edit: boolean;
  can_delete: boolean;
  is_active: boolean;
  created_at: string;
}

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
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  // Load available users for reference
  const [availableUsers, setAvailableUsers] = useState<{ id: string; phone: string; name: string }[]>([]);

  async function fetchCollaborators() {
    setLoading(true);
    const { data, error } = await supabase
      .from("collaborators")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) {
      toast.error("Erro ao carregar colaboradores");
    } else {
      setCollaborators((data as any[]) || []);
    }
    setLoading(false);
  }

  async function fetchUsers() {
    const { data } = await supabase.from("profiles").select("user_id, responsible_name, phone");
    if (data) {
      setAvailableUsers(data.map(u => ({
        id: u.user_id,
        phone: u.phone || "",
        name: u.responsible_name || "Sem nome",
      })));
    }
  }

  useEffect(() => {
    if (hasAccess) {
      fetchCollaborators();
      fetchUsers();
    }
  }, [isAdmin]);

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

    setSaving(true);
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

    if (editingId) {
      const { error } = await supabase.from("collaborators").update(payload as any).eq("id", editingId);
      if (error) {
        toast.error("Erro ao atualizar", { description: error.message });
      } else {
        toast.success("Colaborador atualizado!");
        setDialogOpen(false);
        fetchCollaborators();
      }
    } else {
      const { error } = await supabase.from("collaborators").insert(payload as any);
      if (error) {
        if (error.message.includes("duplicate")) {
          toast.error("Este usuário já é um colaborador");
        } else {
          toast.error("Erro ao criar", { description: error.message });
        }
      } else {
        toast.success("Colaborador adicionado!");
        setDialogOpen(false);
        fetchCollaborators();
      }
    }
    setSaving(false);
  }

  async function handleDelete(id: string) {
    const { error } = await supabase.from("collaborators").delete().eq("id", id);
    if (error) {
      toast.error("Erro ao remover colaborador");
    } else {
      toast.success("Colaborador removido");
      setCollaborators(prev => prev.filter(c => c.id !== id));
    }
  }

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user || !hasAccess) return <Navigate to="/" replace />;

  const permissionLabels = [
    { key: "can_submit", label: "Enviar eventos", icon: "📤" },
    { key: "can_approve", label: "Liberar eventos", icon: "✅" },
    { key: "can_edit", label: "Editar eventos", icon: "✏️" },
    { key: "can_delete", label: "Excluir eventos", icon: "🗑️" },
  ] as const;

  return (
    <div className="mx-auto max-w-4xl px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Shield className="h-6 w-6 text-primary" />
          <h1 className="text-xl font-display font-bold text-foreground">Colaboradores</h1>
          <Badge variant="secondary" className="text-xs">{collaborators.length}</Badge>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" onClick={openNewDialog}>
              <Plus className="h-4 w-4 mr-1" />
              Novo Colaborador
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>{editingId ? "Editar Colaborador" : "Novo Colaborador"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Usuário cadastrado</Label>
                <select
                  className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
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
                  <option value="">Selecione um usuário</option>
                  {availableUsers.map(u => (
                    <option key={u.id} value={u.id}>
                      {u.name} {u.phone ? `(${u.phone})` : ""}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Nome</Label>
                  <Input value={form.name} onChange={(e) => setForm(prev => ({ ...prev, name: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label>Função</Label>
                  <Input value={form.role_title} onChange={(e) => setForm(prev => ({ ...prev, role_title: e.target.value }))} placeholder="Ex: Coordenador" />
                </div>
              </div>
              <div className="space-y-2">
                <Label>E-mail (opcional)</Label>
                <Input type="email" value={form.email} onChange={(e) => setForm(prev => ({ ...prev, email: e.target.value }))} />
              </div>
              <div className="space-y-3">
                <Label className="font-semibold">Permissões</Label>
                {permissionLabels.map(({ key, label, icon }) => (
                  <div key={key} className="flex items-center gap-3">
                    <Checkbox
                      checked={form[key]}
                      onCheckedChange={(checked) => setForm(prev => ({ ...prev, [key]: !!checked }))}
                    />
                    <span className="text-sm">{icon} {label}</span>
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-3 pt-2 border-t border-border">
                <Checkbox
                  checked={form.is_active}
                  onCheckedChange={(checked) => setForm(prev => ({ ...prev, is_active: !!checked }))}
                />
                <span className="text-sm font-medium">✅ Colaborador ativo</span>
              </div>
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline" size="sm">Cancelar</Button>
              </DialogClose>
              <Button size="sm" onClick={handleSave} disabled={saving}>
                {saving ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
                {editingId ? "Salvar" : "Adicionar"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : collaborators.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Users className="h-12 w-12 text-muted-foreground/40 mb-3" />
          <p className="text-muted-foreground text-sm">Nenhum colaborador cadastrado.</p>
          <p className="text-muted-foreground text-xs mt-1">Adicione colaboradores para gerenciar permissões de eventos.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {collaborators.map((collab) => (
            <Card key={collab.id} className="border-border">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-display font-semibold text-foreground">{collab.name}</h3>
                      <Badge variant="outline" className="text-xs">{collab.role_title}</Badge>
                      <Badge variant={collab.is_active ? "default" : "secondary"} className="text-xs">
                        {collab.is_active ? "Ativo" : "Inativo"}
                      </Badge>
                    </div>
                    {collab.email && <p className="text-xs text-muted-foreground">{collab.email}</p>}
                    <p className="text-[10px] text-muted-foreground">
                      Cadastrado em {new Date(collab.created_at).toLocaleDateString("pt-BR")}
                    </p>
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {collab.can_submit && <Badge variant="secondary" className="text-xs">📤 Enviar</Badge>}
                      {collab.can_approve && <Badge variant="secondary" className="text-xs">✅ Liberar</Badge>}
                      {collab.can_edit && <Badge variant="secondary" className="text-xs">✏️ Editar</Badge>}
                      {collab.can_delete && <Badge variant="secondary" className="text-xs">🗑️ Excluir</Badge>}
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button size="icon" variant="ghost" onClick={() => openEditDialog(collab)} className="h-8 w-8">
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button size="icon" variant="ghost" onClick={() => handleDelete(collab.id)} className="h-8 w-8 text-destructive hover:text-destructive">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

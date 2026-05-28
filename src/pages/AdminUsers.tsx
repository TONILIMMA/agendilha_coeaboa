import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Navigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
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
import { ShieldCheck, ShieldOff, Loader2, Users, Phone, User, Trash2, Pencil, Check, X, Crown, MapPin, Music, UserMinus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { toast } from "sonner";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { LoadingState } from "@/components/ui/LoadingState";
import { EmptyState } from "@/components/ui/EmptyState";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type UserStatus = "master" | "admin" | "collaborator" | "user" | "artist";

interface UserWithRole {
  id: string;
  email: string;
  created_at: string;
  is_admin: boolean;
  is_master?: boolean;
  status?: UserStatus;
  responsible_name: string | null;
  phone: string | null;
  address_neighborhood?: string | null;
  musical_preferences?: string[] | null;
}

function formatPhone(phone: string | null): string {
  if (!phone) return "Não informado";
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 13 && digits.startsWith("55")) {
    const ddd = digits.slice(2, 4);
    const part1 = digits.slice(4, 9);
    const part2 = digits.slice(9);
    return `(${ddd}) ${part1}-${part2}`;
  }
  if (digits.length === 11) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
  }
  return phone;
}

export default function AdminUsers() {
  const { user, isAdmin, loading: authLoading } = useAuth();
  const [users, setUsers] = useState<UserWithRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [isMaster, setIsMaster] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [savingEdit, setSavingEdit] = useState(false);
  const [togglingMaster, setTogglingMaster] = useState<string | null>(null);
  const [showAdminConfirm, setShowAdminConfirm] = useState<UserWithRole | null>(null);
  const [showMasterConfirm, setShowMasterConfirm] = useState<UserWithRole | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<UserWithRole | null>(null);

  useEffect(() => {
    if (!user) return;
    supabase.rpc("is_master", { _user_id: user.id }).then(({ data }) => {
      setIsMaster(data === true);
    });
  }, [user]);

  function startEdit(u: UserWithRole) {
    setEditingId(u.id);
    setEditName(u.responsible_name || "");
  }

  function cancelEdit() {
    setEditingId(null);
    setEditName("");
  }

  async function saveEdit(targetUser: UserWithRole) {
    const trimmed = editName.trim();
    if (trimmed.length < 2) {
      toast.error("Nome muito curto");
      return;
    }
    setSavingEdit(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        toast.error("Sessão expirada.");
        setSavingEdit(false);
        return;
      }
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/update-user`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
            apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          },
          body: JSON.stringify({ user_id: targetUser.id, responsible_name: trimmed }),
        }
      );
      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err?.error || `Erro ${response.status}`);
      }
      toast.success("Nome atualizado");
      cancelEdit();
      await fetchUsers();
    } catch (err: any) {
      toast.error(err.message || "Erro ao atualizar nome");
    }
    setSavingEdit(false);
  }

  async function fetchUsers() {
    setLoading(true);
    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session?.access_token) {
        toast.error("Sessão expirada. Faça login novamente.");
        setLoading(false);
        return;
      }

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/list-users`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
            apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          },
        }
      );

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err?.error || `Erro ${response.status}`);
      }

      const data = await response.json();
      setUsers(data as UserWithRole[]);
    } catch (err: any) {
      toast.error(err.message || "Erro ao carregar usuários");
    }
    setLoading(false);
  }

  useEffect(() => {
    if (isAdmin) fetchUsers();
  }, [isAdmin]);

  async function toggleAdmin(targetUser: UserWithRole) {
    if (targetUser.id === user?.id) {
      toast.error("Você não pode remover seu próprio papel de admin");
      return;
    }
    setToggling(targetUser.id);
    try {
      if (targetUser.is_admin) {
        const { error } = await supabase
          .from("user_roles")
          .delete()
          .eq("user_id", targetUser.id)
          .eq("role", "admin");
        if (error) throw error;
        toast.success(`Admin removido de ${targetUser.responsible_name || targetUser.email}`);
      } else {
        const { error } = await supabase
          .from("user_roles")
          .insert({ user_id: targetUser.id, role: "admin" });
        if (error) throw error;
        toast.success(`${targetUser.responsible_name || targetUser.email} agora é admin`);
      }
      await fetchUsers();
    } catch (err: any) {
      toast.error(err.message || "Erro ao alterar papel");
    }
    setToggling(null);
  }

  async function toggleMaster(targetUser: UserWithRole) {
    if (targetUser.id === user?.id) {
      toast.error("Você não pode alterar seu próprio papel de Master");
      return;
    }
    const isMasterUser = targetUser.status === "master";
    if (isMasterUser) {
      const mastersCount = users.filter((x) => x.status === "master").length;
      if (mastersCount <= 1) {
        toast.error("Deve existir ao menos um Admin Master");
        return;
      }
    }
    setTogglingMaster(targetUser.id);
    try {
      if (isMasterUser) {
        const { error } = await supabase
          .from("user_roles")
          .delete()
          .eq("user_id", targetUser.id)
          .eq("role", "master");
        if (error) throw error;
        toast.success(`Master removido de ${targetUser.responsible_name || targetUser.email}`);
      } else {
        if (!targetUser.is_admin) {
          const { error: errAdmin } = await supabase
            .from("user_roles")
            .insert({ user_id: targetUser.id, role: "admin" });
          if (errAdmin) throw errAdmin;
        }
        const { error } = await supabase
          .from("user_roles")
          .insert({ user_id: targetUser.id, role: "master" });
        if (error) throw error;
        toast.success(`${targetUser.responsible_name || targetUser.email} agora é Admin Master`);
      }
      await fetchUsers();
    } catch (err: any) {
      toast.error(err.message || "Erro ao alterar Master");
    }
    setTogglingMaster(null);
  }

  async function deleteUser(targetUser: UserWithRole) {
    if (targetUser.id === user?.id) {
      toast.error("Você não pode excluir a si mesmo");
      return;
    }
    setDeleting(targetUser.id);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        toast.error("Sessão expirada.");
        setDeleting(null);
        return;
      }

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/delete-user`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
            apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          },
          body: JSON.stringify({ user_id: targetUser.id }),
        }
      );

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err?.error || `Erro ${response.status}`);
      }

      toast.success(`Usuário ${targetUser.responsible_name || "removido"} excluído com sucesso`);
      await fetchUsers();
    } catch (err: any) {
      toast.error(err.message || "Erro ao excluir usuário");
    }
    setDeleting(null);
  }

  if (authLoading) return <LoadingState fullPage message="Verificando permissões..." />;
  if (!user || !isAdmin) return <Navigate to="/" replace />;

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      <SectionHeader 
        title="Gestão de Usuários" 
        subtitle="Controle de acessos, papéis administrativos e moderação da comunidade."
        rightElement={
          <div className="flex items-center gap-2 px-4 py-2 bg-muted/50 rounded-full border border-border">
            <Users className="h-4 w-4 text-primary" />
            <span className="text-sm font-bold">{users.length} usuários</span>
          </div>
        }
      />

      {loading ? (
        <LoadingState message="Carregando lista de usuários..." />
      ) : users.length === 0 ? (
        <EmptyState 
          icon={Users}
          title="Nenhum usuário encontrado"
          description="Ainda não há usuários cadastrados ou houve um erro na busca."
          actionLabel="Recarregar"
          onAction={() => fetchUsers()}
        />
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {users.map((u) => (
            <Card key={u.id} className="group hover:shadow-md transition-all duration-300 border-border bg-card overflow-hidden">
              <CardContent className="p-0">
                <div className="flex flex-col md:flex-row md:items-center p-4 sm:p-6 gap-6 relative">
                  {/* User Profile Info */}
                  <div className="flex-1 flex gap-4 min-w-0">
                    <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <User className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center gap-2 flex-wrap pr-10 md:pr-0">
                        {editingId === u.id ? (
                          <div className="flex items-center gap-2 w-full max-w-sm">
                            <Input
                              value={editName}
                              onChange={(e) => setEditName(e.target.value)}
                              className="h-9"
                              autoFocus
                              disabled={savingEdit}
                            />
                            <div className="flex gap-1 shrink-0">
                              <Button size="sm" className="h-9 w-9 p-0" onClick={() => saveEdit(u)} disabled={savingEdit}>
                                {savingEdit ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                              </Button>
                              <Button size="sm" variant="ghost" className="h-9 w-9 p-0" onClick={cancelEdit} disabled={savingEdit}>
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <>
                            <h3 className="text-base sm:text-lg font-bold text-foreground truncate max-w-[150px] xs:max-w-none">
                              {u.responsible_name || <span className="text-muted-foreground italic text-sm">Nome não definido</span>}
                            </h3>
                            <div className="flex items-center gap-1.5 flex-wrap">
                              {u.status && <StatusBadge role={u.status} />}
                              {isMaster && (
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="h-7 w-7 text-muted-foreground opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity"
                                  onClick={() => startEdit(u)}
                                >
                                  <Pencil className="h-3 w-3" />
                                </Button>
                              )}
                            </div>
                          </>
                        )}
                      </div>
                      
                      <div className="flex flex-col sm:flex-row sm:flex-wrap gap-x-4 gap-y-1 text-[11px] sm:text-sm text-muted-foreground">
                        <span className="flex items-center gap-1.5 truncate">
                          <Phone className="h-3 w-3 sm:h-3.5 sm:w-3.5 shrink-0" />
                          {formatPhone(u.phone)}
                        </span>
                        <span className="flex items-center gap-1.5 truncate">
                          <MapPin className="h-3 w-3 sm:h-3.5 sm:w-3.5 shrink-0" />
                          {u.address_neighborhood || <span className="text-rose-400 font-medium">Bairro?</span>}
                        </span>
                        {u.musical_preferences && u.musical_preferences.length > 0 && (
                          <span className="flex items-center gap-1.5 truncate">
                            <Music className="h-3 w-3 sm:h-3.5 sm:w-3.5 shrink-0" />
                            {u.musical_preferences.slice(0, 1).join(", ")}{u.musical_preferences.length > 1 && "..."}
                          </span>
                        )}
                      </div>
                      <p className="text-[9px] sm:text-[10px] text-muted-foreground/60 uppercase tracking-widest font-mono pt-1">
                        UID: {u.id.slice(0, 6)}... • {new Date(u.created_at).toLocaleDateString("pt-BR")}
                      </p>
                    </div>
                  </div>

                  {/* Desktop Actions */}
                  <div className="hidden md:flex items-center gap-2 justify-end shrink-0">
                    <Button
                      size="sm"
                      variant={u.is_admin ? "destructive" : "outline"}
                      disabled={toggling === u.id || u.id === user?.id}
                      className="rounded-full px-4 h-9 font-bold text-xs"
                      onClick={() => setShowAdminConfirm(u)}
                    >
                      {toggling === u.id ? <Loader2 className="h-4 w-4 animate-spin" /> : u.is_admin ? "Remover Admin" : "Tornar Admin"}
                    </Button>

                    {isMaster && (
                      <Button
                        size="sm"
                        variant={u.status === "master" ? "destructive" : "secondary"}
                        disabled={togglingMaster === u.id || u.id === user?.id}
                        className="rounded-full px-4 h-9 font-bold text-xs"
                        onClick={() => setShowMasterConfirm(u)}
                      >
                        {togglingMaster === u.id ? <Loader2 className="h-4 w-4 animate-spin" /> : u.status === "master" ? "Remover Master" : "Tornar Master"}
                      </Button>
                    )}

                    <Button
                      size="icon"
                      variant="ghost"
                      disabled={u.id === user?.id || deleting === u.id}
                      className="h-9 w-9 text-rose-500 hover:text-rose-600 hover:bg-rose-50 rounded-full"
                      onClick={() => setShowDeleteConfirm(u)}
                    >
                      {deleting === u.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                    </Button>
                  </div>

                  {/* Mobile Mobile Action Trigger (Dropdown style) */}
                  <div className="md:hidden absolute top-4 right-4">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-10 w-10 rounded-full">
                          <ChevronDown className="h-5 w-5 text-muted-foreground" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-56">
                        <DropdownMenuItem onClick={() => setShowAdminConfirm(u)} disabled={u.id === user?.id}>
                          {u.is_admin ? "Remover Admin" : "Tornar Admin"}
                        </DropdownMenuItem>
                        {isMaster && (
                          <DropdownMenuItem onClick={() => setShowMasterConfirm(u)} disabled={u.id === user?.id}>
                            {u.status === "master" ? "Remover Master" : "Tornar Master"}
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => setShowDeleteConfirm(u)} disabled={u.id === user?.id} className="text-rose-600 font-bold">
                          Excluir Usuário
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Modais de Confirmação Unificados */}
      <ConfirmModal 
        isOpen={!!showAdminConfirm}
        onClose={() => setShowAdminConfirm(null)}
        onConfirm={() => {
          if (showAdminConfirm) toggleAdmin(showAdminConfirm);
          setShowAdminConfirm(null);
        }}
        title="Alterar Papel Administrativo"
        description={`Deseja mesmo ${showAdminConfirm?.is_admin ? "remover" : "conceder"} privilégios de administrador para ${showAdminConfirm?.responsible_name || showAdminConfirm?.email}?`}
        confirmText="Confirmar Alteração"
        variant={showAdminConfirm?.is_admin ? "destructive" : "default"}
      />

      <ConfirmModal 
        isOpen={!!showMasterConfirm}
        onClose={() => setShowMasterConfirm(null)}
        onConfirm={() => {
          if (showMasterConfirm) toggleMaster(showMasterConfirm);
          setShowMasterConfirm(null);
        }}
        title="Controle Admin Master"
        description={`Esta é a permissão máxima do sistema. Confirmar ${showMasterConfirm?.status === 'master' ? "remoção" : "concessão"} de acesso Master para ${showMasterConfirm?.responsible_name || showMasterConfirm?.email}?`}
        confirmText="Confirmar Master"
        variant={showMasterConfirm?.status === 'master' ? "destructive" : "default"}
      />

      <ConfirmModal 
        isOpen={!!showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(null)}
        onConfirm={() => {
          if (showDeleteConfirm) deleteUser(showDeleteConfirm);
          setShowDeleteConfirm(null);
        }}
        title="Excluir Usuário"
        description="Esta ação é irreversível. Todos os dados, preferências e históricos deste usuário serão permanentemente removidos da plataforma."
        confirmText="Excluir Permanentemente"
        variant="destructive"
      />
    </div>
  );
}

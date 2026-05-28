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
                <div className="flex flex-col md:flex-row md:items-center p-4 sm:p-6 gap-6">
                  {/* User Profile Info */}
                  <div className="flex-1 flex gap-4 min-w-0">
                    <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <User className="h-6 w-6 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        {editingId === u.id ? (
                          <div className="flex items-center gap-2 w-full max-w-sm">
                            <Input
                              value={editName}
                              onChange={(e) => setEditName(e.target.value)}
                              className="h-9"
                              autoFocus
                              disabled={savingEdit}
                            />
                            <Button size="sm" onClick={() => saveEdit(u)} disabled={savingEdit}>
                              {savingEdit ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                            </Button>
                            <Button size="sm" variant="ghost" onClick={cancelEdit} disabled={savingEdit}>
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        ) : (
                          <>
                            <h3 className="text-lg font-bold text-foreground truncate">
                              {u.responsible_name || <span className="text-muted-foreground italic">Nome não definido</span>}
                            </h3>
                            {isMaster && (
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-8 w-8 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity"
                                onClick={() => startEdit(u)}
                              >
                                <Pencil className="h-3.5 w-3.5" />
                              </Button>
                            )}
                            {u.status && <StatusBadge role={u.status} />}
                          </>
                        )}
                      </div>
                      
                      <div className="flex flex-wrap gap-x-4 gap-y-1 items-center text-sm text-muted-foreground">
                        <span className="flex items-center gap-1.5">
                          <Phone className="h-3.5 w-3.5" />
                          {formatPhone(u.phone)}
                        </span>
                        <span className="flex items-center gap-1.5">
                          <MapPin className="h-3.5 w-3.5" />
                          {u.address_neighborhood || <span className="text-rose-400 font-medium">Bairro não definido</span>}
                        </span>
                        {u.musical_preferences && u.musical_preferences.length > 0 && (
                          <span className="flex items-center gap-1.5">
                            <Music className="h-3.5 w-3.5" />
                            {u.musical_preferences.slice(0, 2).join(", ")}
                            {u.musical_preferences.length > 2 && "..."}
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-muted-foreground/60 uppercase tracking-widest font-mono">
                        UID: {u.id.slice(0, 8)}... • Desde {new Date(u.created_at).toLocaleDateString("pt-BR")}
                      </p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 justify-end shrink-0">
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          size="sm"
                          variant={u.is_admin ? "destructive" : "outline"}
                          disabled={toggling === u.id || u.id === user?.id}
                          className="rounded-full px-4 h-9 font-bold"
                        >
                          {toggling === u.id ? <Loader2 className="h-4 w-4 animate-spin" /> : u.is_admin ? "Remover Admin" : "Tornar Admin"}
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent className="rounded-3xl">
                        <AlertDialogHeader>
                          <AlertDialogTitle>Confirmar alteração?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Deseja mesmo {u.is_admin ? "remover" : "conceder"} o papel de administrador para {u.responsible_name || u.email}?
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel className="rounded-full">Cancelar</AlertDialogCancel>
                          <AlertDialogAction 
                            onClick={() => toggleAdmin(u)}
                            className={cn("rounded-full", u.is_admin ? "bg-destructive text-destructive-foreground hover:bg-destructive/90" : "bg-primary text-primary-foreground")}
                          >
                            Confirmar
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>

                    {isMaster && (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            size="sm"
                            variant={u.status === "master" ? "destructive" : "secondary"}
                            disabled={togglingMaster === u.id || u.id === user?.id}
                            className="rounded-full px-4 h-9 font-bold"
                          >
                            {togglingMaster === u.id ? <Loader2 className="h-4 w-4 animate-spin" /> : u.status === "master" ? "Remover Master" : "Tornar Master"}
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent className="rounded-3xl">
                          <AlertDialogHeader>
                            <AlertDialogTitle>Controle Master</AlertDialogTitle>
                            <AlertDialogDescription>
                              Deseja mesmo {u.status === "master" ? "remover" : "conceder"} acesso Admin Master para {u.responsible_name || u.email}? Esta é a permissão máxima do sistema.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel className="rounded-full">Cancelar</AlertDialogCancel>
                            <AlertDialogAction onClick={() => toggleMaster(u)} className="rounded-full">
                              Confirmar
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    )}

                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          size="icon"
                          variant="ghost"
                          disabled={u.id === user?.id || deleting === u.id}
                          className="h-9 w-9 text-rose-500 hover:text-rose-600 hover:bg-rose-50 rounded-full"
                        >
                          {deleting === u.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent className="rounded-3xl">
                        <AlertDialogHeader>
                          <AlertDialogTitle className="text-rose-600">Excluir Usuário?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Esta ação é IRREVERSÍVEL. Todos os dados associados a este usuário serão removidos.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel className="rounded-full">Cancelar</AlertDialogCancel>
                          <AlertDialogAction 
                            onClick={() => deleteUser(u)} 
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90 rounded-full"
                          >
                            Excluir Permanentemente
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
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

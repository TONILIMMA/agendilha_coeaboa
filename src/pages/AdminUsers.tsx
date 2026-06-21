import { useEffect, useState, useMemo, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Navigate } from "react-router-dom";
import { useVirtualizer } from "@tanstack/react-virtual";
import { Button } from "@/components/ui/button";
import { Users, Download, Share2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { buildTempPasswordMessage } from "@/lib/whatsapp";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { LoadingState } from "@/components/ui/LoadingState";
import { EmptyState } from "@/components/ui/EmptyState";
import { callEdge } from "@/lib/edge";
import { exportUsersToPdf } from "@/lib/pdfExportUsers";
import {
  UserKpis,
  type UserKpisData,
} from "@/components/admin/users/UserKpis";
import {
  UserFiltersBar,
  type QuickChip,
} from "@/components/admin/users/UserFiltersBar";
import { UserCard } from "@/components/admin/users/UserCard";
import { ConfirmUserActionDialogs } from "@/components/admin/users/ConfirmUserActionDialogs";
import { ResetPasswordDialog } from "@/components/admin/users/ResetPasswordDialog";
import type {
  UserWithRole,
  ResetResultState,
} from "@/components/admin/users/types";

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
  const [showResetConfirm, setShowResetConfirm] = useState<UserWithRole | null>(null);
  const [resetting, setResetting] = useState<string | null>(null);
  const [resetResult, setResetResult] = useState<ResetResultState | null>(null);
  const [updatingType, setUpdatingType] = useState<string | null>(null);
  
  // Paginação
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;
  
  // Filtros
  const [filterType, setFilterType] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterSearch, setFilterSearch] = useState<string>("");
  const [filterPeriod, setFilterPeriod] = useState<string>("all"); // all, today, week, month

  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      // Hierarquia de Master
      if (!isMaster && (u.status === 'admin' || u.status === 'master')) return false;

      // Filtro de Busca (Nome ou Email)
      if (filterSearch && !u.responsible_name?.toLowerCase().includes(filterSearch.toLowerCase()) && !u.email?.toLowerCase().includes(filterSearch.toLowerCase())) return false;

      // Filtro de Tipo
      if (filterType !== "all" && u.user_type !== filterType) return false;

      // Filtro de Status
      if (filterStatus !== "all" && u.status !== filterStatus) return false;

      // Filtro de Período
      if (filterPeriod !== "all") {
        const createdAt = new Date(u.created_at);
        const now = new Date();
        if (filterPeriod === "today") {
          if (createdAt.toDateString() !== now.toDateString()) return false;
        } else if (filterPeriod === "week") {
          const weekAgo = new Date();
          weekAgo.setDate(now.getDate() - 7);
          if (createdAt < weekAgo) return false;
        } else if (filterPeriod === "month") {
          const monthAgo = new Date();
          monthAgo.setMonth(now.getMonth() - 1);
          if (createdAt < monthAgo) return false;
        }
      }

    return true;
    });
  }, [users, isMaster, filterSearch, filterType, filterStatus, filterPeriod]);

  // KPIs gerais (sobre todos os usuários visíveis para o admin atual)
  const visibleUsers = useMemo(
    () => (isMaster ? users : users.filter((u) => u.status !== 'admin' && u.status !== 'master')),
    [users, isMaster]
  );
  const kpis = useMemo(() => ({
    total: visibleUsers.length,
    publico: visibleUsers.filter((u) => (u.user_type || 'usuario') === 'usuario' && u.status === 'user').length,
    divulgadores: visibleUsers.filter((u) => u.status === 'collaborator' || u.user_type === 'divulgador' || u.user_type === 'promotor').length,
    artistas: visibleUsers.filter((u) => u.status === 'artist' || u.user_type === 'artist').length,
    admins: visibleUsers.filter((u) => u.status === 'admin' || u.status === 'master').length,
    semBairro: visibleUsers.filter((u) => !u.address_neighborhood).length,
  }), [visibleUsers]);

  // Chips de filtro rápido por status/papel
  const quickStatusChips: Array<{ key: string; label: string; count: number; color: string }> = useMemo(() => {
    const base = [
      { key: 'all', label: 'Todos', count: visibleUsers.length, color: 'bg-muted text-foreground' },
      { key: 'user', label: 'Público', count: visibleUsers.filter((u) => u.status === 'user').length, color: 'bg-blue-500/10 text-blue-700 border-blue-500/30' },
      { key: 'collaborator', label: 'Divulgador', count: visibleUsers.filter((u) => u.status === 'collaborator').length, color: 'bg-emerald-500/10 text-emerald-700 border-emerald-500/30' },
      { key: 'artist', label: 'Artista', count: visibleUsers.filter((u) => u.status === 'artist').length, color: 'bg-purple-500/10 text-purple-700 border-purple-500/30' },
    ];
    if (isMaster) {
      base.push(
        { key: 'admin', label: 'Admin', count: visibleUsers.filter((u) => u.status === 'admin').length, color: 'bg-amber-500/10 text-amber-700 border-amber-500/30' },
        { key: 'master', label: 'Master', count: visibleUsers.filter((u) => u.status === 'master').length, color: 'bg-rose-500/10 text-rose-700 border-rose-500/30' },
      );
    }
    return base;
  }, [visibleUsers, isMaster]);

  // Resetar página ao filtrar
  useEffect(() => {
    setCurrentPage(1);
  }, [filterSearch, filterType, filterStatus, filterPeriod]);

  const paginatedUsers = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredUsers.slice(start, start + itemsPerPage);
  }, [filteredUsers, currentPage]);

  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);

  // Virtualização para a lista paginada (caso os itens individuais sejam complexos)
  const parentRef = useRef<HTMLDivElement>(null);
  const rowVirtualizer = useVirtualizer({
    count: paginatedUsers.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 140, // Altura estimada de cada card
    overscan: 5,
  });

  const exportToPDF = useCallback(async () => {
    toast.info("Preparando PDF...");
    try {
      await exportUsersToPdf(filteredUsers);
      toast.success("PDF gerado com sucesso!");
    } catch (error) {
      console.error("Erro ao gerar PDF:", error);
      toast.error("Erro ao carregar gerador de PDF");
    }
  }, [filteredUsers]);

  const shareOnWhatsapp = useCallback(() => {
    const MAX_USERS = 50;
    const selectedUsers = filteredUsers.slice(0, MAX_USERS);
    
    let text = `*Relatório de Usuários Agendilha (${new Date().toLocaleDateString("pt-BR")})*\n`;
    text += `Total filtrado: ${filteredUsers.length} usuários\n\n`;
    
    text += selectedUsers.map((u, index) => 
      `${index + 1}. *${u.responsible_name || u.email}*\n   Tipo: ${u.user_type || 'usuario'}\n   Tel: ${formatPhone(u.phone)}`
    ).join("\n\n");
    
    if (filteredUsers.length > MAX_USERS) {
      text += `\n\n... e mais ${filteredUsers.length - MAX_USERS} usuários (limite de envio atingido).`;
    }
    
    const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url, "_blank");
  }, [filteredUsers]);

  async function updateUserType(targetUser: UserWithRole, newType: string) {
    setUpdatingType(targetUser.id);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ user_type: newType })
        .eq("user_id", targetUser.id);
      
      if (error) throw error;
      toast.success("Tipo de usuário atualizado");
      await fetchUsers();
    } catch (err: any) {
      toast.error(err.message || "Erro ao atualizar tipo");
    }
    setUpdatingType(null);
  }

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
      await callEdge("update-user", { user_id: targetUser.id, responsible_name: trimmed });
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
      const data = await callEdge<UserWithRole[]>("list-users");
      setUsers(data);
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
      await callEdge("delete-user", { user_id: targetUser.id });
      toast.success(`Usuário ${targetUser.responsible_name || "removido"} excluído com sucesso`);
      await fetchUsers();
    } catch (err: any) {
      toast.error(err.message || "Erro ao excluir usuário");
    }
    setDeleting(null);
  }

  async function resetPassword(targetUser: UserWithRole) {
    setResetting(targetUser.id);
    try {
      const data = await callEdge<{
        tempPassword: string;
        whatsappUrl: string | null;
        phone: string | null;
        phoneIsValid: boolean;
        recipientName: string | null;
      }>("admin-reset-password", { user_id: targetUser.id });
      const recipientName: string | null =
        data.recipientName ?? targetUser.responsible_name ?? null;
      const message = buildTempPasswordMessage({
        tempPassword: data.tempPassword,
        recipientName,
      });
      setResetResult({
        user: targetUser,
        tempPassword: data.tempPassword,
        whatsappUrl: data.whatsappUrl,
        phone: data.phone ?? null,
        phoneIsValid: !!data.phoneIsValid,
        recipientName,
        customNote: "",
        message,
      });
      toast.success("Senha temporária gerada");
    } catch (err: any) {
      toast.error(err.message || "Erro ao resetar senha");
    }
    setResetting(null);
  }

  if (authLoading) return <LoadingState fullPage message="Verificando permissões..." />;
  if (!user || !isAdmin) return <Navigate to="/" replace />;

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      <SectionHeader 
        title="Gestão de Usuários" 
        subtitle="Controle de acessos, papéis administrativos e moderação da comunidade."
        rightElement={
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                className="rounded-full gap-2 border-primary/20 hover:border-primary/50"
                onClick={exportToPDF}
              >
                <Download className="h-4 w-4" />
                PDF
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                className="rounded-full gap-2 border-emerald-500/20 hover:border-emerald-500/50 text-emerald-600"
                onClick={shareOnWhatsapp}
              >
                <Share2 className="h-4 w-4" />
                WhatsApp
              </Button>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-muted/50 rounded-full border border-border">
              <Users className="h-4 w-4 text-primary" />
              <span className="text-sm font-bold">{users.length} usuários</span>
            </div>
          </div>
        }
      />

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <Card className="border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground text-xs uppercase tracking-wider font-bold">
              <Users className="h-3.5 w-3.5" /> Total
            </div>
            <div className="text-2xl font-extrabold mt-1">{kpis.total}</div>
          </CardContent>
        </Card>
        <Card className="border-blue-500/30 bg-blue-500/5">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-blue-700 text-xs uppercase tracking-wider font-bold">
              <User className="h-3.5 w-3.5" /> Público
            </div>
            <div className="text-2xl font-extrabold mt-1 text-blue-700">{kpis.publico}</div>
          </CardContent>
        </Card>
        <Card className="border-emerald-500/30 bg-emerald-500/5">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-emerald-700 text-xs uppercase tracking-wider font-bold">
              <UserCheck className="h-3.5 w-3.5" /> Divulgadores
            </div>
            <div className="text-2xl font-extrabold mt-1 text-emerald-700">{kpis.divulgadores}</div>
          </CardContent>
        </Card>
        <Card className="border-purple-500/30 bg-purple-500/5">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-purple-700 text-xs uppercase tracking-wider font-bold">
              <Music className="h-3.5 w-3.5" /> Artistas
            </div>
            <div className="text-2xl font-extrabold mt-1 text-purple-700">{kpis.artistas}</div>
          </CardContent>
        </Card>
        <Card className={cn("border-amber-500/30 bg-amber-500/5", kpis.semBairro > 0 && "ring-1 ring-amber-500/40") }>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-amber-700 text-xs uppercase tracking-wider font-bold">
              <ShieldAlert className="h-3.5 w-3.5" /> Sem bairro
            </div>
            <div className="text-2xl font-extrabold mt-1 text-amber-700">{kpis.semBairro}</div>
          </CardContent>
        </Card>
      </div>

      {/* Chips de filtro rápido por papel */}
      <div className="flex flex-wrap gap-2">
        {quickStatusChips.map((chip) => {
          const active = filterStatus === chip.key;
          return (
            <button
              key={chip.key}
              onClick={() => setFilterStatus(chip.key)}
              className={cn(
                "inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold border transition-all",
                active
                  ? "bg-primary text-primary-foreground border-primary shadow-sm"
                  : chip.color + " hover:opacity-80",
              )}
            >
              {chip.label}
              <span className={cn(
                "inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full text-[10px] font-bold",
                active ? "bg-primary-foreground/20" : "bg-background/60"
              )}>
                {chip.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Filtros */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-card border border-border rounded-xl shadow-sm">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Buscar por nome ou email..." 
            className="pl-9"
            value={filterSearch}
            onChange={(e) => setFilterSearch(e.target.value)}
          />
        </div>
        
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-full">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <SelectValue placeholder="Tipo de Usuário" />
            </div>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os Tipos</SelectItem>
            <SelectItem value="usuario">Usuário</SelectItem>
            <SelectItem value="promotor">Promotor</SelectItem>
            <SelectItem value="divulgador">Divulgador</SelectItem>
            <SelectItem value="estabelecimento">Estabelecimento</SelectItem>
            <SelectItem value="artist">Músico / Artista</SelectItem>
          </SelectContent>
        </Select>

        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-full">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <SelectValue placeholder="Status/Papel" />
            </div>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os Status</SelectItem>
            <SelectItem value="user">Público</SelectItem>
            <SelectItem value="collaborator">Divulgador</SelectItem>
            <SelectItem value="artist">Artista</SelectItem>
            {isMaster && (
              <>
                <SelectItem value="admin">Administrador</SelectItem>
                <SelectItem value="master">Admin Master</SelectItem>
              </>
            )}
          </SelectContent>
        </Select>

        <Select value={filterPeriod} onValueChange={setFilterPeriod}>
          <SelectTrigger className="w-full">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <SelectValue placeholder="Período" />
            </div>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todo o Período</SelectItem>
            <SelectItem value="today">Hoje</SelectItem>
            <SelectItem value="week">Última Semana</SelectItem>
            <SelectItem value="month">Último Mês</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <LoadingState message="Carregando lista de usuários..." />
      ) : filteredUsers.length === 0 ? (
        <EmptyState 
          icon={Users}
          title="Nenhum usuário encontrado"
          description={filterSearch || filterType !== "all" || filterStatus !== "all" || filterPeriod !== "all" 
            ? "Tente ajustar os filtros para encontrar o que procura." 
            : "Ainda não há usuários cadastrados ou houve um erro na busca."}
          actionLabel="Limpar Filtros"
          onAction={() => {
            setFilterSearch("");
            setFilterType("all");
            setFilterStatus("all");
            setFilterPeriod("all");
          }}
        />
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-4" ref={parentRef}>
            <div
              style={{
                height: `${rowVirtualizer.getTotalSize()}px`,
                width: '100%',
                position: 'relative',
              }}
            >
              {rowVirtualizer.getVirtualItems().map((virtualRow) => {
                const u = paginatedUsers[virtualRow.index];
                return (
                  <div
                    key={virtualRow.key}
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      height: `${virtualRow.size}px`,
                      transform: `translateY(${virtualRow.start}px)`,
                    }}
                    className="pb-4"
                  >
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
                              {u.user_type && u.user_type !== 'usuario' && (
                                <Badge variant="secondary" className="text-[10px] uppercase font-bold tracking-widest px-2 py-0">
                                  {u.user_type}
                                </Badge>
                              )}
                              {(isMaster || (!u.is_admin && u.status !== 'master')) && (
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
                    {u.phone && isValidBrazilianMobile(u.phone) && (
                      <Button
                        size="icon"
                        variant="ghost"
                        title="Falar no WhatsApp"
                        className="h-9 w-9 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-full"
                        onClick={() => window.open(buildWhatsappUrl(u.phone!, `Olá ${u.responsible_name || ''}!`), '_blank')}
                      >
                        <MessageSquare className="h-4 w-4" />
                      </Button>
                    )}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="rounded-full px-4 h-9 font-bold text-xs gap-2"
                          disabled={updatingType === u.id}
                        >
                          {updatingType === u.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Users className="h-3 w-3" />}
                          Tipo: {u.user_type || 'usuario'}
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        <DropdownMenuItem onClick={() => updateUserType(u, 'usuario')}>Usuário</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => updateUserType(u, 'promotor')}>Promotor</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => updateUserType(u, 'divulgador')}>Divulgador</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => updateUserType(u, 'estabelecimento')}>Estabelecimento</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>

                    {isMaster && (
                      <Button
                        size="sm"
                        variant={u.is_admin ? "destructive" : "outline"}
                        disabled={toggling === u.id || u.id === user?.id}
                        className="rounded-full px-4 h-9 font-bold text-xs"
                        onClick={() => setShowAdminConfirm(u)}
                      >
                        {toggling === u.id ? <Loader2 className="h-4 w-4 animate-spin" /> : u.is_admin ? "Remover Admin" : "Tornar Admin"}
                      </Button>
                    )}

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
                      disabled={u.id === user?.id || deleting === u.id || (!isMaster && (u.is_admin || u.status === 'master'))}
                      className="h-9 w-9 text-rose-500 hover:text-rose-600 hover:bg-rose-50 rounded-full"
                      onClick={() => setShowDeleteConfirm(u)}
                    >
                      {deleting === u.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      disabled={resetting === u.id || (!isMaster && (u.is_admin || u.status === 'master'))}
                      title="Resetar senha"
                      className="h-9 w-9 text-amber-600 hover:text-amber-700 hover:bg-amber-50 rounded-full"
                      onClick={() => setShowResetConfirm(u)}
                    >
                      {resetting === u.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <KeyRound className="h-4 w-4" />}
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
                        <DropdownMenuSeparator />
                        {u.phone && isValidBrazilianMobile(u.phone) && (
                          <>
                            <DropdownMenuItem onClick={() => window.open(buildWhatsappUrl(u.phone!, `Olá ${u.responsible_name || ''}!`), '_blank')} className="text-emerald-600 font-semibold">
                              <MessageSquare className="h-4 w-4 mr-2" />
                              Falar no WhatsApp
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                          </>
                        )}
                        <DropdownMenuItem disabled className="text-[10px] font-bold uppercase tracking-wider opacity-50">Alterar Tipo</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => updateUserType(u, 'usuario')}>Tornar Usuário</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => updateUserType(u, 'promotor')}>Tornar Promotor</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => updateUserType(u, 'divulgador')}>Tornar Divulgador</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => updateUserType(u, 'estabelecimento')}>Tornar Estabelecimento</DropdownMenuItem>
                        <DropdownMenuSeparator />
                        {isMaster && (
                          <DropdownMenuItem onClick={() => setShowAdminConfirm(u)} disabled={u.id === user?.id}>
                            {u.is_admin ? "Remover Admin" : "Tornar Admin"}
                          </DropdownMenuItem>
                        )}
                        {isMaster && (
                          <DropdownMenuItem onClick={() => setShowMasterConfirm(u)} disabled={u.id === user?.id}>
                            {u.status === "master" ? "Remover Master" : "Tornar Master"}
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => setShowResetConfirm(u)}>
                          <KeyRound className="h-4 w-4 mr-2" />
                          Resetar senha
                        </DropdownMenuItem>
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
                  </div>
                );
              })}
            </div>
          </div>
          
          {/* Paginação */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
              >
                Anterior
              </Button>
              <div className="flex items-center gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter(p => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
                  .map((p, i, arr) => (
                    <div key={p} className="flex items-center">
                      {i > 0 && arr[i-1] !== p - 1 && <span className="px-1">...</span>}
                      <Button
                        variant={currentPage === p ? "default" : "outline"}
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={() => setCurrentPage(p)}
                      >
                        {p}
                      </Button>
                    </div>
                  ))}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
              >
                Próxima
              </Button>
            </div>
          )}
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

      <ConfirmModal
        isOpen={!!showResetConfirm}
        onClose={() => setShowResetConfirm(null)}
        onConfirm={() => {
          if (showResetConfirm) resetPassword(showResetConfirm);
          setShowResetConfirm(null);
        }}
        title="Resetar senha do usuário"
        description={`Será gerada uma senha temporária para ${showResetConfirm?.responsible_name || showResetConfirm?.email}. A senha atual deixará de funcionar imediatamente e o usuário precisará trocá-la no próximo login.`}
        confirmText="Gerar senha temporária"
      />

      <Dialog
        open={!!resetResult}
        onOpenChange={(open) => !open && setResetResult(null)}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <KeyRound className="h-5 w-5 text-primary" />
              Senha temporária gerada
            </DialogTitle>
            <DialogDescription>
              Copie ou envie pelo WhatsApp agora. Por segurança, esta senha
              só aparece uma vez.
            </DialogDescription>
          </DialogHeader>

          {resetResult && (
            <div className="space-y-4">
              <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 space-y-3">
                <p className="text-xs text-muted-foreground uppercase tracking-wider font-bold">
                  Para: {resetResult.user.responsible_name || resetResult.user.email}
                </p>
                <p className="text-2xl font-bold tracking-widest text-center text-foreground font-mono py-2 select-all break-all">
                  {resetResult.tempPassword}
                </p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => {
                    navigator.clipboard.writeText(resetResult.tempPassword);
                    toast.success("Senha copiada!");
                  }}
                >
                  <Copy className="mr-2 h-4 w-4" />
                  Copiar senha
                </Button>
              </div>

              <div className="rounded-lg border border-border bg-muted/20 p-3 text-xs space-y-1">
                <p className="flex items-center gap-1">
                  <strong>WhatsApp:</strong>{" "}
                  {resetResult.phone
                    ? formatPhoneDisplay(resetResult.phone)
                    : "—"}{" "}
                  {resetResult.phoneIsValid ? (
                    <span className="text-emerald-600 inline-flex items-center gap-0.5">
                      <CheckCircle2 className="h-3 w-3" /> válido
                    </span>
                  ) : (
                    <span className="text-destructive inline-flex items-center gap-0.5">
                      <AlertCircle className="h-3 w-3" /> inválido
                    </span>
                  )}
                </p>
                {!resetResult.phoneIsValid && (
                  <p className="text-amber-700">
                    Telefone ausente ou fora do padrão BR (DDD + 9XXXX-XXXX).
                    Envie por outro canal ou atualize o cadastro.
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-xs font-medium">
                  Instruções extras (opcional)
                </label>
                <Input
                  value={resetResult.customNote}
                  maxLength={500}
                  placeholder="Ex.: Use até hoje 18h. Dúvidas: fale com Daniel."
                  onChange={(e) => {
                    const customNote = e.target.value;
                    setResetResult({
                      ...resetResult,
                      customNote,
                      message: buildTempPasswordMessage({
                        tempPassword: resetResult.tempPassword,
                        recipientName: resetResult.recipientName,
                        customNote,
                      }),
                    });
                  }}
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-medium">
                  Mensagem (edite se quiser)
                </label>
                <Textarea
                  rows={7}
                  value={resetResult.message}
                  onChange={(e) =>
                    setResetResult({ ...resetResult, message: e.target.value })
                  }
                  className="text-xs font-mono bg-muted/30"
                />
              </div>

              {(() => {
                const liveUrl = resetResult.phone
                  ? buildWhatsappUrl(resetResult.phone, resetResult.message)
                  : null;
                return liveUrl ? (
                  <Button
                    asChild
                    className="w-full h-11 bg-[#25D366] hover:bg-[#1ebe5b] text-white font-bold"
                  >
                    <a href={liveUrl} target="_blank" rel="noreferrer">
                      <MessageCircle className="mr-2 h-4 w-4" />
                      Enviar pelo WhatsApp
                    </a>
                  </Button>
                ) : (
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full h-11"
                    onClick={() => {
                      navigator.clipboard.writeText(resetResult.message);
                      toast.success("Mensagem copiada — envie por outro canal");
                    }}
                  >
                    <Copy className="mr-2 h-4 w-4" />
                    Copiar mensagem
                  </Button>
                );
              })()}
            </div>
          )}

          <DialogFooter>
            <Button variant="ghost" onClick={() => setResetResult(null)}>
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

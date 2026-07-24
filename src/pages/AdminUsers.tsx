import { useEffect, useState, useMemo, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Navigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Users, Download, Share2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { buildTempPasswordMessage, formatPhoneDisplay } from "@/lib/whatsapp";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { LoadingState } from "@/components/ui/LoadingState";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageContainer } from "@/components/ui/PageContainer";
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

function formatPhone(phone: string | null): string {
  if (!phone) return "Não informado";
  return formatPhoneDisplay(phone);
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
    <PageContainer className="space-y-8" maxWidth="5xl">
      <SectionHeader 
        title="Gestão de Usuários" 
        subtitle="Controle de acessos, papéis administrativos e moderação da comunidade."
        rightElement={
          <div className="flex items-center gap-2 flex-wrap">
            <Button
              variant="outline"
              size="sm"
              aria-label="Exportar PDF"
              className="rounded-full gap-2 border-primary/20 hover:border-primary/50 px-3 sm:px-4"
              onClick={exportToPDF}
            >
              <Download className="h-4 w-4" />
              <span className="hidden sm:inline">PDF</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              aria-label="Compartilhar no WhatsApp"
              className="rounded-full gap-2 border-emerald-500/20 hover:border-emerald-500/50 text-emerald-600 px-3 sm:px-4"
              onClick={shareOnWhatsapp}
            >
              <Share2 className="h-4 w-4" />
              <span className="hidden sm:inline">WhatsApp</span>
            </Button>
            <div className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-muted/50 rounded-full border border-border">
              <Users className="h-4 w-4 text-primary shrink-0" />
              <span className="text-sm font-bold whitespace-nowrap">
                {users.length}
                <span className="hidden sm:inline"> usuários</span>
              </span>
            </div>
          </div>
        }
      />

      {/* KPIs */}
      <UserKpis kpis={kpis as UserKpisData} />

      <UserFiltersBar
        isMaster={isMaster}
        chips={quickStatusChips as QuickChip[]}
        filterSearch={filterSearch}
        setFilterSearch={setFilterSearch}
        filterType={filterType}
        setFilterType={setFilterType}
        filterStatus={filterStatus}
        setFilterStatus={setFilterStatus}
        filterPeriod={filterPeriod}
        setFilterPeriod={setFilterPeriod}
      />

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
          <div className="grid grid-cols-1 gap-4">
            {paginatedUsers.map((u) => (
              <UserCard
                key={u.id}
                u={u}
                currentUserId={user?.id}
                isMaster={isMaster}
                editingId={editingId}
                editName={editName}
                savingEdit={savingEdit}
                setEditName={setEditName}
                onStartEdit={startEdit}
                onCancelEdit={cancelEdit}
                onSaveEdit={saveEdit}
                toggling={toggling}
                togglingMaster={togglingMaster}
                deleting={deleting}
                resetting={resetting}
                updatingType={updatingType}
                onUpdateType={updateUserType}
                onAskToggleAdmin={setShowAdminConfirm}
                onAskToggleMaster={setShowMasterConfirm}
                onAskDelete={setShowDeleteConfirm}
                onAskReset={setShowResetConfirm}
              />
            ))}
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

      <ConfirmUserActionDialogs
        adminTarget={showAdminConfirm}
        setAdminTarget={setShowAdminConfirm}
        onConfirmAdmin={toggleAdmin}
        masterTarget={showMasterConfirm}
        setMasterTarget={setShowMasterConfirm}
        onConfirmMaster={toggleMaster}
        deleteTarget={showDeleteConfirm}
        setDeleteTarget={setShowDeleteConfirm}
        onConfirmDelete={deleteUser}
        resetTarget={showResetConfirm}
        setResetTarget={setShowResetConfirm}
        onConfirmReset={resetPassword}
      />

      <ResetPasswordDialog
        resetResult={resetResult}
        setResetResult={setResetResult}
      />
    </PageContainer>
  );
}

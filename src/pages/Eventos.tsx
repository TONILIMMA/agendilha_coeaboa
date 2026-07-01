import { useEffect, useMemo, useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useAppPermissions as usePermissions } from "@/hooks/usePermissions";
import { useSubmissions as useSubmissionsQuery } from "@/data";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  CalendarDays, CheckCircle, Clock, Copy, FileDown, FileText, Loader2,
  Megaphone, MessageCircle, Search, Send, Trash2, Kanban, AlertTriangle,
} from "lucide-react";
import { toast } from "sonner";
import { exportBulkEventsPdf, exportEditorialAgendaPdf } from "@/lib/pdfExport";
import { buildBulkWhatsAppMessage } from "@/lib/eventWhatsapp";
import {
  categoryLabels, getWeekRange, parseEventDate, type Submission, EDITORIAL_STAGES, type EditorialStatus,
} from "@/components/events-admin/types";
import { EventCard } from "@/components/events-admin/EventCard";
import { useEventActions } from "@/components/events-admin/useEventActions";
import { useAuditLogs } from "@/components/events-admin/useAuditLogs";
import { KanbanBoard } from "@/components/events-admin/KanbanBoard";
import { PipelineMetrics } from "@/components/events-admin/PipelineMetrics";
import { PublicationLogTable } from "@/components/events-admin/PublicationLogTable";

export default function Eventos() {
  const { user, isAdmin, loading: authLoading } = useAuth();
  const permissions = usePermissions();
  const { data: fetchedSubmissions = [], isLoading: loading } =
    useSubmissionsQuery<Submission>({}, { enabled: !!user });
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  useEffect(() => { setSubmissions(fetchedSubmissions); }, [fetchedSubmissions]);

  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [editorialFilter, setEditorialFilter] = useState<string>("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("pending");

  const { auditLogs, fetchAuditLog } = useAuditLogs();
  const actions = useEventActions({
    userId: user?.id,
    submissions,
    setSubmissions,
    onCollapse: () => setExpandedId(null),
  });

  const activeSubmissions = submissions.filter(s => !s.deleted_at);
  const trashedSubmissions = submissions.filter(s => !!s.deleted_at);
  const pendingEvents = activeSubmissions.filter(s => s.status === "pending");
  const confirmedEvents = activeSubmissions.filter(s => s.status === "approved");
  const pendingPublish = activeSubmissions.filter(s => (s.editorial_status as string) === "pronto_divulgar");

  const getFiltered = (list: Submission[]) => {
    let result = [...list];
    if (categoryFilter !== "all") result = result.filter(s => s.category === categoryFilter);
    if (editorialFilter !== "all") result = result.filter(s => (s.editorial_status || "recebido") === editorialFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(s =>
        s.event_title.toLowerCase().includes(q) ||
        (s.company_name || "").toLowerCase().includes(q) ||
        (s.location || "").toLowerCase().includes(q) ||
        (s.responsible_name || "").toLowerCase().includes(q)
      );
    }
    return result;
  };

  const filteredPending = useMemo(() => getFiltered(pendingEvents), [pendingEvents, categoryFilter, editorialFilter, search]);
  const filteredConfirmed = useMemo(() => getFiltered(confirmedEvents), [confirmedEvents, categoryFilter, editorialFilter, search]);
  const filteredTrash = useMemo(() => getFiltered(trashedSubmissions), [trashedSubmissions, categoryFilter, editorialFilter, search]);
  const filteredActive = useMemo(() => getFiltered(activeSubmissions), [activeSubmissions, categoryFilter, editorialFilter, search]);
  const canManageEvents = isAdmin || permissions.isAdmin;
  const canApproveEvents = canManageEvents || permissions.canApprove;
  const canDeleteEvents = canManageEvents || permissions.canDelete;

  if (authLoading) {
    return <div className="flex items-center justify-center min-h-[60vh]"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }
  if (!user) return null;

  const renderCard = (sub: Submission, options: { showApproval?: boolean; showTrashActions?: boolean } = {}) => (
    <EventCard
      key={sub.id}
      sub={sub}
      isExpanded={expandedId === sub.id}
      onToggleExpand={() => {
        const newId = expandedId === sub.id ? null : sub.id;
        setExpandedId(newId);
        if (newId) fetchAuditLog(newId);
      }}
      isAdmin={canManageEvents}
      auditLog={auditLogs[sub.id]}
      showApproval={options.showApproval}
      showTrashActions={options.showTrashActions}
      onStatusChange={actions.handleStatusChange}
      onHighlightToggle={actions.handleHighlightToggle}
      onSoftDelete={actions.handleSoftDelete}
      onRestore={actions.handleRestore}
      onPermanentDelete={actions.handlePermanentDelete}
      onEditorialChange={actions.handleEditorialChange}
      onLogPublication={actions.handleLogPublication}
    />
  );

  const renderList = (list: Submission[], options: { showApproval?: boolean; showTrashActions?: boolean } = {}) => {
    if (loading) {
      return <div className="flex justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
    }
    if (list.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <CalendarDays className="h-12 w-12 text-muted-foreground/40 mb-3" />
          <p className="text-muted-foreground text-sm">Nenhum rolê por aqui ainda. Tenta ajustar os filtros ou volta mais tarde.</p>
        </div>
      );
    }
    return <div className="space-y-4">{list.map(s => renderCard(s, options))}</div>;
  };

  if (!permissions.loaded) {
    return <div className="flex items-center justify-center min-h-[60vh]"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }
  if (!canManageEvents && !permissions.isCollaborator) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="mx-auto max-w-5xl px-3 sm:px-4 py-4 sm:py-6">
      <div className="mb-5 sm:mb-6 rounded-2xl border border-border bg-card/60 backdrop-blur-md p-4 sm:p-5 shadow-sm animate-in fade-in duration-300">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
              <CalendarDays className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-display font-bold text-foreground leading-tight">Envios</h1>
              <p className="text-xs text-muted-foreground">Painel de controle e moderação</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            <Button
              size="sm"
              variant="outline"
              onClick={() => { exportBulkEventsPdf(confirmedEvents as any); toast.success("PDF gerado!"); }}
              disabled={confirmedEvents.length === 0}
              className="text-xs rounded-full flex-1 sm:flex-none"
            >
              <FileDown className="mr-1.5 h-3.5 w-3.5" />
              <span className="hidden sm:inline">Exportar Confirmados</span>
              <span className="sm:hidden">PDF</span>
            </Button>
            {isAdmin && (
              <Button
                size="sm"
                onClick={() => {
                  const { start, end } = getWeekRange();
                  const weekApproved = confirmedEvents.filter(s => {
                    if (!s.date) return false;
                    const d = parseEventDate(s.date);
                    return d && d >= start && d <= end;
                  });
                  if (weekApproved.length === 0) {
                    toast.warning("Nenhum rolê confirmado pra essa semana ainda.");
                    return;
                  }
                  const msg = buildBulkWhatsAppMessage(weekApproved);
                  window.open(`https://wa.me/?text=${msg}`, "_blank");
                  toast.success(`Mensagem com ${weekApproved.length} evento(s) da semana!`);
                }}
                className="text-xs rounded-full bg-primary text-primary-foreground hover:bg-primary/90 flex-1 sm:flex-none"
              >
                <Send className="mr-1.5 h-3.5 w-3.5" />
                Divulgar semana
              </Button>
            )}
          </div>
        </div>

        <div className="mt-5 grid grid-cols-2 sm:grid-cols-4 gap-3">
          <button
            onClick={() => setActiveTab("pending")}
            className={`text-left rounded-xl border p-3 transition-all hover:scale-[1.02] active:scale-[0.98] ${
              activeTab === "pending"
                ? "bg-[hsl(45,93%,47%)]/10 border-[hsl(45,93%,47%)]/40 ring-2 ring-[hsl(45,93%,47%)]/30"
                : "bg-background/60 border-border hover:border-[hsl(45,93%,47%)]/30"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">Pendentes</span>
              <Clock className="h-3.5 w-3.5 text-[hsl(35,90%,40%)]" />
            </div>
            <div className="mt-1 text-2xl font-display font-bold text-foreground">{pendingEvents.length}</div>
          </button>
          <button
            onClick={() => { setActiveTab("kanban"); setEditorialFilter("pronto_divulgar"); }}
            className={`text-left rounded-xl border p-3 transition-all hover:scale-[1.02] active:scale-[0.98] ${
              pendingPublish.length > 0
                ? "bg-orange-100/60 border-orange-400/60 ring-2 ring-orange-400/30 dark:bg-orange-900/20"
                : "bg-background/60 border-border hover:border-orange-400/30"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">Prontos p/ divulgar</span>
              <AlertTriangle className="h-3.5 w-3.5 text-orange-500" />
            </div>
            <div className="mt-1 text-2xl font-display font-bold text-foreground">{pendingPublish.length}</div>
          </button>
          <button
            onClick={() => setActiveTab("confirmed")}
            className={`text-left rounded-xl border p-3 transition-all hover:scale-[1.02] active:scale-[0.98] ${
              activeTab === "confirmed"
                ? "bg-primary/10 border-primary/40 ring-2 ring-primary/30"
                : "bg-background/60 border-border hover:border-primary/30"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">Confirmados</span>
              <CheckCircle className="h-3.5 w-3.5 text-primary" />
            </div>
            <div className="mt-1 text-2xl font-display font-bold text-foreground">{confirmedEvents.length}</div>
          </button>
          {(isAdmin || permissions.canDelete) && (
            <button
              onClick={() => setActiveTab("trash")}
              className={`text-left rounded-xl border p-3 transition-all hover:scale-[1.02] active:scale-[0.98] col-span-2 sm:col-span-1 ${
                activeTab === "trash"
                  ? "bg-muted border-border ring-2 ring-muted-foreground/20"
                  : "bg-background/60 border-border hover:border-muted-foreground/30"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">Lixeira</span>
                <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
              </div>
              <div className="mt-1 text-2xl font-display font-bold text-foreground">{trashedSubmissions.length}</div>
            </button>
          )}
        </div>
      </div>

      <Card className="mb-5 border-border">
        <CardContent className="p-3 sm:p-4">
          <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto_auto] gap-2 sm:gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por título, empresa, local..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 h-10"
              />
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-full sm:w-[170px] h-10">
                <SelectValue placeholder="Categoria" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas categorias</SelectItem>
                {Object.entries(categoryLabels).map(([k, v]) => (
                  <SelectItem key={k} value={k}>{v}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={editorialFilter} onValueChange={setEditorialFilter}>
              <SelectTrigger className="w-full sm:w-[190px] h-10">
                <SelectValue placeholder="Etapa editorial" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas etapas</SelectItem>
                {EDITORIAL_STAGES.map(s => (
                  <SelectItem key={s.key} value={s.key}>{s.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <div className="-mx-3 sm:mx-0 overflow-x-auto sm:overflow-visible">
          <TabsList className="inline-flex sm:grid sm:w-full sm:grid-cols-5 px-3 sm:px-0 gap-1 sm:gap-0">
            <TabsTrigger value="kanban" className="text-xs sm:text-sm whitespace-nowrap">
              <Kanban className="h-3.5 w-3.5 mr-1" /> Kanban
            </TabsTrigger>
            <TabsTrigger value="marketing" className="text-xs sm:text-sm whitespace-nowrap">📣 Divulgação</TabsTrigger>
            <TabsTrigger value="pending" className="text-xs sm:text-sm whitespace-nowrap">
              A liberar
              <Badge variant="secondary" className="ml-1.5 text-xs">{pendingEvents.length}</Badge>
            </TabsTrigger>
            <TabsTrigger value="confirmed" className="text-xs sm:text-sm whitespace-nowrap">
              Confirmados
              <Badge variant="secondary" className="ml-1.5 text-xs">{confirmedEvents.length}</Badge>
            </TabsTrigger>
            {(isAdmin || permissions.canDelete) && (
              <TabsTrigger value="trash" className="text-xs sm:text-sm whitespace-nowrap">
                🗑️ Lixeira
                <Badge variant="secondary" className="ml-1.5 text-xs">{trashedSubmissions.length}</Badge>
              </TabsTrigger>
            )}
          </TabsList>
        </div>

        <TabsContent value="kanban">
          <div className="mb-4 grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2"><PipelineMetrics /></div>
            <PublicationLogTable />
          </div>
          <Card className="border-border">
            <CardContent className="p-3">
              <KanbanBoard
                submissions={filteredActive}
                selectedId={expandedId}
                onSelect={(s) => {
                  setExpandedId(s.id);
                  fetchAuditLog(s.id);
                }}
              />
            </CardContent>
          </Card>
          {expandedId && (() => {
            const sub = activeSubmissions.find(s => s.id === expandedId);
            return sub ? <div className="mt-4">{renderCard(sub, { showApproval: sub.status === "pending" })}</div> : null;
          })()}
        </TabsContent>

        <TabsContent value="marketing" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardContent className="p-5 space-y-4">
                <div className="flex items-center gap-2 mb-2">
                  <FileText className="h-5 w-5 text-primary" />
                  <h3 className="font-bold">Gerar Agenda (PDF)</h3>
                </div>
                <p className="text-sm text-muted-foreground">Crie um PDF editorial pronto para compartilhamento com capa e destaques.</p>
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const today = new Date().toISOString().split('T')[0];
                      const dayEvents = confirmedEvents.filter(e => e.date === today || e.date === new Date().toLocaleDateString('pt-BR'));
                      exportEditorialAgendaPdf(dayEvents as any, "Agenda do Dia");
                      toast.success("PDF da agenda do dia gerado!");
                    }}
                  >
                    <CalendarDays className="mr-2 h-4 w-4" />
                    Agenda do Dia
                  </Button>
                  <Button
                    variant="default"
                    size="sm"
                    onClick={() => {
                      exportEditorialAgendaPdf(confirmedEvents as any, "Agenda da Semana");
                      toast.success("PDF da agenda completa gerado!");
                    }}
                  >
                    <FileDown className="mr-2 h-4 w-4" />
                    Agenda Completa
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-5 space-y-4">
                <div className="flex items-center gap-2 mb-2">
                  <MessageCircle className="h-5 w-5 text-[#25D366]" />
                  <h3 className="font-bold">WhatsApp Marketing</h3>
                </div>
                <p className="text-sm text-muted-foreground">Copie o texto pronto com os destaques para enviar em grupos.</p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const text = decodeURIComponent(buildBulkWhatsAppMessage(confirmedEvents));
                    navigator.clipboard.writeText(text);
                    toast.success("Texto copiado para a área de transferência!");
                  }}
                >
                  <Copy className="mr-2 h-4 w-4" />
                  Copiar Texto p/ WhatsApp
                </Button>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold flex items-center gap-2">
                <Megaphone className="h-5 w-5 text-amber-500" />
                Eventos em Destaque
              </h3>
              <Badge variant="secondary">{confirmedEvents.filter(e => e.is_highlight).length} Ativos</Badge>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {confirmedEvents.filter(e => e.is_highlight).map(ev => renderCard(ev))}
              {confirmedEvents.filter(e => e.is_highlight).length === 0 && (
                <div className="col-span-full py-10 text-center border-2 border-dashed rounded-xl text-muted-foreground">
                  Nenhum rolê em destaque por enquanto.
                </div>
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="pending">
          {!canApproveEvents ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <p className="text-muted-foreground text-sm">Você não tem permissão para aprovar eventos.</p>
            </div>
          ) : (
            renderList(filteredPending, { showApproval: true })
          )}
        </TabsContent>

        <TabsContent value="confirmed">
          {renderList(filteredConfirmed)}
        </TabsContent>

        {canDeleteEvents && (
          <TabsContent value="trash">
            <div className="mb-3">
              <p className="text-xs text-muted-foreground">Eventos na lixeira são excluídos definitivamente após 30 dias.</p>
            </div>
            {renderList(filteredTrash, { showTrashActions: true })}
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
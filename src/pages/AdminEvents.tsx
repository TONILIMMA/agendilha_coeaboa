import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Navigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Tooltip, TooltipContent, TooltipProvider, TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  CalendarDays, Loader2, MessageCircle, Trash2, Search,
  FileDown, SlidersHorizontal, MapPin, Clock, Building2,
  CheckCircle, XCircle, Clock3, ChevronDown, ChevronUp, AlertCircle, ShieldAlert,
  Phone, Mail, Globe, Info, Send, Star, TrendingUp, BarChart3,
  RotateCcw, LayoutDashboard, Edit, ExternalLink, Eye, History, Megaphone, Copy, Share2
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { exportSingleEventPdf, exportBulkEventsPdf } from "@/lib/pdfExport";
import { useAppPermissions } from "@/hooks/useAppPermissions";
import { handleError } from "@/lib/error-handler";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { LoadingState } from "@/components/ui/LoadingState";
import { PageContainer } from "@/components/ui/PageContainer";
import { buildWhatsappUrl, validateBrazilianMobile, formatPhoneDisplay, renderTemplate } from "@/lib/whatsapp";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { buildTodayWhatsAppSummary, buildWeekWhatsAppSummary, openWhatsAppWithText } from "@/lib/todayWhatsappSummary";
import { generateFallbackFlyer } from "@/lib/generateFallbackFlyer";
import { SectionErrorBoundary } from "@/components/errors/SectionErrorBoundary";
import { missingPublishFields, shouldOfferGenericFlyer } from "@/lib/publishValidation";
import { PublishBlockDialog, type PublishBlockInfo } from "@/components/events-admin/PublishBlockDialog";
import { ChangeRequestsPanel } from "@/components/events-admin/ChangeRequestsPanel";


import {
  type AdminSubmission as Submission,
  categoryLabels,
  statusConfig,
  formatSubmissionDate,
  formatEventDate,
  buildWhatsAppMessage,
  buildApprovalMessage,
  buildRejectionMessage,
  buildTemplateVars,
  computeKpis,
  filterSubmissions,
} from "@/components/events-admin/adminEventsHelpers";
import { AdminEventsToolbar } from "@/components/events-admin/AdminEventsToolbar";
import { AdminEventsKpis } from "@/components/events-admin/AdminEventsKpis";
import { AdminEventsFilters } from "@/components/events-admin/AdminEventsFilters";


export default function AdminEvents() {
  return (
    <SectionErrorBoundary context="AdminEvents">
      <AdminEventsInner />
    </SectionErrorBoundary>
  );
}

function AdminEventsInner() {
  const { user, loading: authLoading } = useAuth();
  const { hasPermission, loading: permsLoading } = useAppPermissions();
  const canRead = hasPermission('events.read');
  const isAdmin = canRead;
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [templates, setTemplates] = useState<{ approved: string; rejected: string }>({
    approved: "",
    rejected: "",
  });
  const [review, setReview] = useState<{
    sub: Submission;
    kind: "approved" | "rejected";
    reason: string;
    message: string;
    submitting: boolean;
  } | null>(null);

  // Após aprovar, oferecemos ao admin gerar um flyer genérico da marca.
  const [flyerOffer, setFlyerOffer] = useState<Submission | null>(null);
  const [generatingFlyer, setGeneratingFlyer] = useState(false);
  // Alerta on-screen listando exatamente quais campos ainda faltam.
  const [publishBlock, setPublishBlock] = useState<PublishBlockInfo | null>(null);

  async function fetchAll() {
    setLoading(true);
    const { data, error } = await supabase
      .from("submissions")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) {
      handleError(error, "Erro ao carregar eventos");
    } else {
      setSubmissions(data || []);
    }
    setLoading(false);
  }


  useEffect(() => {
    if (canRead) fetchAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canRead]);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("whatsapp_templates")
        .select("kind, body");
      const next = { approved: "", rejected: "" };
      (data || []).forEach((r: any) => {
        if (r.kind === "approved" || r.kind === "rejected") (next as any)[r.kind] = r.body;
      });
      setTemplates(next);
    })();
  }, []);

  async function handleDelete(id: string) {
    const { error } = await supabase.from("submissions").delete().eq("id", id);
    if (error) {
      handleError(error, "Erro ao remover evento");
    } else {
      toast.success("Evento removido com sucesso");
      setSubmissions((prev) => prev.filter((s) => s.id !== id));
    }
    setDeleteConfirmId(null);
  }

  function openReview(sub: Submission, kind: "approved" | "rejected") {
    const template = templates[kind];
    if (!template) {
      toast.error("Template do WhatsApp ainda não carregado. Tente novamente em alguns segundos.");
      return;
    }
    const initial = renderTemplate(template, buildTemplateVars(sub, ""));
    setReview({ sub, kind, reason: "", message: initial, submitting: false });
  }

  function updateReviewReason(reason: string) {
    setReview((prev) => {
      if (!prev) return prev;
      const message = renderTemplate(templates[prev.kind], buildTemplateVars(prev.sub, reason));
      return { ...prev, reason, message };
    });
  }

  async function confirmReview() {
    if (!review) return;
    const { sub, kind, reason, message } = review;
    if (kind === "approved") {
      const missing = missingPublishFields(sub);
      if (missing.length) {
        setPublishBlock({ eventTitle: sub.event_title, action: "aprovar", missing });
        toast.error(`Não dá pra aprovar: falta ${missing.join(', ')}.`);
        setReview({ ...review, submitting: false });
        return;
      }
    }
    setReview({ ...review, submitting: true });

    const payload: any =
      kind === "approved"
        ? {
            status: "aprovado",
            approved_at: new Date().toISOString(),
            approved_by: user?.id,
            rejected_at: null,
            rejected_by: null,
          }
        : {
            status: "rejeitado",
            rejected_at: new Date().toISOString(),
            rejected_by: user?.id,
            admin_notes: reason || null,
          };

    const { error } = await supabase.from("submissions").update(payload).eq("id", sub.id);
    if (error) {
      handleError(error, "Erro ao atualizar status");
      setReview({ ...review, submitting: false });
      return;
    }

    toast.success(kind === "approved" ? "Evento aprovado." : "Evento rejeitado.");

    if (kind === "approved") {
      if (shouldOfferGenericFlyer(sub)) setFlyerOffer(sub);
    }

    const phoneCheck = validateBrazilianMobile(sub.phone || "");
    if (phoneCheck.valid) {
      const url = buildWhatsappUrl(sub.phone || "", message);
      if (url) {
        const win = window.open(url, "_blank", "noopener,noreferrer");
        if (!win) toast.info("Pop-up bloqueado. Libere para enviar pelo WhatsApp.");
        else toast.success(`WhatsApp aberto para ${phoneCheck.display}.`);
      }
    } else {
      toast.warning(`Sem WhatsApp válido: ${(phoneCheck as { reason: string }).reason}`);
    }

    setReview(null);
    fetchAll();
  }

  async function confirmGenerateFlyer() {
    if (!flyerOffer) return;
    // Guarda dupla: nunca sobrescreve arte enviada pelo promotor.
    if (flyerOffer.image_url) {
      toast.info("Esse evento já tem flyer do divulgador. Mantendo a arte original.");
      setFlyerOffer(null);
      return;
    }
    setGeneratingFlyer(true);
    try {
      const dataUrl = await generateFallbackFlyer({
        title: flyerOffer.event_title || "Evento",
        date: formatEventDate(flyerOffer.date),
        startTime: flyerOffer.start_time,
        location: flyerOffer.location,
        category: (flyerOffer as any).category ?? null,
      });
      const blob = await (await fetch(dataUrl)).blob();
      const filePath = `${user?.id ?? "admin"}/fallback-${flyerOffer.id}-${Date.now()}.jpg`;
      const { error: upErr } = await supabase.storage
        .from("event-flyers")
        .upload(filePath, blob, { contentType: "image/jpeg", upsert: true });
      if (upErr) throw upErr;
      const { data: { publicUrl } } = supabase.storage
        .from("event-flyers")
        .getPublicUrl(filePath);
      const { error: updErr } = await supabase
        .from("submissions")
        .update({ image_url: publicUrl })
        .eq("id", flyerOffer.id);
      if (updErr) throw updErr;
      toast.success("Flyer genérico gerado e salvo no evento.");
      setFlyerOffer(null);
      fetchAll();
    } catch (e) {
      handleError(e, "Não foi possível gerar o flyer");
    } finally {
      setGeneratingFlyer(false);
    }
  }

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copiado!`);
  };

  const openWhatsApp = (text: string) => {
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
  };

  async function handleModerationChange(id: string, newModerationStatus: string) {
    const { error } = await supabase.from("submissions").update({ 
      moderation_status: newModerationStatus 
    }).eq("id", id);
    if (error) {
      handleError(error, "Erro ao atualizar moderação");
    } else {
      toast.success(`Moderação atualizada: ${newModerationStatus}`);
      setSubmissions((prev) => prev.map((s) => s.id === id ? { ...s, moderation_status: newModerationStatus } : s));
    }

  }

  async function toggleHighlight(id: string, current: boolean) {
    const { error } = await supabase.from("submissions").update({ is_highlight: !current }).eq("id", id);
    if (error) {
      handleError(error, "Erro ao atualizar destaque");
    } else {
      toast.success(!current ? "Evento em destaque! 🔥" : "Destaque removido");
      setSubmissions(prev => prev.map(s => s.id === id ? { ...s, is_highlight: !current } : s));
    }

  }

  const kpis = useMemo(() => computeKpis(submissions), [submissions]);

  const filtered = useMemo(
    () => filterSubmissions(submissions, { statusFilter, categoryFilter, search }),
    [submissions, statusFilter, categoryFilter, search],
  );


  if (authLoading || permsLoading) return <LoadingState fullPage message="Verificando permissões..." />;
  if (!user || !hasPermission('events.read')) return <Navigate to="/" replace />;

  return (
    <PageContainer maxWidth="7xl">
         <PublishBlockDialog info={publishBlock} onClose={() => setPublishBlock(null)} />
         <AdminEventsToolbar
           submissions={submissions}
           filtered={filtered}
           onRefresh={() => fetchAll()}
           onExportPdf={(list) => exportBulkEventsPdf(list)}
         />


         <AdminEventsKpis kpis={kpis} onSelectStatus={setStatusFilter} />


         <ChangeRequestsPanel
           focusId={typeof window !== "undefined" ? new URLSearchParams(window.location.search).get("change_request") : null}
         />

         <AdminEventsFilters
           kpis={kpis}
           search={search}
           statusFilter={statusFilter}
           categoryFilter={categoryFilter}
           onSearchChange={setSearch}
           onStatusChange={setStatusFilter}
           onCategoryChange={setCategoryFilter}
           onClear={() => { setSearch(""); setStatusFilter("all"); setCategoryFilter("all"); toast.info("Filtros limpos"); }}
         />


        {/* Main List */}
        <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
           <div className="hidden md:grid grid-cols-12 gap-4 px-6 py-4 border-b bg-muted/20 text-[10px] font-black text-muted-foreground uppercase tracking-[0.15em]">
              <div className="col-span-3">Informações do Evento</div>
              <div className="col-span-2">Cronograma</div>
              <div className="col-span-2">Responsável & Contato</div>
              <div className="col-span-2">Status</div>
              <div className="col-span-3 text-right px-2">Ações Operacionais</div>
           </div>
          
          {loading ? (
            <LoadingState message="Carregando eventos..." />
          ) : filtered.length === 0 ? (
            <div className="py-20 text-center text-muted-foreground space-y-2">
              <CalendarDays className="h-12 w-12 mx-auto opacity-20" />
              <p>Nenhum evento encontrado.</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {filtered.map((sub) => (
                <div key={sub.id} className="p-5 hover:bg-muted/5 transition-colors">
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                    {/* Informações Principais */}
                     <div className="col-span-3 space-y-2">
                       <div className="flex items-start gap-3">
                         {sub.image_url ? (
                           <img
                             src={sub.image_url}
                             alt={sub.event_title}
                             loading="lazy"
                             className="h-14 w-14 rounded-lg object-cover ring-1 ring-border shrink-0"
                           />
                         ) : (
                           <div className="h-14 w-14 rounded-lg bg-muted flex items-center justify-center shrink-0">
                             <CalendarDays className="h-5 w-5 text-muted-foreground/40" />
                           </div>
                         )}
                         <div className="min-w-0 flex-1">
                           <div className="flex items-start gap-1.5">
                             {sub.is_highlight && <Star className="h-3.5 w-3.5 text-amber-500 fill-amber-500 shrink-0 mt-1" />}
                             <h3 className="font-black text-base text-foreground leading-tight tracking-tight line-clamp-2">{sub.event_title}</h3>
                           </div>
                           <p className="text-[11px] text-muted-foreground font-semibold mt-0.5 truncate">
                             por {sub.company_name || sub.responsible_name || "—"}
                           </p>
                         </div>
                       </div>
                       <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                         <Badge variant="secondary" className="text-[10px] font-bold bg-primary/10 text-primary border-none uppercase tracking-wider">
                           {categoryLabels[sub.category || ''] || 'Outros'}
                         </Badge>
                         <span className="text-[10px] text-muted-foreground font-mono bg-muted px-1.5 py-0.5 rounded">ID: {sub.id.slice(0, 8)}</span>
                       </div>
                         <div className="flex flex-col gap-1 mt-3 p-2 bg-muted/20 rounded-lg border border-border/30">
                          <span className="text-[9px] font-black text-muted-foreground uppercase tracking-widest px-0.5">Data de Cadastro</span>
                           <p className="text-[11px] text-foreground font-bold flex items-center gap-1.5">
                            <History className="h-3 w-3 text-primary/70" />
                             {formatSubmissionDate(sub.created_at)}
                           </p>
                         </div>
                         <div className="flex flex-wrap gap-2 mt-2">
                           {sub.moderation_status === 'flagged' && (
                             <Badge variant="destructive" className="animate-pulse flex items-center gap-1 text-[9px] font-black uppercase">
                               <ShieldAlert className="h-3 w-3" /> Conteúdo Suspeito
                             </Badge>
                           )}
                           {(sub.report_count ?? 0) > 0 && (
                             <Badge variant="outline" className="text-red-600 border-red-200 bg-red-50 flex items-center gap-1 text-[9px] font-black uppercase">
                               🚩 {sub.report_count} Denúncias
                             </Badge>
                           )}
                         </div>
                     </div>
 
                     {/* Cronograma */}
                     <div className="col-span-2 space-y-2">
                       <div className="bg-muted/30 p-2.5 rounded-lg border border-border/50">
                         <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest block mb-1.5">Data do Evento</span>
                         <div className="flex items-center gap-2 text-sm font-black text-foreground">
                           <CalendarDays className="h-4 w-4 text-primary" />
                           {formatEventDate(sub.date)}
                         </div>
                         <div className="flex items-center gap-2 text-xs font-bold text-primary mt-2 ml-0.5">
                           <Clock className="h-3.5 w-3.5" />
                           {sub.start_time || '--:--'}{sub.end_time ? ` – ${sub.end_time}` : ''}
                         </div>
                       </div>
                     </div>

                    {/* Responsável */}
                    <div className="col-span-2 space-y-1.5">
                      <p className="font-bold text-sm text-foreground truncate">{sub.company_name || sub.responsible_name || '—'}</p>
                      <div className="space-y-1">
                        <a href={`tel:${sub.phone}`} className="flex items-center gap-2 text-xs text-muted-foreground hover:text-primary transition-colors">
                          <Phone className="h-3 w-3" />
                          {sub.phone || 'Sem tel'}
                        </a>
                        {sub.email && (
                          <a href={`mailto:${sub.email}`} className="flex items-center gap-2 text-xs text-muted-foreground hover:text-primary transition-colors truncate">
                            <Mail className="h-3 w-3" />
                            {sub.email}
                          </a>
                        )}
                      </div>
                    </div>

                    {/* Status */}
                    <div className="col-span-2">
                      {(() => {
                         const cfg = statusConfig[sub.status] || statusConfig.pendente;
                        const StatusIcon = cfg.icon;
                        return (
                          <div className="flex flex-col gap-1.5 items-start">
                            <Badge className={`${cfg.bg} ${cfg.color} ${cfg.border} border font-black text-[10px] py-1.5 px-3 flex items-center gap-2 shadow-sm rounded-full`}>
                              <StatusIcon className="h-3.5 w-3.5" />
                              {cfg.label.toUpperCase()}
                            </Badge>
                            {sub.status === 'aprovado' && (
                              <span className="text-[10px] font-bold text-indigo-600 flex items-center gap-1.5 ml-1">
                                <Globe className="h-3 w-3" />
                                NA AGENDA
                              </span>
                            )}
                          </div>
                        );
                      })()}
                    </div>

                    <div className="col-span-3 flex justify-end flex-wrap gap-1.5">
                      <TooltipProvider>
                        {/* Ver Detalhes */}
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button size="icon" variant="outline" className="h-9 w-9 bg-white border-border hover:bg-primary/5 hover:text-primary hover:border-primary/20 transition-all shadow-sm" onClick={() => setExpandedId(expandedId === sub.id ? null : sub.id)}>
                              <Eye className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Ver Detalhes</TooltipContent>
                        </Tooltip>

                        {/* Editar (Abre expansão ou poderia ser rota dedicada) */}
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button size="icon" variant="outline" className="h-9 w-9 bg-white border-border hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 transition-all shadow-sm" onClick={() => setExpandedId(sub.id)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Editar / Revisar</TooltipContent>
                        </Tooltip>

                        {/* Aprovar/Rejeitar/Publicar (Dinâmico) */}
                        {sub.status === 'pendente' ? (
                          <>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                 <span className="inline-flex">
                                   <Button size="icon" variant="outline" disabled={missingPublishFields(sub).length > 0} className="h-9 w-9 bg-emerald-50 border-emerald-200 text-emerald-600 hover:bg-emerald-600 hover:text-white transition-all shadow-sm disabled:opacity-50" onClick={() => openReview(sub, 'approved')}>
                                     <CheckCircle className="h-4 w-4" />
                                   </Button>
                                 </span>
                               </TooltipTrigger>
                               <TooltipContent>
                                 {missingPublishFields(sub).length > 0
                                   ? `Falta: ${missingPublishFields(sub).join(", ")}`
                                   : "Aprovar"}
                               </TooltipContent>
                             </Tooltip>
                             
                             <Tooltip>
                               <TooltipTrigger asChild>
                                 <Button size="icon" variant="outline" className="h-9 w-9 bg-rose-50 border-rose-200 text-rose-600 hover:bg-rose-600 hover:text-white transition-all shadow-sm" onClick={() => openReview(sub, 'rejected')}>
                                   <XCircle className="h-4 w-4" />
                                 </Button>
                               </TooltipTrigger>
                               <TooltipContent>Rejeitar</TooltipContent>
                             </Tooltip>
                          </>
                        ) : sub.status === 'aprovado' ? (
                          <Tooltip>
                            <TooltipTrigger asChild>
                               <Button size="icon" variant="outline" className="h-9 w-9 bg-rose-50 border-rose-200 text-rose-600 hover:bg-rose-600 hover:text-white transition-all shadow-sm" onClick={() => openReview(sub, 'rejected')}>
                                <XCircle className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Rejeitar</TooltipContent>
                          </Tooltip>
                        ) : sub.status === 'rejeitado' ? (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span className="inline-flex">
                                <Button size="icon" variant="outline" disabled={missingPublishFields(sub).length > 0} className="h-9 w-9 bg-emerald-50 border-emerald-200 text-emerald-600 hover:bg-emerald-600 hover:text-white transition-all shadow-sm disabled:opacity-50" onClick={() => openReview(sub, 'approved')}>
                                  <CheckCircle className="h-4 w-4" />
                                </Button>
                              </span>
                            </TooltipTrigger>
                            <TooltipContent>
                              {missingPublishFields(sub).length > 0
                                ? `Falta: ${missingPublishFields(sub).join(", ")}`
                                : "Reverter para Aprovado"}
                            </TooltipContent>
                          </Tooltip>
                        ) : null}

                        {sub.slug && (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button size="icon" variant="outline" className="h-9 w-9 bg-blue-50 border-blue-200 text-blue-600 hover:bg-blue-600 hover:text-white transition-all shadow-sm" onClick={() => window.open(`/evento/${sub.slug}`, '_blank')}>
                                <ExternalLink className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Ver Página Pública</TooltipContent>
                          </Tooltip>
                        )}

                        {/* Divulgar no WhatsApp — visível quando aprovado */}
                        {sub.status === 'aprovado' && (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                size="sm"
                                className="h-9 px-3 bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm font-bold text-xs gap-1.5"
                                onClick={() => window.open(`https://wa.me/?text=${buildWhatsAppMessage(sub)}`, "_blank")}
                              >
                                <MessageCircle className="h-4 w-4" />
                                <span className="hidden lg:inline">Divulgar</span>
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Divulgar no WhatsApp</TooltipContent>
                          </Tooltip>
                        )}

                        {/* Destacar */}
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              size="icon"
                              variant="outline"
                              className={cn(
                                "h-9 w-9 transition-all shadow-sm",
                                sub.is_highlight
                                  ? "bg-amber-50 border-amber-200 text-amber-600 hover:bg-amber-100"
                                  : "bg-white border-border hover:bg-amber-50 hover:text-amber-600"
                              )}
                              onClick={() => toggleHighlight(sub.id, !!sub.is_highlight)}
                            >
                              <Star className={cn("h-4 w-4", sub.is_highlight && "fill-amber-600")} />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>{sub.is_highlight ? 'Remover Destaque' : 'Destacar'}</TooltipContent>
                        </Tooltip>

                        {/* Menu Adicional (PDF, WhatsApp, Excluir) */}
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button size="icon" variant="ghost" className="h-9 w-9"><ChevronDown className="h-4 w-4" /></Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-56">
                            <div className="px-2 py-1.5 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Distribuição</div>
                            <DropdownMenuItem onClick={() => sub.short_copy && copyToClipboard(sub.short_copy, "Texto curto")} disabled={!sub.short_copy} className="cursor-pointer">
                              <MessageCircle className="h-4 w-4 mr-2" /> Copiar Texto Curto
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => sub.long_copy && copyToClipboard(sub.long_copy, "Texto longo")} disabled={!sub.long_copy} className="cursor-pointer">
                              <MessageCircle className="h-4 w-4 mr-2" /> Copiar Texto Longo
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => sub.short_copy && openWhatsApp(sub.short_copy)} disabled={!sub.short_copy} className="cursor-pointer text-emerald-600">
                              <Phone className="h-4 w-4 mr-2" /> Abrir no WhatsApp
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => exportSingleEventPdf(sub)} className="cursor-pointer">
                              <FileDown className="h-4 w-4 mr-2" /> Exportar PDF
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                             <div className="px-2 py-1.5 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Moderação</div>
                             {sub.moderation_status === 'flagged' && (
                               <DropdownMenuItem onClick={() => handleModerationChange(sub.id, 'approved')} className="cursor-pointer text-emerald-600 font-bold">
                                 <CheckCircle className="h-4 w-4 mr-2" /> Limpar Sinalização
                               </DropdownMenuItem>
                             )}
                             {sub.moderation_status !== 'blocked' ? (
                               <DropdownMenuItem onClick={() => handleModerationChange(sub.id, 'blocked')} className="cursor-pointer text-red-600 font-bold">
                                 <ShieldAlert className="h-4 w-4 mr-2" /> Bloquear Evento
                               </DropdownMenuItem>
                             ) : (
                               <DropdownMenuItem onClick={() => handleModerationChange(sub.id, 'approved')} className="cursor-pointer text-emerald-600 font-bold">
                                 <RotateCcw className="h-4 w-4 mr-2" /> Desbloquear
                               </DropdownMenuItem>
                             )}
                            <DropdownMenuSeparator />
                             <DropdownMenuItem onClick={() => setDeleteConfirmId(sub.id)} className="text-rose-600 focus:text-rose-600 focus:bg-rose-50 cursor-pointer font-bold">
                               <Trash2 className="h-4 w-4 mr-2" /> Excluir permanentemente
                             </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TooltipProvider>
                    </div>
                  </div>

                  {expandedId === sub.id && (
                    <div className="mt-4 p-5 bg-muted/30 rounded-xl border border-border/50 animate-in slide-in-from-top-2 duration-300">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <div className="space-y-4">
                          <div>
                            <h4 className="text-[10px] font-black uppercase text-muted-foreground tracking-widest mb-3">Classificação e Segurança</h4>
                            <div className="space-y-3 text-sm mb-6">
                              <div className="flex items-center gap-2">
                                <Badge className={cn("rounded-full px-3 py-1 font-black", sub.age_rating === '18+' ? "bg-red-500" : "bg-green-500")}>
                                  {sub.age_rating || 'Livre'}
                                </Badge>
                                <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-tight">Classificação Etária</span>
                              </div>
                              <p className="flex items-center gap-2 font-bold text-xs">
                                {sub.is_suitable_for_minors ? (
                                  <CheckCircle className="h-4 w-4 text-emerald-500" />
                                ) : (
                                  <XCircle className="h-4 w-4 text-red-500" />
                                )}
                                Adequado para menores: {sub.is_suitable_for_minors ? 'SIM' : 'NÃO'}
                              </p>
                            </div>

                            <h4 className="text-[10px] font-black uppercase text-muted-foreground tracking-widest mb-3">Localização e Contato</h4>
                            <div className="space-y-3 text-sm">
                              <p className="flex items-start gap-2 font-medium"><MapPin className="h-4 w-4 text-primary mt-0.5 shrink-0" /> {sub.location}</p>
                              {sub.address_street && <p className="text-xs text-muted-foreground ml-6 leading-relaxed">{sub.address_street}, {sub.address_number}<br/>{sub.address_neighborhood}, {sub.address_city}</p>}
                              {sub.email && <p className="flex items-center gap-2 text-xs"><Mail className="h-4 w-4 text-primary shrink-0" /> {sub.email}</p>}
                              {sub.contact_social && <p className="flex items-center gap-2 text-xs"><Globe className="h-4 w-4 text-primary shrink-0" /> {sub.contact_social}</p>}
                            </div>
                          </div>
                          <div className="pt-2 flex flex-col gap-2">
                            <Button variant="outline" size="sm" className="w-full justify-start" onClick={() => exportSingleEventPdf(sub)}><FileDown className="h-4 w-4 mr-2" /> PDF do Evento</Button>
                            <Button variant="outline" size="sm" className="w-full justify-start" onClick={() => window.open(`https://wa.me/?text=${buildWhatsAppMessage(sub)}`, "_blank")}><MessageCircle className="h-4 w-4 mr-2" /> Gerar Texto WhatsApp</Button>
                          </div>
                        </div>
                      <div className="md:col-span-2 space-y-6">
                        <div>
                          <h4 className="text-[10px] font-black uppercase text-muted-foreground tracking-widest mb-3">Conteúdo do Evento</h4>
                          <div className="bg-background border border-border/60 p-5 rounded-xl shadow-inner">
                            <p className="text-sm leading-relaxed whitespace-pre-wrap">{sub.description || "Sem descrição disponível."}</p>
                          </div>
                        </div>
                          {sub.additional_details && (
                            <div>
                              <h4 className="text-[10px] font-black uppercase text-muted-foreground tracking-widest mb-3">Detalhes Complementares</h4>
                              <div className="bg-amber-50/50 border border-amber-100 p-4 rounded-lg text-sm italic">
                                {sub.additional_details}
                              </div>
                            </div>
                          )}
                          <div className="pt-4 flex flex-wrap gap-2 border-t border-border/50">
                            {sub.status !== 'aprovado' && (
                             (() => {
                               const missing = missingPublishFields(sub);
                               const disabled = missing.length > 0;
                               const btn = (
                                 <Button size="sm" variant="default" disabled={disabled} onClick={() => openReview(sub, 'approved')} className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50">
                                   <CheckCircle className="h-4 w-4 mr-2" /> Aprovar e Publicar
                                 </Button>
                               );
                               return disabled ? (
                                 <Tooltip><TooltipTrigger asChild><span className="inline-flex">{btn}</span></TooltipTrigger><TooltipContent>Falta: {missing.join(", ")}</TooltipContent></Tooltip>
                               ) : btn;
                             })()
                            )}
                            {sub.status !== 'rejeitado' && (
                             <Button size="sm" variant="outline" onClick={() => openReview(sub, 'rejected')} className="text-rose-600 border-rose-200 hover:bg-rose-50"><XCircle className="h-4 w-4 mr-2" /> Rejeitar</Button>
                            )}
                            <Button size="sm" variant={sub.is_highlight ? 'secondary' : 'outline'} className={sub.is_highlight ? 'bg-amber-100 text-amber-700' : ''} onClick={() => toggleHighlight(sub.id, !!sub.is_highlight)}><Star className={`h-4 w-4 mr-2 ${sub.is_highlight ? 'fill-amber-500' : ''}`} /> {sub.is_highlight ? 'Remover Destaque' : 'Marcar Destaque'}</Button>
                            <Button size="sm" variant="ghost" className="text-muted-foreground ml-auto"><History className="h-4 w-4 mr-2" /> Histórico</Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

      <ConfirmModal
        isOpen={!!deleteConfirmId}
        onClose={() => setDeleteConfirmId(null)}
        onConfirm={() => deleteConfirmId && handleDelete(deleteConfirmId)}
        title="Excluir Evento"
        description="Esta ação não pode ser desfeita. O evento será removido permanentemente da base de dados e da agenda pública."
        confirmText="Excluir Agora"
        variant="destructive"
      />

      <Dialog open={!!review} onOpenChange={(o) => !o && !review?.submitting && setReview(null)}>
        <DialogContent className="max-w-2xl">
          {review && (() => {
            const phoneCheck = validateBrazilianMobile(review.sub.phone || "");
            const isApprove = review.kind === "approved";
            return (
              <>
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    {isApprove ? (
                      <><CheckCircle className="h-5 w-5 text-emerald-600" /> Aprovar evento</>
                    ) : (
                      <><XCircle className="h-5 w-5 text-rose-600" /> Rejeitar evento</>
                    )}
                  </DialogTitle>
                  <DialogDescription className="text-sm">
                    <span className="font-bold text-foreground">{review.sub.event_title}</span>
                    {review.sub.responsible_name && <> — {review.sub.responsible_name}</>}
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
                  <div className={`rounded-lg border p-3 text-xs ${phoneCheck.valid ? "bg-emerald-50 border-emerald-200 text-emerald-800" : "bg-amber-50 border-amber-200 text-amber-800"}`}>
                    {phoneCheck.valid ? (
                      <>📱 WhatsApp do divulgador validado: <strong>{phoneCheck.display}</strong> — a mensagem abrirá em uma nova aba para você revisar e enviar.</>
                    ) : (
                      <>⚠️ Telefone inválido: {(phoneCheck as { reason: string }).reason} A ação ocorre normalmente, mas o WhatsApp não será aberto.</>
                    )}
                  </div>

                  {!isApprove && (
                    <div className="space-y-1.5">
                      <Label className="text-xs font-bold uppercase tracking-wide">Motivo da rejeição (opcional)</Label>
                      <Textarea
                        rows={2}
                        value={review.reason}
                        onChange={(e) => updateReviewReason(e.target.value.slice(0, 400))}
                        placeholder="Ex.: Faltam dados de localização e horário de término."
                      />
                      <p className="text-[10px] text-muted-foreground">Será incluído como observação interna e na mensagem do WhatsApp.</p>
                    </div>
                  )}

                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold uppercase tracking-wide flex items-center gap-2">
                      <Eye className="h-3.5 w-3.5" /> Pré-visualização da mensagem
                    </Label>
                    <Textarea
                      rows={10}
                      value={review.message}
                      onChange={(e) => setReview({ ...review, message: e.target.value.slice(0, 1500) })}
                      className="font-mono text-xs leading-relaxed"
                    />
                    <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                      <span>Você pode editar a mensagem antes de enviar.</span>
                      <span>{review.message.length} / 1500</span>
                    </div>
                  </div>
                </div>

                <DialogFooter className="gap-2">
                  <Button variant="outline" onClick={() => setReview(null)} disabled={review.submitting}>
                    Cancelar
                  </Button>
                  <Button
                    onClick={confirmReview}
                    disabled={review.submitting}
                    className={isApprove ? "bg-emerald-600 hover:bg-emerald-700" : "bg-rose-600 hover:bg-rose-700"}
                  >
                    {review.submitting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : (isApprove ? <CheckCircle className="h-4 w-4 mr-2" /> : <XCircle className="h-4 w-4 mr-2" />)}
                    {isApprove ? "Aprovar e enviar WhatsApp" : "Rejeitar e enviar WhatsApp"}
                  </Button>
                </DialogFooter>
              </>
            );
          })()}
        </DialogContent>
      </Dialog>

      {/* Oferta pós-aprovação: gerar flyer genérico da marca (só admin) */}
      <Dialog open={!!flyerOffer} onOpenChange={(o) => !o && !generatingFlyer && setFlyerOffer(null)}>
        <DialogContent className="max-w-md">
          {flyerOffer && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Megaphone className="h-5 w-5 text-primary" /> Gerar flyer genérico?
                </DialogTitle>
                <DialogDescription className="text-sm">
                  Cria um flyer padrão da marca <strong>Coé a Boa?</strong> pra{" "}
                  <span className="font-bold text-foreground">{flyerOffer.event_title}</span>,
                  usando data, local e categoria do evento.
                  {flyerOffer.image_url ? (
                    <span className="block mt-2 text-amber-700">
                      ⚠️ Esse evento já tem flyer. Gerar vai substituir a imagem atual.
                    </span>
                  ) : (
                    <span className="block mt-2 text-muted-foreground">
                      Assim o espaço da imagem nunca fica vazio na agenda.
                    </span>
                  )}
                </DialogDescription>
              </DialogHeader>
              <DialogFooter className="gap-2">
                <Button variant="outline" onClick={() => setFlyerOffer(null)} disabled={generatingFlyer}>
                  Agora não
                </Button>
                <Button
                  onClick={confirmGenerateFlyer}
                  disabled={generatingFlyer}
                  className="bg-primary hover:bg-primary/90"
                >
                  {generatingFlyer ? (
                    <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Gerando…</>
                  ) : (
                    <><Megaphone className="h-4 w-4 mr-2" /> Gerar flyer</>
                  )}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </PageContainer>
  );
}

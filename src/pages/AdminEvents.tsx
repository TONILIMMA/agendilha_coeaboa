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
import { buildWhatsappUrl, validateBrazilianMobile, formatPhoneDisplay, renderTemplate } from "@/lib/whatsapp";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";


interface Submission {
  id: string;
  created_at: string;
  user_id: string;
  company_name: string | null;
  responsible_name: string | null;
  email: string | null;
  phone: string | null;
  event_title: string;
  date: string | null;
  start_time: string | null;
  end_time: string | null;
  location: string | null;
  address_street: string | null;
  address_number: string | null;
  address_neighborhood: string | null;
  address_city: string | null;
  address_state: string | null;
  address_zip: string | null;
  description: string | null;
  video_link: string | null;
  category: string | null;
  promotion_type: string | null;
  target_audience: string | null;
  promotion_rules: string | null;
  contact_social: string | null;
  additional_details: string | null;
  status: string;
  is_highlight?: boolean;
  views_count?: number;
  shares_count?: number;
  age_rating?: string;
  is_suitable_for_minors?: boolean;
  report_count?: number;
  moderation_status?: string;
  slug?: string;
  short_copy?: string;
  long_copy?: string;
  approved_at?: string;
  published_at?: string;
}

 const categoryLabels: Record<string, string> = {
   musica: "Música / Show",
   gastronomia: "Gastronomia",
   cultura: "Cultura / Arte",
   esporte: "Esporte",
   promocoes: "Promoções / Ofertas",
   outros: "Outros",
 };
 
     const statusConfig: Record<string, { label: string; color: string; icon: any; bg: string; border: string }> = {
       pendente:  { label: "Pendente",  color: "text-amber-700",   bg: "bg-amber-100",   border: "border-amber-200",   icon: Clock3 },
       aprovado:  { label: "Aprovado",  color: "text-emerald-700", bg: "bg-emerald-100", border: "border-emerald-200", icon: CheckCircle },
       rejeitado: { label: "Rejeitado", color: "text-rose-700",    bg: "bg-rose-100",    border: "border-rose-200",    icon: XCircle },
     };
 
 function formatSubmissionDate(iso: string) {
   if (!iso) return "—";
   const date = new Date(iso);
   return date.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" }) + 
          " às " + 
          date.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
 }
 
 function formatEventDate(dateStr: string | null) {
   if (!dateStr) return "—";
   // Handle both ISO and DD/MM/YYYY formats
   if (dateStr.includes("-")) {
     const [y, m, d] = dateStr.split("-");
     return `${d}/${m}/${y}`;
   }
   return dateStr;
 }
 
  function buildWhatsAppMessage(sub: Submission): string {
    if (sub.short_copy) return encodeURIComponent(sub.short_copy);
    const date = formatEventDate(sub.date);
    const url = sub.slug ? `${window.location.origin}/evento/${sub.slug}` : `${window.location.origin}/agenda`;
    const msg = `🗓️ *${sub.event_title}*\n⏰ ${date} às ${sub.start_time || "--:--"}\n📍 ${sub.location}\n\n🌴 Veja mais no AgendIlha: ${url}`;
    return encodeURIComponent(msg);
  }

function buildApprovalMessage(sub: Submission): string {
  const name = (sub.responsible_name || "").trim().split(" ")[0];
  const greeting = name ? `Olá, ${name}! 👋` : "Olá! 👋";
  const url = sub.slug
    ? `${window.location.origin}/evento/${sub.slug}`
    : `${window.location.origin}/agenda`;
  return (
    `${greeting}\n\n` +
    `✅ *Seu evento foi aprovado pela curadoria do AgendIlha!*\n\n` +
    `🎉 *${sub.event_title}*\n` +
    `📅 ${formatEventDate(sub.date)}${sub.start_time ? ` às ${sub.start_time}` : ""}\n` +
    (sub.location ? `📍 ${sub.location}\n` : "") +
    `\nJá está publicado na Agenda Cultural:\n${url}\n\n` +
    `Acompanhe seus envios em: ${window.location.origin}/meus-eventos`
  );
}

function buildRejectionMessage(sub: Submission, reason?: string | null): string {
  const name = (sub.responsible_name || "").trim().split(" ")[0];
  const greeting = name ? `Olá, ${name}.` : "Olá.";
  const reasonLine = reason?.trim()
    ? `\n📝 *Observação da curadoria:* ${reason.trim()}\n`
    : "";
  return (
    `${greeting}\n\n` +
    `Sobre o evento *${sub.event_title}* enviado ao AgendIlha:\n\n` +
    `❌ Infelizmente ele *não foi aprovado* pela curadoria neste momento.${reasonLine}\n` +
    `Você pode revisar e reenviar a qualquer momento em:\n` +
    `${window.location.origin}/meus-eventos\n\n` +
    `Qualquer dúvida, é só responder por aqui. Obrigado!`
  );
}

function buildTemplateVars(sub: Submission, reason?: string | null): Record<string, string> {
  const name = (sub.responsible_name || "").trim().split(" ")[0] || "";
  const url = sub.slug
    ? `${window.location.origin}/evento/${sub.slug}`
    : `${window.location.origin}/agenda`;
  return {
    nome: name,
    titulo: sub.event_title || "",
    data: formatEventDate(sub.date),
    hora: sub.start_time || "--:--",
    local: sub.location || "",
    url,
    motivo: (reason || "").trim(),
    meus_eventos_url: `${window.location.origin}/meus-eventos`,
  };
}

export default function AdminEvents() {
  const { user, loading: authLoading } = useAuth();
  const { hasPermission, loading: permsLoading } = useAppPermissions();
  const isAdmin = hasPermission('events.read');
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

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
    if (hasPermission('events.read')) fetchAll();
  }, [hasPermission]);

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

  async function handleStatusChange(id: string, newStatus: string) {
    const updateData: any = { 
      status: newStatus,
      additional_details: `Status alterado por ${user?.email} para ${newStatus}`
    };

    if (newStatus === 'aprovado') {
      updateData.approved_at = new Date().toISOString();
      updateData.approved_by = user?.id;
      updateData.rejected_at = null;
      updateData.rejected_by = null;
    } else if (newStatus === 'rejeitado') {
      updateData.rejected_at = new Date().toISOString();
      updateData.rejected_by = user?.id;
    }

    const { error } = await supabase.from("submissions").update(updateData).eq("id", id);

    if (error) {
      handleError(error, "Erro ao atualizar status");
    } else {
      toast.success(`Status atualizado para ${newStatus}`);
      const sub = submissions.find((s) => s.id === id);
      if (sub && newStatus === "aprovado") {
        notifyDivulgador({ ...sub, status: "aprovado" }, "approved");
      } else if (sub && newStatus === "rejeitado") {
        notifyDivulgador(sub, "rejected");
      }
      fetchAll(); // Refresh to get generated slugs/copies
    }
  }

  async function handleApproveAndPublish(id: string) {
    const { error } = await supabase.from("submissions").update({
      status: 'aprovado',
      approved_at: new Date().toISOString(),
      approved_by: user?.id,
    }).eq("id", id);

    if (error) {
      handleError(error, "Erro ao aprovar");
    } else {
      toast.success("Evento aprovado e publicado na agenda!");
      const sub = submissions.find((s) => s.id === id);
      if (sub) notifyDivulgador({ ...sub, status: "aprovado" }, "approved");
      fetchAll();
    }
  }

  async function handleReject(id: string) {
    const reason = window.prompt("Motivo da rejeição (opcional, será compartilhado com o divulgador no WhatsApp):") ?? "";
    const { error } = await supabase.from("submissions").update({
      status: 'rejeitado',
      rejected_at: new Date().toISOString(),
      rejected_by: user?.id,
      admin_notes: reason || null,
    }).eq("id", id);
    if (error) {
      handleError(error, "Erro ao rejeitar evento");
    } else {
      toast.success("Evento rejeitado.");
      const sub = submissions.find((s) => s.id === id);
      if (sub) notifyDivulgador(sub, "rejected", reason);
      fetchAll();
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

  const kpis = useMemo(() => {
    return {
      total: submissions.length,
      pending: submissions.filter(s => s.status === 'pendente').length,
      approved: submissions.filter(s => s.status === 'aprovado').length,
      rejected: submissions.filter(s => s.status === 'rejeitado').length,
    };
  }, [submissions]);

   const filtered = useMemo(() => {
     let list = [...submissions];
     if (statusFilter !== "all") list = list.filter(s => s.status === statusFilter);
     if (categoryFilter !== "all") list = list.filter(s => s.category === categoryFilter);
     if (search.trim()) {
       const q = search.toLowerCase();
       list = list.filter(s => 
         s.event_title.toLowerCase().includes(q) ||
         (s.company_name || "").toLowerCase().includes(q) ||
         (s.location || "").toLowerCase().includes(q) ||
         (s.responsible_name || "").toLowerCase().includes(q)
       );
     }
     return list;
   }, [submissions, statusFilter, categoryFilter, search]);

  if (authLoading || permsLoading) return <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  if (!user || !hasPermission('events.read')) return <Navigate to="/" replace />;

  return (
    <div className="animate-fade-in">
      <div className="mx-auto max-w-7xl px-4 py-8">
         {/* Header Area */}
         <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8 md:mb-10">
           <div className="space-y-1">
             <div className="flex items-center gap-2 text-primary">
               <LayoutDashboard className="h-4 w-4" />
               <span className="text-[10px] font-black uppercase tracking-[0.2em]">Backoffice</span>
             </div>
              <h1 className="text-2xl md:text-3xl font-black tracking-tight text-foreground uppercase">Gestão de Eventos</h1>
              <p className="text-muted-foreground text-xs sm:text-sm">Controle operacional e curadoria da agenda hiperlocal.</p>
           </div>
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
               <Button variant="outline" size="sm" className="h-9 sm:h-10 font-bold border-border bg-background hover:bg-muted text-[10px] sm:text-xs px-3 sm:px-4" onClick={() => fetchAll()}><RotateCcw className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" /> Atualizar</Button>
               <Button variant="outline" size="sm" className="h-9 sm:h-10 font-bold border-border bg-background hover:bg-muted text-[10px] sm:text-xs px-3 sm:px-4" onClick={() => exportBulkEventsPdf(filtered)}><FileDown className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" /> Exportar PDF</Button>
                <Button 
                  size="sm"
                  className="h-9 sm:h-10 font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-600/20 text-[10px] sm:text-xs px-3 sm:px-4"
                 onClick={() => {
                    const approved = submissions.filter(s => s.status === 'aprovado');
                   if (approved.length === 0) return toast.warning("Sem eventos para divulgar.");
                   window.open(`https://wa.me/?text=${buildWhatsAppMessage(approved[0])}`, "_blank");
                 }}
               >
                <MessageCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" /> <span className="hidden sm:inline">Divulgação WhatsApp</span><span className="sm:hidden">WhatsApp</span>
              </Button>
            </div>
         </div>

         {/* KPIs */}
         <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
              {[
                { label: 'Total', value: kpis.total, color: 'text-slate-600', bg: 'bg-white' },
                { label: 'Pendentes', value: kpis.pending, color: 'text-amber-600', bg: 'bg-white' },
                { label: 'Aprovados', value: kpis.approved, color: 'text-emerald-600', bg: 'bg-white' },
                { label: 'Rejeitados', value: kpis.rejected, color: 'text-rose-600', bg: 'bg-white' },
              ].map((kpi) => (
             <Card key={kpi.label} className={`${kpi.bg} border-none shadow-sm hover:shadow-md transition-all`}>
               <CardContent className="p-4">
                 <p className="text-[10px] font-black uppercase text-muted-foreground/70 tracking-wider">{kpi.label}</p>
                 <p className={`text-3xl font-black ${kpi.color} mt-1`}>{kpi.value}</p>
               </CardContent>
             </Card>
           ))}
         </div>

         {/* Filters */}
         <div className="mb-8 grid grid-cols-1 md:grid-cols-12 gap-4 items-center bg-card border border-border p-2 rounded-2xl shadow-sm">
           <div className="md:col-span-5 relative">
             <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
             <Input 
               placeholder="Buscar por título, empresa, local ou responsável..." 
               className="pl-10 h-11 bg-muted/30 border-none focus-visible:ring-1 focus-visible:ring-primary/20" 
               value={search} 
               onChange={e => setSearch(e.target.value)} 
             />
           </div>
           <div className="md:col-span-3">
             <Select value={statusFilter} onValueChange={setStatusFilter}>
               <SelectTrigger className="h-11 bg-muted/30 border-none"><SelectValue placeholder="Status" /></SelectTrigger>
               <SelectContent>
                 <SelectItem value="all">Todos os Status</SelectItem>
                 {Object.entries(statusConfig).map(([key, cfg]) => (
                   <SelectItem key={key} value={key}>{cfg.label}</SelectItem>
                 ))}
               </SelectContent>
             </Select>
           </div>
           <div className="md:col-span-3">
             <Select value={categoryFilter} onValueChange={setCategoryFilter}>
               <SelectTrigger className="h-11 bg-muted/30 border-none"><SelectValue placeholder="Categoria" /></SelectTrigger>
               <SelectContent>
                 <SelectItem value="all">Todas as Categorias</SelectItem>
                 {Object.entries(categoryLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
               </SelectContent>
             </Select>
           </div>
           <div className="md:col-span-1 flex justify-center">
             <TooltipProvider>
               <Tooltip>
                 <TooltipTrigger asChild>
                   <Button 
                     variant="ghost" 
                     size="icon" 
                     className="h-11 w-11 rounded-xl hover:bg-rose-50 hover:text-rose-600 transition-colors"
                     onClick={() => { setSearch(""); setStatusFilter("all"); setCategoryFilter("all"); toast.info("Filtros limpos"); }}
                   >
                     <SlidersHorizontal className="h-4 w-4" />
                   </Button>
                 </TooltipTrigger>
                 <TooltipContent>Limpar Filtros</TooltipContent>
               </Tooltip>
             </TooltipProvider>
           </div>
         </div>

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
            <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
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
                       <div className="flex items-start gap-2">
                         {sub.is_highlight && <Star className="h-4 w-4 text-amber-500 fill-amber-500 shrink-0 mt-1" />}
                         <h3 className="font-black text-lg text-foreground leading-tight tracking-tight">{sub.event_title}</h3>
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
                           {sub.start_time || '--:--'}
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
                                <Button size="icon" variant="outline" className="h-9 w-9 bg-emerald-50 border-emerald-200 text-emerald-600 hover:bg-emerald-600 hover:text-white transition-all shadow-sm" onClick={() => handleStatusChange(sub.id, 'aprovado')}>
                                  <CheckCircle className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Aprovar</TooltipContent>
                            </Tooltip>
                            
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button size="icon" variant="outline" className="h-9 w-9 bg-rose-50 border-rose-200 text-rose-600 hover:bg-rose-600 hover:text-white transition-all shadow-sm" onClick={() => handleReject(sub.id)}>
                                  <XCircle className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Rejeitar</TooltipContent>
                            </Tooltip>
                          </>
                        ) : sub.status === 'aprovado' ? (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button size="icon" variant="outline" className="h-9 w-9 bg-rose-50 border-rose-200 text-rose-600 hover:bg-rose-600 hover:text-white transition-all shadow-sm" onClick={() => handleReject(sub.id)}>
                                <XCircle className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Rejeitar</TooltipContent>
                          </Tooltip>
                        ) : sub.status === 'rejeitado' ? (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button size="icon" variant="outline" className="h-9 w-9 bg-emerald-50 border-emerald-200 text-emerald-600 hover:bg-emerald-600 hover:text-white transition-all shadow-sm" onClick={() => handleStatusChange(sub.id, 'aprovado')}>
                                <CheckCircle className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Reverter para Aprovado</TooltipContent>
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
                              <Button size="sm" variant="default" onClick={() => handleStatusChange(sub.id, 'aprovado')} className="bg-emerald-600 hover:bg-emerald-700"><CheckCircle className="h-4 w-4 mr-2" /> Aprovar e Publicar</Button>
                            )}
                            {sub.status !== 'rejeitado' && (
                              <Button size="sm" variant="outline" onClick={() => handleReject(sub.id)} className="text-rose-600 border-rose-200 hover:bg-rose-50"><XCircle className="h-4 w-4 mr-2" /> Rejeitar</Button>
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
    </div>
  );
}

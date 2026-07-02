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
import { buildTodayWhatsAppSummary, buildWeekWhatsAppSummary, openWhatsAppWithText } from "@/lib/todayWhatsappSummary";
import { generateFallbackFlyer } from "@/lib/generateFallbackFlyer";


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
  image_url?: string | null;
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
      if (newStatus === 'aprovado') {
        const sub = submissions.find((s) => s.id === id);
        if (sub) setFlyerOffer(sub);
      }
      fetchAll(); // Refresh to get generated slugs/copies
    }
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
      setFlyerOffer(sub);
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
                 variant="outline"
                 size="sm"
                 className="h-9 sm:h-10 font-bold border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 text-[10px] sm:text-xs px-3 sm:px-4"
                 title="Gera o texto dos rolês de hoje e abre o WhatsApp — você escolhe pra quem mandar."
                 onClick={() => {
                   const { text, count } = buildTodayWhatsAppSummary(submissions);
                   if (count === 0) {
                     toast.info("Hoje não temos eventos cadastrados.", {
                       description: "Ajuste a data ou cadastre um novo evento antes de gerar o resumo.",
                     });
                     return;
                   }
                   openWhatsAppWithText(text);
                   toast.success(`Resumo pronto com ${count} rolê${count > 1 ? "s" : ""} de hoje!`, {
                     description: "É só escolher os grupos ou contatos e mandar.",
                   });
                 }}
               >
                 <Send className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
                 <span className="hidden sm:inline">Resumo de hoje no WhatsApp</span>
                 <span className="sm:hidden">Resumo hoje</span>
               </Button>
               <Button
                 variant="outline"
                 size="sm"
                 className="h-9 sm:h-10 font-bold border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 text-[10px] sm:text-xs px-3 sm:px-4"
                 title="Gera o texto dos rolês dos próximos 7 dias e abre o WhatsApp — você escolhe pra quem mandar."
                 onClick={() => {
                   const { text, count } = buildWeekWhatsAppSummary(submissions);
                   if (count === 0) {
                     toast.info("Ainda não temos eventos cadastrados para esta semana.", {
                       description: "Cadastre alguns eventos antes de gerar o resumo.",
                     });
                     return;
                   }
                   openWhatsAppWithText(text);
                   toast.success(`Resumo da semana pronto com ${count} rolê${count > 1 ? "s" : ""}!`, {
                     description: "É só escolher os grupos ou contatos e mandar.",
                   });
                 }}
               >
                 <CalendarDays className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
                 <span className="hidden sm:inline">Resumo da semana no WhatsApp</span>
                 <span className="sm:hidden">Resumo semana</span>
               </Button>
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
         <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
           {/* Pendentes — destaque âmbar com alerta quando > 0 */}
           <Card
             onClick={() => setStatusFilter('pendente')}
             className={cn(
               "cursor-pointer border-2 transition-all shadow-sm hover:shadow-md",
               kpis.pending > 0
                 ? "bg-amber-50 border-amber-400 ring-2 ring-amber-200 animate-pulse"
                 : "bg-white border-transparent"
             )}
           >
             <CardContent className="p-4 flex items-start justify-between gap-2">
               <div>
                 <p className="text-[10px] font-black uppercase text-amber-700 tracking-wider flex items-center gap-1.5">
                   {kpis.pending > 0 && <AlertCircle className="h-3.5 w-3.5" />} Pendentes
                 </p>
                 <p className="text-3xl font-black text-amber-600 mt-1">{kpis.pending}</p>
                 {kpis.pending > 0 && (
                   <p className="text-[10px] text-amber-700/80 font-bold mt-1">Aguardando curadoria</p>
                 )}
               </div>
               <Clock3 className="h-5 w-5 text-amber-500 mt-1" />
             </CardContent>
           </Card>
           <Card onClick={() => setStatusFilter('aprovado')} className="cursor-pointer bg-white border-none shadow-sm hover:shadow-md transition-all">
             <CardContent className="p-4">
               <p className="text-[10px] font-black uppercase text-muted-foreground/70 tracking-wider">Aprovados</p>
               <p className="text-3xl font-black text-emerald-600 mt-1">{kpis.approved}</p>
             </CardContent>
           </Card>
           <Card onClick={() => setStatusFilter('rejeitado')} className="cursor-pointer bg-white border-none shadow-sm hover:shadow-md transition-all">
             <CardContent className="p-4">
               <p className="text-[10px] font-black uppercase text-muted-foreground/70 tracking-wider">Rejeitados</p>
               <p className="text-3xl font-black text-rose-600 mt-1">{kpis.rejected}</p>
             </CardContent>
           </Card>
           <Card onClick={() => setStatusFilter('all')} className="cursor-pointer bg-white border-none shadow-sm hover:shadow-md transition-all">
             <CardContent className="p-4">
               <p className="text-[10px] font-black uppercase text-muted-foreground/70 tracking-wider">Total</p>
               <p className="text-3xl font-black text-slate-600 mt-1">{kpis.total}</p>
             </CardContent>
           </Card>
         </div>

         {/* Filtros rápidos */}
         <div className="mb-4 flex flex-wrap items-center gap-2">
           <span className="text-[10px] font-black uppercase text-muted-foreground tracking-widest mr-1">Filtro rápido:</span>
           {[
             { key: 'all',       label: 'Todos',     count: kpis.total },
             { key: 'pendente',  label: 'Pendente',  count: kpis.pending,  cls: 'border-amber-300 data-[active=true]:bg-amber-500 data-[active=true]:text-white data-[active=true]:border-amber-500' },
             { key: 'aprovado',  label: 'Aprovado',  count: kpis.approved, cls: 'border-emerald-300 data-[active=true]:bg-emerald-500 data-[active=true]:text-white data-[active=true]:border-emerald-500' },
             { key: 'rejeitado', label: 'Rejeitado', count: kpis.rejected, cls: 'border-rose-300 data-[active=true]:bg-rose-500 data-[active=true]:text-white data-[active=true]:border-rose-500' },
           ].map((chip) => (
             <button
               key={chip.key}
               data-active={statusFilter === chip.key}
               onClick={() => setStatusFilter(chip.key)}
               className={cn(
                 "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-bold transition-all",
                 "bg-white text-foreground hover:bg-muted",
                 "data-[active=true]:shadow-sm",
                 chip.cls || "data-[active=true]:bg-foreground data-[active=true]:text-background data-[active=true]:border-foreground"
               )}
             >
               {chip.label}
               <span className="inline-flex items-center justify-center min-w-[1.25rem] h-5 px-1.5 rounded-full bg-black/5 text-[10px] font-black">
                 {chip.count}
               </span>
             </button>
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
                                 <Button size="icon" variant="outline" className="h-9 w-9 bg-emerald-50 border-emerald-200 text-emerald-600 hover:bg-emerald-600 hover:text-white transition-all shadow-sm" onClick={() => openReview(sub, 'approved')}>
                                   <CheckCircle className="h-4 w-4" />
                                 </Button>
                               </TooltipTrigger>
                               <TooltipContent>Aprovar</TooltipContent>
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
                               <Button size="icon" variant="outline" className="h-9 w-9 bg-emerald-50 border-emerald-200 text-emerald-600 hover:bg-emerald-600 hover:text-white transition-all shadow-sm" onClick={() => openReview(sub, 'approved')}>
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
                             <Button size="sm" variant="default" onClick={() => openReview(sub, 'approved')} className="bg-emerald-600 hover:bg-emerald-700"><CheckCircle className="h-4 w-4 mr-2" /> Aprovar e Publicar</Button>
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
    </div>
  );
}

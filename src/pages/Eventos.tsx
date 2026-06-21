import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useAppPermissions as usePermissions } from "@/hooks/usePermissions";
import { useSubmissions as useSubmissionsQuery } from "@/data";
import { Navigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
   CalendarDays, Loader2, MessageCircle, Trash2, Search, Share2,
   FileDown, MapPin, Clock, Building2, LayoutDashboard,
   CheckCircle, XCircle, ChevronDown, ChevronUp, FileText,
   Phone, Mail, Globe, Info, Send, RotateCcw, Copy,
     DollarSign, Users, Briefcase, History, Megaphone, Image as ImageIcon, Calendar
  } from "lucide-react";
import { formatBrazilianDate } from "@/lib/date-utils";
 import {
   Dialog,
   DialogContent,
   DialogHeader,
   DialogTitle,
   DialogTrigger,
 } from "@/components/ui/dialog";
import { toast } from "sonner";
 import { exportSingleEventPdf, exportBulkEventsPdf, exportEditorialAgendaPdf } from "@/lib/pdfExport";

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
  sale_price: string | null;
  maintenance_cost: string | null;
  subscription_info: string | null;
  commission: string | null;
  stage: string;
  concept_description: string | null;
  responsible_person: string | null;
   is_highlight: boolean;
   views_count: number;
   shares_count: number;
  deleted_at: string | null;
}

const categoryLabels: Record<string, string> = {
  musica: "Música / Show",
  gastronomia: "Gastronomia",
  cultura: "Cultura / Arte",
  esporte: "Esporte",
  promocoes: "Promoções / Ofertas",
  outros: "Outros",
};

const stageLabels: Record<string, string> = {
  development: "Em desenvolvimento",
  confirmed: "Confirmado",
  update: "Atualização",
};

const stageBadgeVariant: Record<string, "default" | "secondary" | "outline"> = {
  development: "secondary",
  confirmed: "default",
  update: "outline",
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("pt-BR", {
    day: "2-digit", month: "2-digit", year: "2-digit", hour: "2-digit", minute: "2-digit",
  });
}

function getDayOfWeek(dateStr: string): string {
  if (!dateStr) return "";
  const parts = dateStr.split("/");
  if (parts.length === 3) {
    const [dd, mm, yyyy] = parts;
    const d = new Date(`${yyyy}-${mm}-${dd}`);
    if (!isNaN(d.getTime())) {
      return d.toLocaleDateString("pt-BR", { weekday: "long" }).replace(/^\w/, c => c.toUpperCase());
    }
  }
  return "";
}

function buildWhatsAppMessage(sub: Submission): string {
  const dayOfWeek = getDayOfWeek(sub.date || "");
  const lines = [
    `*AGENDILHA* - sua agenda de eventos da Ilha do Governador`,
    `*Para mais informações:*`,
    `https://coeaboa.lovable.app/`,
    "",
    `🗓️ ${dayOfWeek ? dayOfWeek + " " : ""}${sub.date || ""}`,
    "",
    `🎙️ ${sub.start_time || ""}${sub.end_time ? ` às ${sub.end_time}` : ""} *${sub.event_title || "Evento"}*`,
    `👉 ${sub.location || ""}`,
    `✔️ Mais informações: https://coeaboa.lovable.app/`,
  ];
  return encodeURIComponent(lines.join("\n"));
}

function getWeekRange(): { start: Date; end: Date } {
  const now = new Date();
  const day = now.getDay();
  const diffToMonday = day === 0 ? -6 : 1 - day;
  const monday = new Date(now);
  monday.setHours(0, 0, 0, 0);
  monday.setDate(now.getDate() + diffToMonday);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);
  return { start: monday, end: sunday };
}

function parseEventDate(dateStr: string): Date | null {
  const parts = dateStr.split("/");
  if (parts.length === 3) {
    const [dd, mm, yyyy] = parts;
    const d = new Date(`${yyyy}-${mm}-${dd}`);
    if (!isNaN(d.getTime())) return d;
  }
  return null;
}

function buildBulkWhatsAppMessage(events: Submission[]): string {
  const { start } = getWeekRange();
  const endOfWeek = new Date(start);
  endOfWeek.setDate(start.getDate() + 6);
  const formatBR = (d: Date) => d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
   const highlights = events.filter(e => e.is_highlight);
   const lines: string[] = [
     `🌴 *AGENDILHA* - O que tem de bom na Ilha?`,
     `📅 Semana de ${formatBR(start)} a ${formatBR(endOfWeek)}`,
     ``,
   ];

   if (highlights.length > 0) {
     lines.push(`🔥 *DESTAQUES DA SEMANA*`);
     highlights.forEach(h => {
       lines.push(`• ${h.event_title} (${formatBrazilianDate(h.date)} às ${h.start_time})`);
     });
     lines.push(``);
   }

   lines.push(`👇 *AGENDA COMPLETA*`);
  const byDate = new Map<string, Submission[]>();
  events.forEach((ev) => {
    const key = ev.date || "Sem data";
    if (!byDate.has(key)) byDate.set(key, []);
    byDate.get(key)!.push(ev);
  });
  Array.from(byDate.keys()).sort().forEach((dateKey) => {
    const dayOfWeek = getDayOfWeek(dateKey);
    lines.push(`━━━━━━━━━━━━━━━`);
    lines.push(`🗓️ *${dayOfWeek ? dayOfWeek + " - " : ""}${formatBrazilianDate(dateKey)}*`);
    lines.push(``);
    byDate.get(dateKey)!.forEach((ev) => {
      lines.push(`🎙️ ${ev.start_time || ""}${ev.end_time ? ` às ${ev.end_time}` : ""} - *${ev.event_title}*`);
      if (ev.location) lines.push(`📍 ${ev.location}`);
      if (ev.category) lines.push(`🏷️ ${categoryLabels[ev.category] || ev.category}`);
      lines.push(``);
    });
  });
  lines.push(`✔️ Mais informações: https://coeaboa.lovable.app/`);
  return encodeURIComponent(lines.join("\n"));
}

function buildNotificationMessage(sub: Submission, status: string): string {
  if (status === "approved") {
    return [
      `✅ *Evento Aprovado!*`, ``,
      `Olá${sub.responsible_name ? `, ${sub.responsible_name}` : ""}! Seu evento foi aprovado no *AgendIlha*! 🎉`,
      ``, `📌 *${sub.event_title}*`,
      sub.date ? `🗓️ ${formatBrazilianDate(sub.date)}${sub.start_time ? ` às ${sub.start_time}` : ""}` : "",
      ``, `Seu evento será divulgado na agenda cultural da Ilha do Governador.`,
      ``, `Acesse: https://coeaboa.lovable.app/`,
    ].filter(Boolean).join("\n");
  }
  return [
    `⚠️ *Atualização sobre seu evento*`, ``,
    `Olá${sub.responsible_name ? `, ${sub.responsible_name}` : ""}! Infelizmente seu evento não foi aprovado desta vez.`,
    ``, `📌 *${sub.event_title}*`,
    ``, `Entre em contato conosco para mais informações ou faça uma nova submissão.`,
    ``, `Acesse: https://coeaboa.lovable.app/`,
  ].join("\n");
}

export default function Eventos() {
  const { user, isAdmin, loading: authLoading } = useAuth();
  const permissions = usePermissions();
  const { data: fetchedSubmissions = [], isLoading: loading } =
    useSubmissionsQuery<Submission>({}, { enabled: !!user });
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  useEffect(() => {
    setSubmissions(fetchedSubmissions);
  }, [fetchedSubmissions]);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("pending");
  const [auditLogs, setAuditLogs] = useState<Record<string, { action: string; created_at: string; user_name: string }[]>>({});


  async function fetchAuditLog(eventId: string) {
    if (auditLogs[eventId]) return;
    const { data } = await supabase
      .from("event_audit_log")
      .select("action, created_at, user_id")
      .eq("event_id", eventId)
      .order("created_at", { ascending: false }) as any;
    if (data && data.length > 0) {
      // Fetch user names from profiles
      const userIds = [...new Set(data.map((d: any) => d.user_id))];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, responsible_name")
        .in("user_id", userIds as string[]);
      const nameMap: Record<string, string> = {};
      (profiles || []).forEach((p: any) => { nameMap[p.user_id] = p.responsible_name || "Usuário"; });
      setAuditLogs(prev => ({
        ...prev,
        [eventId]: data.map((d: any) => ({
          action: d.action,
          created_at: d.created_at,
          user_name: nameMap[d.user_id] || "Usuário",
        })),
      }));
    } else {
      setAuditLogs(prev => ({ ...prev, [eventId]: [] }));
    }
  }

  async function handleSoftDelete(id: string) {
    const { error } = await supabase.from("submissions").update({ deleted_at: new Date().toISOString() } as any).eq("id", id);
    if (error) {
      toast.error("Erro ao mover para lixeira");
    } else {
      toast.success("Evento movido para a lixeira");
      setSubmissions((prev) => prev.map((s) => s.id === id ? { ...s, deleted_at: new Date().toISOString() } : s));
      setExpandedId(null);
      if (user) await supabase.from("event_audit_log").insert({ event_id: id, user_id: user.id, action: "deleted" } as any);
    }
  }

  async function handleRestore(id: string) {
    const { error } = await supabase.from("submissions").update({ deleted_at: null } as any).eq("id", id);
    if (error) {
      toast.error("Erro ao restaurar evento");
    } else {
      toast.success("Evento restaurado!");
      setSubmissions((prev) => prev.map((s) => s.id === id ? { ...s, deleted_at: null } : s));
      if (user) await supabase.from("event_audit_log").insert({ event_id: id, user_id: user.id, action: "restored" } as any);
    }
  }

  async function handlePermanentDelete(id: string) {
    const { error } = await supabase.from("submissions").delete().eq("id", id);
    if (error) {
      toast.error("Erro ao excluir definitivamente");
    } else {
      toast.success("Evento excluído definitivamente");
      setSubmissions((prev) => prev.filter((s) => s.id !== id));
    }
  }

  async function logAudit(eventId: string, action: string, notes?: string) {
    if (!user) return;
    await supabase.from("event_audit_log").insert({
      event_id: eventId,
      user_id: user.id,
      action,
      notes: notes || null,
    } as any);
  }

   async function handleHighlightToggle(id: string, current: boolean) {
     const { error } = await supabase
       .from("submissions")
       .update({ is_highlight: !current } as any)
       .eq("id", id);
     if (error) {
       toast.error("Erro ao atualizar destaque");
     } else {
       toast.success(!current ? "Evento marcado como destaque!" : "Destaque removido");
       setSubmissions((prev) => prev.map((s) => s.id === id ? { ...s, is_highlight: !current } : s));
       await logAudit(id, !current ? "highlighted" : "unhighlighted");
     }
   }

  async function handleStatusChange(id: string, newStatus: string) {
    const { error } = await supabase.from("submissions").update({ status: newStatus } as any).eq("id", id);
    if (error) {
      toast.error("Erro ao atualizar status");
    } else {
      toast.success(newStatus === "approved" ? "Evento aprovado!" : newStatus === "rejected" ? "Evento rejeitado" : "Status atualizado");
      setSubmissions((prev) => prev.map((s) => s.id === id ? { ...s, status: newStatus } : s));
      await logAudit(id, newStatus);

      if (newStatus === "approved" || newStatus === "rejected") {
        const sub = submissions.find((s) => s.id === id);
        if (sub?.phone) {
          const phone = sub.phone.replace(/\D/g, "");
          const fullPhone = phone.startsWith("55") ? phone : `55${phone}`;
          const message = encodeURIComponent(buildNotificationMessage({ ...sub, status: newStatus }, newStatus));
          window.open(`https://wa.me/${fullPhone}?text=${message}`, "_blank");
        } else {
          toast.info("Anunciante sem telefone cadastrado.");
        }
      }
    }
  }

  const activeSubmissions = submissions.filter(s => !s.deleted_at);
  const trashedSubmissions = submissions.filter(s => !!s.deleted_at);

  const pendingEvents = activeSubmissions.filter(s => s.status === "pending");
  const confirmedEvents = activeSubmissions.filter(s => s.status === "approved");

  const getFiltered = (list: Submission[]) => {
    let result = [...list];
    if (categoryFilter !== "all") {
      result = result.filter((s) => s.category === categoryFilter);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (s) =>
          s.event_title.toLowerCase().includes(q) ||
          (s.company_name || "").toLowerCase().includes(q) ||
          (s.location || "").toLowerCase().includes(q) ||
          (s.responsible_name || "").toLowerCase().includes(q)
      );
    }
    return result;
  };

  const filteredPending = useMemo(() => getFiltered(pendingEvents), [pendingEvents, categoryFilter, search]);
  const filteredConfirmed = useMemo(() => getFiltered(confirmedEvents), [confirmedEvents, categoryFilter, search]);
  const filteredTrash = useMemo(() => getFiltered(trashedSubmissions), [trashedSubmissions, categoryFilter, search]);

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) return null;

  function renderEventCard(sub: Submission, options: { showApproval?: boolean; showTrashActions?: boolean } = {}) {
    const isExpanded = expandedId === sub.id;
    return (
      <Card
        key={sub.id}
        className={`border-border hover:shadow-md transition-all cursor-pointer ${isExpanded ? "ring-2 ring-primary/30" : ""}`}
        onClick={() => {
          const newId = isExpanded ? null : sub.id;
          setExpandedId(newId);
          if (newId) fetchAuditLog(newId);
        }}
      >
        <CardContent className="p-4 sm:p-5">
          {/* Summary */}
          <div className="flex items-center justify-between gap-3">
            <div className="flex-1 min-w-0 space-y-1.5">
              <div className="flex items-start gap-2 flex-wrap">
                 <div className="flex items-center gap-2">
                   {sub.is_highlight && <Badge className="bg-amber-500 hover:bg-amber-600 text-white border-0 text-[10px]">DESTAQUE</Badge>}
                   <h3 className="font-display font-semibold text-foreground text-base">{sub.event_title}</h3>
                 </div>
                <Badge variant="outline" className="text-xs shrink-0">
                  {categoryLabels[sub.category || ""] || "—"}
                </Badge>
                <Badge
                  variant={sub.status === "approved" ? "default" : sub.status === "rejected" ? "destructive" : "secondary"}
                  className="text-xs shrink-0"
                >
                  {sub.status === "approved" ? "✅ Aprovado" : sub.status === "rejected" ? "❌ Rejeitado" : "⏳ Pendente"}
                </Badge>
                {sub.stage && (
                  <Badge variant={stageBadgeVariant[sub.stage] || "outline"} className="text-xs shrink-0">
                    {stageLabels[sub.stage] || sub.stage}
                  </Badge>
                )}
              </div>
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                {sub.date && (
                  <span className="flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5" />
                    {formatBrazilianDate(sub.date)} {sub.start_time && `às ${sub.start_time}`}{sub.end_time && ` - ${sub.end_time}`}
                  </span>
                )}
                {sub.location && (
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5" />
                    {sub.location}
                  </span>
                )}
                {sub.responsible_person && (
                  <span className="flex items-center gap-1">
                    <Briefcase className="h-3.5 w-3.5" />
                    {sub.responsible_person}
                  </span>
                )}
              </div>
            </div>
            <div className="shrink-0 text-muted-foreground">
              {isExpanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
            </div>
          </div>

          {/* Expanded */}
          {isExpanded && (
            <div className="mt-4 pt-4 border-t border-border space-y-4 animate-in slide-in-from-top-2 duration-200" onClick={(e) => e.stopPropagation()}>
               <div className="flex flex-wrap gap-4 p-3 bg-muted/40 rounded-lg">
                 <div className="flex items-center gap-2">
                   <Users className="h-4 w-4 text-primary" />
                   <span className="text-sm"><strong>Visualizações:</strong> {sub.views_count || 0}</span>
                 </div>
                 <div className="flex items-center gap-2">
                   <Share2 className="h-4 w-4 text-primary" />
                   <span className="text-sm"><strong>Compartilhamentos:</strong> {sub.shares_count || 0}</span>
                 </div>
                 <Button
                   size="sm"
                   variant={sub.is_highlight ? "default" : "outline"}
                   className={`ml-auto h-8 text-xs ${sub.is_highlight ? 'bg-amber-500 hover:bg-amber-600 border-0' : ''}`}
                   onClick={(e) => {
                     e.stopPropagation();
                     handleHighlightToggle(sub.id, sub.is_highlight);
                   }}
                 >
                   {sub.is_highlight ? '★ Em Destaque' : '☆ Marcar Destaque'}
                 </Button>
               </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                {sub.company_name && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Building2 className="h-4 w-4 text-primary shrink-0" />
                    <span><strong>Empresa:</strong> {sub.company_name}</span>
                  </div>
                )}
                {sub.responsible_name && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Info className="h-4 w-4 text-primary shrink-0" />
                    <span><strong>Responsável:</strong> {sub.responsible_name}</span>
                  </div>
                )}
                {sub.phone && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Phone className="h-4 w-4 text-primary shrink-0" />
                    <span><strong>Telefone:</strong> {sub.phone}</span>
                  </div>
                )}
                {sub.email && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Mail className="h-4 w-4 text-primary shrink-0" />
                    <span><strong>Email:</strong> {sub.email}</span>
                  </div>
                )}
                 {sub.address_street && (
                   <div className="flex items-center gap-2 text-muted-foreground sm:col-span-2">
                     <MapPin className="h-4 w-4 text-primary shrink-0" />
                     <span><strong>Endereço:</strong> {[sub.address_street, sub.address_number, sub.address_neighborhood, sub.address_city, sub.address_state].filter(Boolean).join(", ")}{sub.address_zip ? ` – CEP: ${sub.address_zip}` : ""}</span>
                   </div>
                 )}

                 <div className="sm:col-span-2 mt-2 pt-2 border-t border-border flex flex-wrap gap-2">
                   <Button
                     size="sm"
                     variant="outline"
                     className="text-xs"
                     onClick={() => exportSingleEventPdf(sub as any)}
                   >
                     <FileDown className="h-3.5 w-3.5 mr-1" />
                     Baixar PDF Individual
                   </Button>

                   <Dialog>
                     <DialogTrigger asChild>
                       <Button size="sm" variant="outline" className="text-xs">
                         <ImageIcon className="h-3.5 w-3.5 mr-1" />
                         Card p/ Redes Sociais
                       </Button>
                     </DialogTrigger>
                   <DialogContent className="max-w-[450px] p-0 overflow-hidden border-0">
                       <div id={`event-card-${sub.id}`} className="bg-gradient-to-br from-primary via-primary to-primary/90 p-8 text-white aspect-square flex flex-col justify-between relative overflow-hidden">
                         {/* Abstract background shapes */}
                         <div className="absolute top-[-20%] right-[-20%] w-[70%] h-[70%] bg-white/10 rounded-full blur-3xl animate-pulse" />
                         <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-amber-500/20 rounded-full blur-2xl" />
                         <div className="absolute top-[40%] left-[20%] w-[30%] h-[30%] bg-white/5 rounded-full blur-xl" />
                         
                         <div className="relative z-10">
                           <div className="flex items-center justify-between mb-6">
                             <div className="flex items-center gap-2">
                               <div className="h-12 w-12 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center font-bold text-2xl shadow-lg border border-white/30">🌴</div>
                               <div className="flex flex-col">
                                 <span className="font-display font-black text-2xl tracking-tighter leading-none">AgendIlha</span>
                                 <span className="text-[10px] uppercase tracking-[0.2em] font-bold opacity-70">Agenda Cultural</span>
                               </div>
                             </div>
                             {sub.is_highlight && (
                               <Badge className="bg-amber-500 text-white border-0 animate-bounce shadow-lg px-3 py-1 font-bold">DESTAQUE 🔥</Badge>
                             )}
                           </div>
                           
                           <div className="space-y-4">
                             <Badge className="bg-white/20 hover:bg-white/30 text-white border-white/20 backdrop-blur-sm px-3 py-1">{categoryLabels[sub.category || ''] || 'Evento'}</Badge>
                             <h2 className="text-4xl font-display font-black leading-[1.1] uppercase tracking-tighter drop-shadow-md">{sub.event_title}</h2>
                           </div>
                         </div>

                         <div className="relative z-10 grid grid-cols-2 gap-4">
                           <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10 shadow-lg group hover:bg-white/20 transition-all">
                             <div className="flex items-center gap-3 mb-2">
                               <div className="h-8 w-8 rounded-full bg-amber-500/30 flex items-center justify-center"><CalendarDays className="h-4 w-4 text-amber-500" /></div>
                               <p className="text-[10px] uppercase opacity-70 font-bold tracking-widest">Quando</p>
                             </div>
                             <p className="font-bold text-lg leading-tight">{sub.date}<br/><span className="text-amber-500">{sub.start_time}</span></p>
                           </div>
                           
                           <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10 shadow-lg group hover:bg-white/20 transition-all">
                             <div className="flex items-center gap-3 mb-2">
                               <div className="h-8 w-8 rounded-full bg-blue-500/30 flex items-center justify-center"><MapPin className="h-4 w-4 text-blue-400" /></div>
                               <p className="text-[10px] uppercase opacity-70 font-bold tracking-widest">Onde</p>
                             </div>
                             <p className="font-bold text-lg leading-tight line-clamp-2">{sub.location}</p>
                           </div>
                         </div>

                         <div className="mt-8 pt-6 border-t border-white/20 relative z-10 flex items-center justify-between">
                           <div className="flex items-center gap-2">
                             <div className="h-8 w-8 rounded-full bg-white flex items-center justify-center p-1">
                               <img src="/lovable-uploads/61793740-3f9b-4638-ba33-df5e67272522.png" alt="QR" className="w-full h-full object-contain" />
                             </div>
                             <p className="text-[10px] font-bold opacity-80 leading-tight">Escaneie para<br/>ver detalhes</p>
                           </div>
                           <div className="text-right">
                             <p className="text-sm font-black italic tracking-tighter text-amber-500">#CoéABoaIlha</p>
                             <p className="text-[10px] font-mono opacity-50">agendilha.com.br</p>
                           </div>
                         </div>
                       </div>
                       <div className="p-4 bg-muted/50 border-t flex flex-col items-center gap-3">
                         <div className="flex items-center gap-2 text-primary font-bold animate-pulse">
                           <ImageIcon className="h-4 w-4" />
                           <p className="text-xs">CARD PRONTO PARA POSTAR!</p>
                         </div>
                         <p className="text-[10px] text-muted-foreground text-center px-4 italic leading-tight">DICA: No celular, pressione o card e escolha "Salvar" ou tire um print. No PC, use "Ferramenta de Captura" (Win+Shift+S).</p>
                       </div>
                     </DialogContent>
                   </Dialog>
                 </div>
                {sub.contact_social && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Globe className="h-4 w-4 text-primary shrink-0" />
                    <span><strong>Rede social:</strong> {sub.contact_social}</span>
                  </div>
                )}
              </div>

              {/* New fields */}
              {(sub.sale_price || sub.maintenance_cost || sub.subscription_info || sub.commission) && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm bg-muted/50 rounded-lg p-3">
                  {sub.sale_price && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <DollarSign className="h-4 w-4 text-primary shrink-0" />
                      <span><strong>Valor de venda:</strong> {sub.sale_price}</span>
                    </div>
                  )}
                  {sub.maintenance_cost && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <DollarSign className="h-4 w-4 text-primary shrink-0" />
                      <span><strong>Manutenção:</strong> {sub.maintenance_cost}</span>
                    </div>
                  )}
                  {sub.subscription_info && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Users className="h-4 w-4 text-primary shrink-0" />
                      <span><strong>Assinatura:</strong> {sub.subscription_info}</span>
                    </div>
                  )}
                  {sub.commission && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <DollarSign className="h-4 w-4 text-primary shrink-0" />
                      <span><strong>Comissão:</strong> {sub.commission}</span>
                    </div>
                  )}
                </div>
              )}

              {sub.description && (
                <div className="text-sm text-muted-foreground bg-muted/50 rounded-lg p-3">
                  <strong>Descrição:</strong>
                  <p className="mt-1 italic">"{sub.description}"</p>
                </div>
              )}

              {sub.concept_description && (
                <div className="text-sm text-muted-foreground bg-muted/50 rounded-lg p-3">
                  <strong>Conceito / Ideias:</strong>
                  <p className="mt-1">{sub.concept_description}</p>
                </div>
              )}

              <p className="text-xs text-muted-foreground/60">Enviado em {formatDate(sub.created_at)}</p>

              {/* Histórico de ações */}
              {auditLogs[sub.id] && auditLogs[sub.id].length > 0 && (
                <div className="bg-muted/50 rounded-lg p-3 space-y-2">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
                    <History className="h-3.5 w-3.5" />
                    Histórico
                  </div>
                  {auditLogs[sub.id].map((log, i) => {
                    const actionMap: Record<string, { icon: string; label: string }> = {
                      approved: { icon: "✅", label: "Aprovou" },
                      rejected: { icon: "❌", label: "Rejeitou" },
                      edited: { icon: "✏️", label: "Editou" },
                      deleted: { icon: "🗑️", label: "Moveu para lixeira" },
                      restored: { icon: "♻️", label: "Restaurou" },
                      pending: { icon: "⏳", label: "Voltou para pendente" },
                    };
                    const a = actionMap[log.action] || { icon: "📝", label: log.action };
                    return (
                      <div key={i} className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>{a.icon}</span>
                        <span className="font-medium">{log.user_name}</span>
                        <span>{a.label}</span>
                        <span className="ml-auto text-[10px] opacity-70">
                          {new Date(log.created_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Actions inside card */}
              <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-border">
                {options.showApproval && isAdmin && (
                  <div className="flex gap-1">
                    <Button
                      size="sm"
                      variant={sub.status === "approved" ? "default" : "outline"}
                      onClick={() => handleStatusChange(sub.id, sub.status === "approved" ? "pending" : "approved")}
                      className="text-xs"
                    >
                      <CheckCircle className="h-4 w-4 mr-1" />
                      Aprovar
                    </Button>
                    <Button
                      size="sm"
                      variant={sub.status === "rejected" ? "destructive" : "outline"}
                      onClick={() => handleStatusChange(sub.id, sub.status === "rejected" ? "pending" : "rejected")}
                      className="text-xs"
                    >
                      <XCircle className="h-4 w-4 mr-1" />
                      Rejeitar
                    </Button>
                  </div>
                )}
                <Button
                  size="sm"
                  onClick={() => window.open(`https://wa.me/?text=${buildWhatsAppMessage(sub)}`, "_blank")}
                  className="bg-[hsl(142,70%,40%)] hover:bg-[hsl(142,70%,35%)] text-primary-foreground text-xs"
                >
                  <MessageCircle className="mr-1.5 h-3.5 w-3.5" />
                  WhatsApp
                </Button>
                <Button size="sm" variant="outline" onClick={() => { exportSingleEventPdf(sub); toast.success("PDF gerado!"); }} className="text-xs">
                  <FileDown className="mr-1.5 h-3.5 w-3.5" />
                  PDF
                </Button>

                {options.showTrashActions ? (
                  <>
                    <Button size="sm" variant="outline" onClick={() => handleRestore(sub.id)} className="text-xs ml-auto">
                      <RotateCcw className="mr-1 h-3.5 w-3.5" />
                      Restaurar
                    </Button>
                    {isAdmin && (
                      <Button size="sm" variant="ghost" onClick={() => handlePermanentDelete(sub.id)} className="text-xs text-destructive hover:text-destructive">
                        <Trash2 className="mr-1 h-3.5 w-3.5" />
                        Excluir definitivamente
                      </Button>
                    )}
                  </>
                ) : (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleSoftDelete(sub.id)}
                    className="text-xs text-destructive hover:text-destructive ml-auto"
                  >
                    <Trash2 className="mr-1 h-3.5 w-3.5" />
                    Remover
                  </Button>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  function renderList(list: Submission[], options: { showApproval?: boolean; showTrashActions?: boolean } = {}) {
    if (loading) {
      return (
        <div className="flex justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      );
    }
    if (list.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <CalendarDays className="h-12 w-12 text-muted-foreground/40 mb-3" />
          <p className="text-muted-foreground text-sm">Nenhum evento encontrado.</p>
        </div>
      );
    }
    return (
      <div className="space-y-4">
        {list.map((sub) => renderEventCard(sub, options))}
      </div>
    );
  }

  // Block regular users - only collaborators and admins
  if (!permissions.loaded) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAdmin && !permissions.isCollaborator) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-6">
      {/* Modern dashboard header */}
      <div className="mb-6 rounded-2xl border border-border bg-card/60 backdrop-blur-md p-5 shadow-sm animate-in fade-in duration-300">
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
          <div className="flex flex-wrap items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                exportBulkEventsPdf(confirmedEvents);
                toast.success("PDF gerado!");
              }}
              disabled={confirmedEvents.length === 0}
              className="text-xs rounded-full"
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
                  const weekApproved = confirmedEvents.filter((s) => {
                    if (!s.date) return false;
                    const d = parseEventDate(s.date);
                    return d && d >= start && d <= end;
                  });
                  if (weekApproved.length === 0) {
                    toast.warning("Nenhum evento confirmado para esta semana.");
                    return;
                  }
                  const msg = buildBulkWhatsAppMessage(weekApproved);
                  window.open(`https://wa.me/?text=${msg}`, "_blank");
                  toast.success(`Mensagem com ${weekApproved.length} evento(s) da semana!`);
                }}
                className="text-xs rounded-full bg-primary text-primary-foreground hover:bg-primary/90"
              >
                <Send className="mr-1.5 h-3.5 w-3.5" />
                Divulgar semana
              </Button>
            )}
          </div>
        </div>

        {/* Status cards */}
        <div className="mt-5 grid grid-cols-2 sm:grid-cols-3 gap-3">
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

      {/* Search/Filter */}
      <Card className="mb-5 border-border">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3">
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
              <SelectTrigger className="w-full sm:w-[180px] h-10">
                <SelectValue placeholder="Categoria" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas categorias</SelectItem>
                {Object.entries(categoryLabels).map(([k, v]) => (
                  <SelectItem key={k} value={k}>{v}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
         <TabsList className="w-full grid grid-cols-2 sm:grid-cols-4">
           <TabsTrigger value="marketing" className="text-xs sm:text-sm">
             📣 Divulgação
           </TabsTrigger>
         <TabsContent value="marketing" className="space-y-6">
           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             {/* PDF Export Section */}
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
                       exportEditorialAgendaPdf(dayEvents, "Agenda do Dia");
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
                       exportEditorialAgendaPdf(confirmedEvents, "Agenda da Semana");
                       toast.success("PDF da agenda completa gerado!");
                     }}
                   >
                     <FileDown className="mr-2 h-4 w-4" />
                     Agenda Completa
                   </Button>
                 </div>
               </CardContent>
             </Card>

             {/* WhatsApp Share Section */}
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

           {/* Highlights Management */}
           <div className="space-y-4">
             <div className="flex items-center justify-between">
               <h3 className="font-bold flex items-center gap-2">
                 <Megaphone className="h-5 w-5 text-amber-500" />
                 Eventos em Destaque
               </h3>
               <Badge variant="secondary">{confirmedEvents.filter(e => e.is_highlight).length} Ativos</Badge>
             </div>
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
               {confirmedEvents.filter(e => e.is_highlight).map(ev => renderEventCard(ev))}
               {confirmedEvents.filter(e => e.is_highlight).length === 0 && (
                 <div className="col-span-full py-10 text-center border-2 border-dashed rounded-xl text-muted-foreground">
                   Nenhum evento marcado como destaque no momento.
                 </div>
               )}
             </div>
           </div>
         </TabsContent>

          <TabsTrigger value="pending" className="text-xs sm:text-sm">
            A serem liberados
            <Badge variant="secondary" className="ml-1.5 text-xs">{pendingEvents.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="confirmed" className="text-xs sm:text-sm">
            Confirmados
            <Badge variant="secondary" className="ml-1.5 text-xs">{confirmedEvents.length}</Badge>
          </TabsTrigger>
          {(isAdmin || permissions.canDelete) && (
            <TabsTrigger value="trash" className="text-xs sm:text-sm">
              🗑️ Lixeira
              <Badge variant="secondary" className="ml-1.5 text-xs">{trashedSubmissions.length}</Badge>
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="pending">
          {!permissions.canApprove ? (
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

        {(isAdmin || permissions.canDelete) && (
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

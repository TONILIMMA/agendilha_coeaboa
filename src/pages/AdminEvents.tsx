import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Navigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  CalendarDays, Loader2, MessageCircle, Trash2, Search,
  FileDown, SlidersHorizontal, MapPin, Clock, Building2,
  CheckCircle, XCircle, Clock3, ChevronDown, ChevronUp,
   Phone, Mail, Globe, Info, Send, Star, TrendingUp, BarChart3,
} from "lucide-react";
import { toast } from "sonner";
 import { exportSingleEventPdf, exportBulkEventsPdf } from "@/lib/pdfExport";
 import Header from "@/components/Header";

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
}

const categoryLabels: Record<string, string> = {
  musica: "Música / Show",
  gastronomia: "Gastronomia",
  cultura: "Cultura / Arte",
  esporte: "Esporte",
  promocoes: "Promoções / Ofertas",
  outros: "Outros",
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

  const lines: string[] = [
    `📌 *AGENDILHA* - Eventos Confirmados da Semana`,
    `📅 ${formatBR(start)} a ${formatBR(endOfWeek)}`,
    ``,
    `*Para mais informações:*`,
    `https://coeaboa.lovable.app/`,
    ``,
  ];

  const byDate = new Map<string, Submission[]>();
  events.forEach((ev) => {
    const key = ev.date || "Sem data";
    if (!byDate.has(key)) byDate.set(key, []);
    byDate.get(key)!.push(ev);
  });

   const sortedDates = Array.from(byDate.keys()).sort((a, b) => {
     const da = parseEventDate(a);
     const db = parseEventDate(b);
     if (!da || !db) return a.localeCompare(b);
     return da.getTime() - db.getTime();
   });

  sortedDates.forEach((dateKey) => {
    const dayOfWeek = getDayOfWeek(dateKey);
    lines.push(`━━━━━━━━━━━━━━━`);
    lines.push(`🗓️ *${dayOfWeek ? dayOfWeek + " - " : ""}${dateKey}*`);
    lines.push(``);

    byDate.get(dateKey)!.forEach((ev) => {
      lines.push(`🎙️ ${ev.start_time || ""}${ev.end_time ? ` às ${ev.end_time}` : ""} - *${ev.event_title}*`);
      if (ev.location) lines.push(`📍 ${ev.location}`);
      if (ev.category) lines.push(`🏷️ ${categoryLabels[ev.category] || ev.category}`);
      lines.push(``);
    });
  });

   lines.push(`✔️ Mais informações e agenda completa:`);
   lines.push(`https://agendilha-divulgacao.lovable.app/agenda`);

  return encodeURIComponent(lines.join("\n"));
}

function downloadEventPdf(sub: Submission) {
  exportSingleEventPdf(sub);
  toast.success("PDF gerado com sucesso!");
}

export default function AdminEvents() {
  const { user, isAdmin, loading: authLoading } = useAuth();
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
   const [expandedId, setExpandedId] = useState<string | null>(null);
   const [showStats, setShowStats] = useState(false);
   async function toggleHighlight(id: string, current: boolean) {
     const { error } = await supabase
       .from("submissions")
       .update({ is_highlight: !current })
       .eq("id", id);
     
     if (error) {
       toast.error("Erro ao atualizar destaque");
     } else {
       toast.success(!current ? "Evento em destaque! 🔥" : "Destaque removido");
       setSubmissions(prev => prev.map(s => s.id === id ? { ...s, is_highlight: !current } : s));
     }
   }
 
  const [sortBy, setSortBy] = useState<"newest" | "oldest" | "date">("newest");

  async function fetchAll() {
    setLoading(true);
    const { data, error } = await supabase
      .from("submissions")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) {
      toast.error("Erro ao carregar eventos");
    } else {
      setSubmissions(data || []);
    }
    setLoading(false);
  }

  useEffect(() => {
    if (isAdmin) fetchAll();
  }, [isAdmin]);

  async function handleDelete(id: string) {
    const { error } = await supabase.from("submissions").delete().eq("id", id);
    if (error) {
      toast.error("Erro ao remover evento");
    } else {
      toast.success("Evento removido");
      setSubmissions((prev) => prev.filter((s) => s.id !== id));
    }
  }

  function buildNotificationMessage(sub: Submission, status: string): string {
    if (status === "approved") {
      return [
        `✅ *Evento Aprovado!*`,
        ``,
        `Olá${sub.responsible_name ? `, ${sub.responsible_name}` : ""}! Seu evento foi aprovado no *AgendIlha*! 🎉`,
        ``,
        `📌 *${sub.event_title}*`,
        sub.date ? `🗓️ ${sub.date}${sub.start_time ? ` às ${sub.start_time}` : ""}` : "",
        ``,
        `Seu evento será divulgado na agenda cultural da Ilha do Governador.`,
        ``,
        `Acesse: https://coeaboa.lovable.app/`,
      ].filter(Boolean).join("\n");
    } else {
      const reason = (sub as any).rejection_reason as string | null | undefined;
      return [
        `⚠️ *Atualização sobre seu evento*`,
        ``,
        `Olá${sub.responsible_name ? `, ${sub.responsible_name}` : ""}! Infelizmente seu evento não foi aprovado desta vez.`,
        ``,
        `📌 *${sub.event_title}*`,
        ``,
        reason ? `📝 *Motivo:* ${reason}` : "",
        reason ? `` : "",
        `Você pode ajustar e reenviar pelo app, em "Envios".`,
        ``,
        `Acesse: https://coeaboa.lovable.app/`,
      ].filter(Boolean).join("\n");
    }
  }

  async function handleStatusChange(id: string, newStatus: string) {
    let rejectionReason: string | null = null;
    if (newStatus === "rejected") {
      const reason = window.prompt(
        "Informe o motivo da reprovação (será exibido ao divulgador):",
        ""
      );
      if (reason === null) return; // cancelled
      rejectionReason = reason.trim() || null;
    }

    const updatePayload: any = { status: newStatus };
    if (newStatus === "rejected") updatePayload.rejection_reason = rejectionReason;
    if (newStatus === "approved" || newStatus === "pending") updatePayload.rejection_reason = null;

    const { error } = await supabase.from("submissions").update(updatePayload).eq("id", id);
    if (error) {
      toast.error("Erro ao atualizar status");
    } else {
      toast.success(newStatus === "approved" ? "Evento aprovado!" : newStatus === "rejected" ? "Evento rejeitado" : "Status atualizado");
      setSubmissions((prev) => prev.map((s) => s.id === id ? { ...s, status: newStatus, ...(("rejection_reason" in updatePayload) ? { rejection_reason: updatePayload.rejection_reason } : {}) } as any : s));

      // Send WhatsApp notification to advertiser
      if (newStatus === "approved" || newStatus === "rejected") {
        const sub = submissions.find((s) => s.id === id);
        if (sub?.phone) {
          const phone = sub.phone.replace(/\D/g, "");
          const fullPhone = phone.startsWith("55") ? phone : `55${phone}`;
          const message = encodeURIComponent(buildNotificationMessage({ ...sub, status: newStatus, rejection_reason: rejectionReason } as any, newStatus));
          window.open(`https://wa.me/${fullPhone}?text=${message}`, "_blank");
        } else {
          toast.info("Anunciante sem telefone cadastrado. Notificação não enviada.");
        }
      }
    }
  }

  const filtered = useMemo(() => {
    let list = [...submissions];

    if (categoryFilter !== "all") {
      list = list.filter((s) => s.category === categoryFilter);
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (s) =>
          s.event_title.toLowerCase().includes(q) ||
          (s.company_name || "").toLowerCase().includes(q) ||
          (s.location || "").toLowerCase().includes(q) ||
          (s.responsible_name || "").toLowerCase().includes(q)
      );
    }

    if (sortBy === "oldest") {
      list.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
    } else if (sortBy === "date") {
      list.sort((a, b) => (a.date || "").localeCompare(b.date || ""));
    }

    return list;
  }, [submissions, categoryFilter, search, sortBy]);

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user || !isAdmin) return <Navigate to="/" replace />;

   return (
     <div className="min-h-screen bg-background">
       <Header />
       <div className="mx-auto max-w-5xl px-4 py-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6">
        <div className="flex items-center gap-2">
          <CalendarDays className="h-6 w-6 text-primary" />
          <h1 className="text-xl font-display font-bold text-foreground">Todos os Eventos</h1>
          <Badge variant="secondary" className="text-xs">{filtered.length}</Badge>
        </div>
        <div className="flex flex-wrap items-center gap-2">
           <div className="flex gap-2">
             <Button
               size="sm"
               variant={showStats ? "default" : "outline"}
               onClick={() => setShowStats(!showStats)}
               className="text-xs"
             >
               <BarChart3 className="mr-1.5 h-3.5 w-3.5" />
               {showStats ? "Ocultar Métricas" : "Ver Métricas"}
             </Button>
             <Button
               size="sm"
               variant="outline"
               onClick={() => {
                 exportBulkEventsPdf(filtered);
                 toast.success("PDF com todos os eventos gerado!");
               }}
               disabled={filtered.length === 0}
               className="text-xs"
             >
               <FileDown className="mr-1.5 h-3.5 w-3.5" />
               Exportar Agenda (PDF)
             </Button>
           </div>
          <Button
            size="sm"
            onClick={() => {
              const { start, end } = getWeekRange();
              const weekApproved = submissions.filter((s) => {
                if (s.status !== "approved") return false;
                if (!s.date) return false;
                const d = parseEventDate(s.date);
                return d && d >= start && d <= end;
              });
              if (weekApproved.length === 0) {
                toast.warning("Nenhum evento aprovado encontrado para esta semana.");
                return;
              }
              const msg = buildBulkWhatsAppMessage(weekApproved);
              window.open(`https://wa.me/?text=${msg}`, "_blank");
              toast.success(`Mensagem gerada com ${weekApproved.length} evento(s) da semana!`);
            }}
            className="bg-[hsl(142,70%,40%)] hover:bg-[hsl(142,70%,35%)] text-white text-xs"
          >
            <Send className="mr-1.5 h-3.5 w-3.5" />
            Enviar para Divulgação
          </Button>
        </div>
      </div>

      {/* Filters */}
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
                <SlidersHorizontal className="h-4 w-4 mr-1.5 text-muted-foreground" />
                <SelectValue placeholder="Categoria" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas categorias</SelectItem>
                {Object.entries(categoryLabels).map(([k, v]) => (
                  <SelectItem key={k} value={k}>{v}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={sortBy} onValueChange={(v) => setSortBy(v as any)}>
              <SelectTrigger className="w-full sm:w-[160px] h-10">
                <SelectValue placeholder="Ordenar" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Mais recente</SelectItem>
                <SelectItem value="oldest">Mais antigo</SelectItem>
                <SelectItem value="date">Data do evento</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* List */}
      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <CalendarDays className="h-12 w-12 text-muted-foreground/40 mb-3" />
          <p className="text-muted-foreground text-sm">Nenhum evento encontrado.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((sub) => (
            <Card
              key={sub.id}
              className={`border-border hover:shadow-md transition-all cursor-pointer ${expandedId === sub.id ? "ring-2 ring-primary/30" : ""}`}
              onClick={() => setExpandedId(expandedId === sub.id ? null : sub.id)}
            >
              <CardContent className="p-4 sm:p-5">
                {/* Summary row - always visible */}
                <div className="flex items-center justify-between gap-3">
                  <div className="flex-1 min-w-0 space-y-1.5">
                    <div className="flex items-start gap-2 flex-wrap">
                      <h3 className="font-display font-semibold text-foreground text-base">
                        {sub.event_title}
                      </h3>
                      <Badge variant="outline" className="text-xs shrink-0">
                        {categoryLabels[sub.category || ""] || "—"}
                      </Badge>
                       <div className="flex items-center gap-1.5">
                         {sub.is_highlight && (
                           <Badge className="bg-amber-500 hover:bg-amber-600 text-white border-0 text-[10px] h-5">
                             🔥 DESTAQUE
                           </Badge>
                         )}
                         <Badge
                           variant={sub.status === "approved" ? "default" : sub.status === "rejected" ? "destructive" : "secondary"}
                           className="text-xs shrink-0"
                         >
                           {sub.status === "approved" ? "✅ Aprovado" : sub.status === "rejected" ? "❌ Rejeitado" : "⏳ Pendente"}
                         </Badge>
                       </div>
                     {showStats && (
                       <div className="flex items-center gap-4 mt-2 pt-2 border-t border-border/50">
                         <div className="flex items-center gap-1 text-[10px] font-medium text-muted-foreground">
                           <TrendingUp className="h-3 w-3 text-blue-500" />
                           {sub.views_count || 0} visualizações
                         </div>
                         <div className="flex items-center gap-1 text-[10px] font-medium text-muted-foreground">
                           <MessageCircle className="h-3 w-3 text-green-500" />
                           {sub.shares_count || 0} compartilhamentos
                          </div>
                        </div>
                      )}
 
                     <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                      {sub.date && (
                        <span className="flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5" />
                          {sub.date} {sub.start_time && `às ${sub.start_time}`}{sub.end_time && ` - ${sub.end_time}`}
                        </span>
                      )}
                      {sub.location && (
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3.5 w-3.5" />
                          {sub.location}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="shrink-0 text-muted-foreground">
                    {expandedId === sub.id ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                  </div>
                </div>

                {/* Expanded details */}
                {expandedId === sub.id && (
                  <div className="mt-4 pt-4 border-t border-border space-y-4 animate-in slide-in-from-top-2 duration-200" onClick={(e) => e.stopPropagation()}>
                    {/* Full details */}
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
                      {sub.contact_social && (
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Globe className="h-4 w-4 text-primary shrink-0" />
                          <span><strong>Rede social:</strong> {sub.contact_social}</span>
                        </div>
                      )}
                      {sub.video_link && (
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Globe className="h-4 w-4 text-primary shrink-0" />
                          <span><strong>Vídeo:</strong> <a href={sub.video_link} target="_blank" rel="noopener noreferrer" className="text-primary underline">{sub.video_link}</a></span>
                        </div>
                      )}
                    </div>

                    {sub.description && (
                      <div className="text-sm text-muted-foreground bg-muted/50 rounded-lg p-3">
                        <strong>Descrição:</strong>
                        <p className="mt-1 italic">"{sub.description}"</p>
                      </div>
                    )}

                    {(sub.promotion_type || sub.target_audience || sub.promotion_rules) && (
                      <div className="text-sm text-muted-foreground bg-muted/50 rounded-lg p-3 space-y-1">
                        {sub.promotion_type && <p><strong>Tipo de promoção:</strong> {sub.promotion_type}</p>}
                        {sub.target_audience && <p><strong>Público-alvo:</strong> {sub.target_audience}</p>}
                        {sub.promotion_rules && <p><strong>Regras:</strong> {sub.promotion_rules}</p>}
                      </div>
                    )}

                    {sub.additional_details && (
                      <div className="text-sm text-muted-foreground bg-muted/50 rounded-lg p-3">
                        <strong>Detalhes adicionais:</strong>
                        <p className="mt-1">{sub.additional_details}</p>
                      </div>
                    )}

                    <p className="text-xs text-muted-foreground/60">
                      Enviado em {formatDate(sub.created_at)}
                    </p>

                     {/* Actions */}
                     <div className="flex flex-col gap-4 pt-2 border-t border-border">
                       <div className="flex flex-wrap items-center gap-2">
                         <div className="flex gap-1">
                           <Button
                             size="sm"
                             variant={sub.status === "approved" ? "default" : "outline"}
                             onClick={() => handleStatusChange(sub.id, sub.status === "approved" ? "pending" : "approved")}
                             className="text-xs"
                             title="Aprovar"
                           >
                             <CheckCircle className="h-4 w-4 mr-1" />
                             Aprovar
                           </Button>
                           <Button
                             size="sm"
                             variant={sub.status === "rejected" ? "destructive" : "outline"}
                             onClick={() => handleStatusChange(sub.id, sub.status === "rejected" ? "pending" : "rejected")}
                             className="text-xs"
                             title="Rejeitar"
                           >
                             <XCircle className="h-4 w-4 mr-1" />
                             Rejeitar
                           </Button>
                           <Button
                             size="sm"
                             variant={sub.is_highlight ? "secondary" : "outline"}
                             className={sub.is_highlight ? "bg-amber-100 text-amber-700 border-amber-200" : "text-amber-600 border-amber-200 hover:bg-amber-50"}
                             onClick={() => toggleHighlight(sub.id, !!sub.is_highlight)}
                           >
                             <Star className={`h-4 w-4 mr-1 ${sub.is_highlight ? "fill-amber-500" : ""}`} />
                             {sub.is_highlight ? "Remover Destaque" : "Destacar"}
                           </Button>
                         </div>
                         <Button
                           size="sm"
                           onClick={() => window.open(`https://wa.me/?text=${buildWhatsAppMessage(sub)}`, "_blank")}
                           className="bg-[hsl(142,70%,40%)] hover:bg-[hsl(142,70%,35%)] text-white text-xs"
                         >
                           <MessageCircle className="mr-1.5 h-3.5 w-3.5" />
                           WhatsApp
                         </Button>
                         <Button
                           size="sm"
                           variant="outline"
                           onClick={() => downloadEventPdf(sub)}
                           className="text-xs"
                         >
                           <FileDown className="mr-1.5 h-3.5 w-3.5" />
                           PDF
                         </Button>
                         <Button
                           size="sm"
                           variant="ghost"
                           onClick={() => handleDelete(sub.id)}
                           className="text-xs text-destructive hover:text-destructive ml-auto"
                         >
                           <Trash2 className="mr-1 h-3.5 w-3.5" />
                           Excluir
                         </Button>
                       </div>
 
                       {sub.status === "approved" && (
                         <div className="bg-primary/5 p-3 rounded-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border border-primary/10">
                           <div className="flex items-center gap-2 text-xs font-medium text-primary">
                             <Send className="h-4 w-4" />
                             Pronto para divulgação multiformato
                           </div>
                           <div className="flex gap-2 w-full sm:w-auto">
                             <div className="text-[10px] text-muted-foreground mr-2 self-center hidden md:block italic">
                               Visualize antes de enviar:
                             </div>
                             <Button 
                               size="sm" 
                               variant="ghost" 
                               className="h-8 text-[10px] hover:bg-primary/10 flex-1 sm:flex-none"
                               onClick={() => {
                                 const msg = buildWhatsAppMessage(sub);
                                 toast.info("Prévia da mensagem carregada!");
                                 window.open(`https://wa.me/?text=${msg}`, "_blank");
                               }}
                             >
                               Preview WhatsApp
                             </Button>
                             <Button 
                               size="sm" 
                               variant="ghost" 
                               className="h-8 text-[10px] hover:bg-primary/10 flex-1 sm:flex-none"
                               onClick={() => downloadEventPdf(sub)}
                             >
                               Preview PDF
                             </Button>
                           </div>
                         </div>
                       )}
                     </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
       )}
     </div>
     </div>
   );
 }

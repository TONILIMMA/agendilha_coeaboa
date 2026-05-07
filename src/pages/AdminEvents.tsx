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
   RotateCcw, LayoutDashboard, Edit, ExternalLink,
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


  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user || !isAdmin) return <Navigate to="/" replace />;

    const kpis = useMemo(() => {
      return {
        total: submissions.length,
        pending: submissions.filter(s => s.status === 'pending').length,
        analysis: submissions.filter(s => s.status === 'analysis').length,
        approved: submissions.filter(s => s.status === 'approved').length,
        rejected: submissions.filter(s => s.status === 'rejected').length,
        published: submissions.filter(s => s.status === 'published').length,
      };
    }, [submissions]);

    const [statusFilter, setStatusFilter] = useState("all");

    const filtered = useMemo(() => {
      let list = [...submissions];
      if (statusFilter !== "all") list = list.filter(s => s.status === statusFilter);
      if (categoryFilter !== "all") list = list.filter(s => s.category === categoryFilter);
      if (search.trim()) {
        const q = search.toLowerCase();
        list = list.filter(s => 
          s.event_title.toLowerCase().includes(q) ||
          (s.company_name || "").toLowerCase().includes(q) ||
          (s.location || "").toLowerCase().includes(q)
        );
      }
      return list;
    }, [submissions, statusFilter, categoryFilter, search]);

    return (
      <div className="min-h-screen bg-muted/30">
        <div className="mx-auto max-w-7xl px-4 py-8">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-foreground">Gestão de Eventos</h1>
              <p className="text-muted-foreground mt-1">Moderação, revisão e distribuição de eventos da Ilha.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm" onClick={() => fetchAll()}>
                <RotateCcw className="h-4 w-4 mr-2" /> Atualizar
              </Button>
              <Button variant="outline" size="sm" onClick={() => exportBulkEventsPdf(filtered)}>
                <FileDown className="h-4 w-4 mr-2" /> Exportar PDF
              </Button>
              <Button 
                size="sm" 
                className="bg-green-600 hover:bg-green-700 text-white"
                onClick={() => {
                  const approved = submissions.filter(s => s.status === 'approved');
                  if (approved.length === 0) {
                    toast.warning("Nenhum evento aprovado para divulgar.");
                    return;
                  }
                  const msg = buildBulkWhatsAppMessage(approved);
                  window.open(`https://wa.me/?text=${msg}`, "_blank");
                }}
              >
                <MessageCircle className="h-4 w-4 mr-2" /> Divulgar WhatsApp
              </Button>
            </div>
          </div>

          {/* KPIs */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
            {[
              { label: 'Total', value: kpis.total, color: 'text-blue-600', bg: 'bg-blue-50' },
              { label: 'Pendentes', value: kpis.pending, color: 'text-amber-600', bg: 'bg-amber-50' },
              { label: 'Em Análise', value: kpis.analysis, color: 'text-purple-600', bg: 'bg-purple-50' },
              { label: 'Aprovados', value: kpis.approved, color: 'text-green-600', bg: 'bg-green-50' },
              { label: 'Rejeitados', value: kpis.rejected, color: 'text-red-600', bg: 'bg-red-50' },
              { label: 'Publicados', value: kpis.published, color: 'text-indigo-600', bg: 'bg-indigo-50' },
            ].map((kpi) => (
              <Card key={kpi.label} className={`${kpi.bg} border-none shadow-sm`}>
                <CardContent className="p-4 pt-4">
                  <p className="text-xs font-medium uppercase text-muted-foreground">{kpi.label}</p>
                  <p className={`text-2xl font-bold ${kpi.color}`}>{kpi.value}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Filters Area */}
          <Card className="mb-6">
            <CardContent className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input 
                    placeholder="Buscar evento..." 
                    className="pl-9" 
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                  />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os Status</SelectItem>
                    <SelectItem value="pending">Pendentes</SelectItem>
                    <SelectItem value="analysis">Em Análise</SelectItem>
                    <SelectItem value="approved">Aprovados</SelectItem>
                    <SelectItem value="rejected">Rejeitados</SelectItem>
                    <SelectItem value="published">Publicados</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas as Categorias</SelectItem>
                    {Object.entries(categoryLabels).map(([k, v]) => (
                      <SelectItem key={k} value={k}>{v}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="flex gap-2">
                  <Button variant="outline" className="flex-1" onClick={() => {
                    setSearch("");
                    setStatusFilter("all");
                    setCategoryFilter("all");
                  }}>Limpar</Button>
                </div>
              </div>
            </CardContent>
          </Card>

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

          {/* Event Listing Table/Cards */}
          <div className="bg-card border border-border rounded-lg overflow-hidden shadow-sm">
            <div className="hidden md:grid grid-cols-12 gap-4 p-4 border-b bg-muted/20 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              <div className="col-span-4">Evento / Categoria</div>
              <div className="col-span-2 text-center">Data / Horário</div>
              <div className="col-span-2 text-center">Responsável</div>
              <div className="col-span-2 text-center">Status</div>
              <div className="col-span-2 text-right">Ações</div>
            </div>
            
            {loading ? (
              <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
            ) : filtered.length === 0 ? (
              <div className="py-12 text-center text-muted-foreground">Nenhum evento encontrado para os filtros selecionados.</div>
            ) : (
              <div className="divide-y divide-border">
                {filtered.map((sub) => (
                  <div key={sub.id} className="p-4 hover:bg-muted/5 transition-colors">
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
                      {/* Event/Category */}
                      <div className="col-span-4 space-y-1">
                        <div className="flex items-center gap-2">
                          {sub.is_highlight && <Star className="h-3.5 w-3.5 text-amber-500 fill-amber-500" />}
                          <h3 className="font-semibold text-foreground truncate">{sub.event_title}</h3>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-[10px] py-0">{categoryLabels[sub.category || ''] || 'Outros'}</Badge>
                          <span className="text-[10px] text-muted-foreground">Envio: {formatDate(sub.created_at)}</span>
                        </div>
                      </div>
                      
                      {/* Date/Time */}
                      <div className="col-span-2 text-center text-sm">
                        <div className="font-medium text-foreground">{sub.date || 'Sem data'}</div>
                        <div className="text-xs text-muted-foreground">{sub.start_time || '--:--'} {sub.end_time ? `- ${sub.end_time}` : ''}</div>
                      </div>

                      {/* Responsible */}
                      <div className="col-span-2 text-center text-sm truncate">
                        <div className="font-medium text-foreground">{sub.company_name || sub.responsible_name || '—'}</div>
                        {sub.phone && <div className="text-[10px] text-muted-foreground">{sub.phone}</div>}
                      </div>

                      {/* Status */}
                      <div className="col-span-2 text-center">
                        <Badge 
                          variant={
                            sub.status === 'approved' ? 'default' : 
                            sub.status === 'rejected' ? 'destructive' : 
                            sub.status === 'analysis' ? 'outline' : 'secondary'
                          }
                          className="text-[10px]"
                        >
                          {
                            sub.status === 'approved' ? 'Aprovado' : 
                            sub.status === 'rejected' ? 'Rejeitado' : 
                            sub.status === 'analysis' ? 'Em Análise' : 
                            sub.status === 'published' ? 'Publicado' : 'Pendente'
                          }
                        </Badge>
                      </div>

                      {/* Actions */}
                      <div className="col-span-2 flex justify-end gap-1">
                        <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setExpandedId(expandedId === sub.id ? null : sub.id)} title="Ver Detalhes">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button size="icon" variant="ghost" className="h-8 w-8 text-blue-600" title="Editar">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          size="icon" 
                          variant="ghost" 
                          className={`h-8 w-8 ${sub.status === 'approved' ? 'text-green-600' : 'text-muted-foreground'}`}
                          onClick={() => handleStatusChange(sub.id, 'approved')}
                          title="Aprovar"
                        >
                          <CheckCircle className="h-4 w-4" />
                        </Button>
                        <Button 
                          size="icon" 
                          variant="ghost" 
                          className="h-8 w-8 text-destructive" 
                          onClick={() => handleDelete(sub.id)}
                          title="Excluir"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    {/* Expanded Content */}
                    {expandedId === sub.id && (
                      <div className="mt-4 p-4 bg-muted/30 rounded-lg border border-border/50 animate-in slide-in-from-top-2">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                          <div className="space-y-4">
                            <div>
                              <h4 className="text-xs font-bold uppercase text-muted-foreground mb-2">Informações Gerais</h4>
                              <div className="space-y-2 text-sm text-foreground">
                                <p className="flex items-center gap-2"><MapPin className="h-3.5 w-3.5 text-primary" /> {sub.location || 'Local não informado'}</p>
                                {sub.address_street && <p className="text-xs text-muted-foreground ml-5">{sub.address_street}, {sub.address_number} - {sub.address_neighborhood}</p>}
                                {sub.email && <p className="flex items-center gap-2"><Mail className="h-3.5 w-3.5 text-primary" /> {sub.email}</p>}
                                {sub.contact_social && <p className="flex items-center gap-2"><Globe className="h-3.5 w-3.5 text-primary" /> {sub.contact_social}</p>}
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <Button variant="outline" size="sm" className="text-xs" onClick={() => downloadEventPdf(sub)}>
                                <FileDown className="h-3.5 w-3.5 mr-1.5" /> PDF Individual
                              </Button>
                              <Button variant="outline" size="sm" className="text-xs" onClick={() => window.open(`https://wa.me/?text=${buildWhatsAppMessage(sub)}`, "_blank")}>
                                <MessageCircle className="h-3.5 w-3.5 mr-1.5" /> Texto WhatsApp
                              </Button>
                            </div>
                          </div>

                          <div className="md:col-span-2 space-y-4">
                            <div>
                              <h4 className="text-xs font-bold uppercase text-muted-foreground mb-2">Descrição / Promoção</h4>
                              <p className="text-sm text-foreground bg-white p-3 rounded border border-border/40 whitespace-pre-wrap">{sub.description || 'Nenhuma descrição fornecida.'}</p>
                            </div>
                            {sub.additional_details && (
                              <div>
                                <h4 className="text-xs font-bold uppercase text-muted-foreground mb-2">Observações Internas / Extras</h4>
                                <p className="text-sm text-foreground bg-amber-50 p-3 rounded border border-amber-100">{sub.additional_details}</p>
                              </div>
                            )}
                            <div className="flex flex-wrap gap-2 pt-2">
                              <Button size="sm" variant={sub.status === 'analysis' ? 'default' : 'outline'} onClick={() => handleStatusChange(sub.id, 'analysis')}>Analisar</Button>
                              <Button size="sm" variant={sub.status === 'rejected' ? 'destructive' : 'outline'} onClick={() => handleStatusChange(sub.id, 'rejected')}>Reprovar</Button>
                              <Button size="sm" variant={sub.is_highlight ? 'secondary' : 'outline'} className={sub.is_highlight ? 'bg-amber-100' : ''} onClick={() => toggleHighlight(sub.id, !!sub.is_highlight)}>
                                <Star className={`h-4 w-4 mr-1.5 ${sub.is_highlight ? 'fill-amber-500' : ''}`} /> {sub.is_highlight ? 'Destaque: Sim' : 'Marcar Destaque'}
                              </Button>
                              <Button size="sm" variant="outline" onClick={() => handleStatusChange(sub.id, 'published')}>Publicar</Button>
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

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
  CheckCircle, XCircle, Clock3, ChevronDown, ChevronUp,
  Phone, Mail, Globe, Info, Send, Star, TrendingUp, BarChart3,
  RotateCcw, LayoutDashboard, Edit, ExternalLink, Eye, History
} from "lucide-react";
import { toast } from "sonner";
import { exportSingleEventPdf, exportBulkEventsPdf } from "@/lib/pdfExport";

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
 
 const statusConfig: Record<string, { label: string; color: string; icon: any; bg: string }> = {
   draft: { label: "Rascunho", color: "text-slate-600", bg: "bg-slate-100", icon: History },
   pending: { label: "Pendente", color: "text-amber-600", bg: "bg-amber-100", icon: Clock3 },
   analysis: { label: "Em análise", color: "text-blue-600", bg: "bg-blue-100", icon: Search },
   approved: { label: "Aprovado", color: "text-emerald-600", bg: "bg-emerald-100", icon: CheckCircle },
   rejected: { label: "Rejeitado", color: "text-rose-600", bg: "bg-rose-100", icon: XCircle },
   published: { label: "Publicado", color: "text-indigo-600", bg: "bg-indigo-100", icon: Globe },
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
   const date = formatEventDate(sub.date);
   const msg = `🗓️ *${sub.event_title}*\n⏰ ${date} às ${sub.start_time || "--:--"}\n📍 ${sub.location}\n\n🌴 Veja mais no AgendIlha: https://agendilha-divulgacao.lovable.app/agenda`;
   return encodeURIComponent(msg);
 }

export default function AdminEvents() {
  const { user, isAdmin, loading: authLoading } = useAuth();
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);

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
    if (!window.confirm("Tem certeza que deseja excluir este evento?")) return;
    const { error } = await supabase.from("submissions").delete().eq("id", id);
    if (error) {
      toast.error("Erro ao remover evento");
    } else {
      toast.success("Evento removido");
      setSubmissions((prev) => prev.filter((s) => s.id !== id));
    }
  }

  async function handleStatusChange(id: string, newStatus: string) {
    const { error } = await supabase.from("submissions").update({ status: newStatus }).eq("id", id);
    if (error) {
      toast.error("Erro ao atualizar status");
    } else {
      toast.success(`Status atualizado para ${newStatus}`);
      setSubmissions((prev) => prev.map((s) => s.id === id ? { ...s, status: newStatus } : s));
    }
  }

  async function toggleHighlight(id: string, current: boolean) {
    const { error } = await supabase.from("submissions").update({ is_highlight: !current }).eq("id", id);
    if (error) {
      toast.error("Erro ao atualizar destaque");
    } else {
      toast.success(!current ? "Evento em destaque! 🔥" : "Destaque removido");
      setSubmissions(prev => prev.map(s => s.id === id ? { ...s, is_highlight: !current } : s));
    }
  }

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

  if (authLoading) return <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  if (!user || !isAdmin) return <Navigate to="/" replace />;

  return (
    <div className="min-h-screen bg-muted/30">
      <div className="mx-auto max-w-7xl px-4 py-8">
        {/* Header Area */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
              <LayoutDashboard className="h-8 w-8 text-primary" />
              Gestão de Eventos
            </h1>
            <p className="text-muted-foreground mt-1 text-lg">Área operacional para moderação e distribuição de eventos.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => fetchAll()}><RotateCcw className="h-4 w-4 mr-2" /> Atualizar</Button>
            <Button variant="outline" onClick={() => exportBulkEventsPdf(filtered)}><FileDown className="h-4 w-4 mr-2" /> Exportar PDF</Button>
            <Button 
              className="bg-green-600 hover:bg-green-700 text-white"
              onClick={() => {
                const approved = submissions.filter(s => s.status === 'approved');
                if (approved.length === 0) return toast.warning("Sem eventos aprovados.");
                window.open(`https://wa.me/?text=${buildWhatsAppMessage(approved[0])}`, "_blank");
              }}
            >
              <Send className="h-4 w-4 mr-2" /> Divulgação WhatsApp
            </Button>
          </div>
        </div>

         {/* KPIs */}
         <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
           {[
             { label: 'Total', value: kpis.total, color: 'text-blue-600', bg: 'bg-blue-50' },
             { label: 'Pendentes', value: kpis.pending, color: 'text-amber-600', bg: 'bg-amber-50' },
             { label: 'Em Análise', value: kpis.analysis, color: 'text-blue-600', bg: 'bg-blue-50' },
             { label: 'Aprovados', value: kpis.approved, color: 'text-emerald-600', bg: 'bg-emerald-50' },
             { label: 'Rejeitados', value: kpis.rejected, color: 'text-rose-600', bg: 'bg-rose-50' },
             { label: 'Publicados', value: kpis.published, color: 'text-indigo-600', bg: 'bg-indigo-50' },
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
        <Card className="mb-6 shadow-sm border-border/40">
          <CardContent className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Buscar evento, local ou empresa..." className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
              </div>
               <Select value={statusFilter} onValueChange={setStatusFilter}>
                 <SelectTrigger className="h-10"><SelectValue placeholder="Filtrar por Status" /></SelectTrigger>
                 <SelectContent>
                   <SelectItem value="all">Todos os Status</SelectItem>
                   {Object.entries(statusConfig).map(([key, cfg]) => (
                     <SelectItem key={key} value={key}>{cfg.label}</SelectItem>
                   ))}
                 </SelectContent>
               </Select>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger><SelectValue placeholder="Categoria" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as Categorias</SelectItem>
                  {Object.entries(categoryLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                </SelectContent>
              </Select>
              <Button variant="ghost" onClick={() => { setSearch(""); setStatusFilter("all"); setCategoryFilter("all"); }}>Limpar Filtros</Button>
            </div>
          </CardContent>
        </Card>

        {/* Main List */}
        <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
          <div className="hidden md:grid grid-cols-12 gap-4 p-4 border-b bg-muted/20 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
            <div className="col-span-4">Evento / Categoria</div>
            <div className="col-span-2 text-center">Data / Horário</div>
            <div className="col-span-2 text-center">Responsável</div>
            <div className="col-span-2 text-center">Status</div>
            <div className="col-span-2 text-right">Ações</div>
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
                <div key={sub.id} className="p-4 hover:bg-muted/5 transition-colors">
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
                    <div className="col-span-4 space-y-1">
                      <div className="flex items-center gap-2">
                        {sub.is_highlight && <Star className="h-4 w-4 text-amber-500 fill-amber-500" />}
                        <h3 className="font-bold text-foreground truncate">{sub.event_title}</h3>
                      </div>
                       <div className="flex items-center gap-2">
                         <Badge variant="outline" className="text-[9px] font-semibold bg-muted/30">{categoryLabels[sub.category || ''] || 'Outros'}</Badge>
                         <span className="text-[10px] text-muted-foreground/60 font-mono tracking-tight">ID: {sub.id.slice(0,8)}</span>
                         <span className="text-[10px] text-muted-foreground/60">• Cadastrado em: {formatSubmissionDate(sub.created_at)}</span>
                       </div>
                     </div>
                     <div className="col-span-2 text-center">
                       <div className="font-bold text-foreground text-sm">{formatEventDate(sub.date)}</div>
                       <div className="flex items-center justify-center gap-1 text-[11px] text-muted-foreground mt-0.5">
                         <Clock className="h-3 w-3" />
                         {sub.start_time || '--:--'}
                       </div>
                     </div>
                     <div className="col-span-2 text-center px-2">
                       <div className="font-bold text-foreground text-sm truncate">{sub.company_name || sub.responsible_name || '—'}</div>
                       <div className="flex items-center justify-center gap-1 text-[11px] text-muted-foreground mt-0.5">
                         <Phone className="h-3 w-3" />
                         {sub.phone || 'Sem tel'}
                       </div>
                     </div>
                     <div className="col-span-2 flex justify-center">
                       {(() => {
                         const cfg = statusConfig[sub.status] || statusConfig.pending;
                         const StatusIcon = cfg.icon;
                         return (
                           <Badge className={`${cfg.bg} ${cfg.color} border-none font-bold text-[10px] py-1 px-2.5 flex items-center gap-1.5`}>
                             <StatusIcon className="h-3 w-3" />
                             {cfg.label.toUpperCase()}
                           </Badge>
                         );
                       })()}
                     </div>
                     <div className="col-span-2 flex justify-end gap-1">
                       <TooltipProvider>
                         <Tooltip>
                           <TooltipTrigger asChild>
                             <Button size="icon" variant="ghost" className="h-9 w-9 hover:bg-primary/5 hover:text-primary transition-colors" onClick={() => setExpandedId(expandedId === sub.id ? null : sub.id)}><Eye className="h-4 w-4" /></Button>
                           </TooltipTrigger>
                           <TooltipContent>Ver Detalhes</TooltipContent>
                         </Tooltip>
                         <Tooltip>
                           <TooltipTrigger asChild>
                             <Button size="icon" variant="ghost" className="h-9 w-9 text-blue-600 hover:bg-blue-50" onClick={() => handleStatusChange(sub.id, 'analysis')}><Clock3 className="h-4 w-4" /></Button>
                           </TooltipTrigger>
                           <TooltipContent>Em Análise</TooltipContent>
                         </Tooltip>
                         <Tooltip>
                           <TooltipTrigger asChild>
                             <Button size="icon" variant="ghost" className="h-9 w-9 text-emerald-600 hover:bg-emerald-50" onClick={() => handleStatusChange(sub.id, 'approved')}><CheckCircle className="h-4 w-4" /></Button>
                           </TooltipTrigger>
                           <TooltipContent>Aprovar</TooltipContent>
                         </Tooltip>
                         <Tooltip>
                           <TooltipTrigger asChild>
                             <Button size="icon" variant="ghost" className="h-9 w-9 text-indigo-600 hover:bg-indigo-50" onClick={() => handleStatusChange(sub.id, 'published')}><Globe className="h-4 w-4" /></Button>
                           </TooltipTrigger>
                           <TooltipContent>Publicar na Agenda</TooltipContent>
                         </Tooltip>
                         <DropdownMenu>
                           <DropdownMenuTrigger asChild>
                             <Button size="icon" variant="ghost" className="h-9 w-9"><ChevronDown className="h-4 w-4" /></Button>
                           </DropdownMenuTrigger>
                           <DropdownMenuContent align="end" className="w-48">
                             <DropdownMenuItem onClick={() => handleStatusChange(sub.id, 'rejected')} className="text-rose-600 focus:text-rose-600 focus:bg-rose-50 cursor-pointer">
                               <XCircle className="h-4 w-4 mr-2" /> Rejeitar
                             </DropdownMenuItem>
                             <DropdownMenuItem onClick={() => toggleHighlight(sub.id, !!sub.is_highlight)} className="cursor-pointer">
                               <Star className={`h-4 w-4 mr-2 ${sub.is_highlight ? 'fill-amber-500 text-amber-500' : ''}`} /> 
                               {sub.is_highlight ? 'Remover Destaque' : 'Marcar Destaque'}
                             </DropdownMenuItem>
                             <DropdownMenuSeparator />
                             <DropdownMenuItem onClick={() => exportSingleEventPdf(sub)} className="cursor-pointer">
                               <FileDown className="h-4 w-4 mr-2" /> Exportar PDF
                             </DropdownMenuItem>
                             <DropdownMenuItem onClick={() => window.open(`https://wa.me/?text=${buildWhatsAppMessage(sub)}`, "_blank")} className="cursor-pointer text-emerald-600 focus:text-emerald-600 focus:bg-emerald-50">
                               <MessageCircle className="h-4 w-4 mr-2" /> Divulgar WhatsApp
                             </DropdownMenuItem>
                             <DropdownMenuSeparator />
                             <DropdownMenuItem onClick={() => handleDelete(sub.id)} className="text-rose-600 focus:text-rose-600 focus:bg-rose-50 cursor-pointer">
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
                            <div className="bg-white border border-border/60 p-4 rounded-lg shadow-inner">
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
                            <Button size="sm" variant={sub.status === 'published' ? 'default' : 'outline'} onClick={() => handleStatusChange(sub.id, 'published')} className={sub.status === 'published' ? 'bg-indigo-600' : ''}><Send className="h-4 w-4 mr-2" /> Publicar na Agenda</Button>
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
    </div>
  );
}

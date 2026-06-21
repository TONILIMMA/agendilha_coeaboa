import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Briefcase, Building2, CheckCircle, ChevronDown, ChevronUp, Clock, DollarSign,
  FileDown, Globe, Info, Mail, MapPin, MessageCircle, Phone, RotateCcw, Share2,
  Trash2, Users, XCircle,
} from "lucide-react";
import { formatBrazilianDate } from "@/lib/date-utils";
import { exportSingleEventPdf } from "@/lib/pdfExport";
import { toast } from "sonner";
import { buildWhatsAppMessage } from "@/lib/eventWhatsapp";
import { EventSocialCard } from "./EventSocialCard";
import { EventAuditLog } from "./EventAuditLog";
import { EditorialTransitionPanel } from "./EditorialTransitionPanel";
import { StatusBadge } from "./StatusBadge";
import {
  categoryLabels, formatDate, stageBadgeVariant, stageLabels,
  type AuditLogEntry, type EditorialStatus, type Submission,
} from "./types";

export interface EventCardProps {
  sub: Submission;
  isExpanded: boolean;
  onToggleExpand: () => void;
  isAdmin: boolean;
  auditLog?: AuditLogEntry[];
  showApproval?: boolean;
  showTrashActions?: boolean;
  onStatusChange: (id: string, newStatus: string) => void;
  onHighlightToggle: (id: string, current: boolean) => void;
  onSoftDelete: (id: string) => void;
  onRestore: (id: string) => void;
  onPermanentDelete: (id: string) => void;
  onEditorialChange?: (id: string, newStatus: EditorialStatus, extra?: Partial<Submission>) => Promise<boolean | void>;
  onLogPublication?: (id: string, channel: string) => Promise<boolean | void>;
}

export function EventCard({
  sub, isExpanded, onToggleExpand, isAdmin, auditLog,
  showApproval, showTrashActions,
  onStatusChange, onHighlightToggle, onSoftDelete, onRestore, onPermanentDelete,
  onEditorialChange, onLogPublication,
}: EventCardProps) {
  return (
    <Card
      className={`border-border hover:shadow-md transition-all cursor-pointer ${isExpanded ? "ring-2 ring-primary/30" : ""}`}
      onClick={onToggleExpand}
    >
      <CardContent className="p-4 sm:p-5">
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
              <StatusBadge status={sub.editorial_status} />
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
                onClick={(e) => { e.stopPropagation(); onHighlightToggle(sub.id, sub.is_highlight); }}
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
                <Button size="sm" variant="outline" className="text-xs" onClick={() => exportSingleEventPdf(sub as any)}>
                  <FileDown className="h-3.5 w-3.5 mr-1" />
                  Baixar PDF Individual
                </Button>
                <EventSocialCard sub={sub} />
              </div>
              {sub.contact_social && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Globe className="h-4 w-4 text-primary shrink-0" />
                  <span><strong>Rede social:</strong> {sub.contact_social}</span>
                </div>
              )}
            </div>

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

            {auditLog && <EventAuditLog logs={auditLog} />}

            {isAdmin && onEditorialChange && onLogPublication && !showTrashActions && (
              <EditorialTransitionPanel sub={sub} onChange={onEditorialChange} onLogPublication={onLogPublication} />
            )}

            <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-border">
              {showApproval && isAdmin && (
                <div className="flex gap-1">
                  <Button
                    size="sm"
                    variant={sub.status === "approved" ? "default" : "outline"}
                    onClick={() => onStatusChange(sub.id, sub.status === "approved" ? "pending" : "approved")}
                    className="text-xs"
                  >
                    <CheckCircle className="h-4 w-4 mr-1" />
                    Aprovar
                  </Button>
                  <Button
                    size="sm"
                    variant={sub.status === "rejected" ? "destructive" : "outline"}
                    onClick={() => onStatusChange(sub.id, sub.status === "rejected" ? "pending" : "rejected")}
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
              <Button size="sm" variant="outline" onClick={() => { exportSingleEventPdf(sub as any); toast.success("PDF gerado!"); }} className="text-xs">
                <FileDown className="mr-1.5 h-3.5 w-3.5" />
                PDF
              </Button>

              {showTrashActions ? (
                <>
                  <Button size="sm" variant="outline" onClick={() => onRestore(sub.id)} className="text-xs ml-auto">
                    <RotateCcw className="mr-1 h-3.5 w-3.5" />
                    Restaurar
                  </Button>
                  {isAdmin && (
                    <Button size="sm" variant="ghost" onClick={() => onPermanentDelete(sub.id)} className="text-xs text-destructive hover:text-destructive">
                      <Trash2 className="mr-1 h-3.5 w-3.5" />
                      Excluir definitivamente
                    </Button>
                  )}
                </>
              ) : (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => onSoftDelete(sub.id)}
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
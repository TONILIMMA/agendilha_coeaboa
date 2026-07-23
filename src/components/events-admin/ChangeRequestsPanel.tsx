import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Bell, Check, Loader2, MessageSquare, RefreshCw, X } from "lucide-react";
import { statusMeta, typeLabel, type ChangeRequestRow, type ChangeRequestStatus } from "@/components/change-requests/types";
import { formatDate } from "@/components/events-admin/types";
import { useAuth } from "@/contexts/AuthContext";

type RowExt = ChangeRequestRow & {
  submission?: { id: string; event_title: string | null; responsible_name: string | null; duvidas_whatsapp?: string | null };
  requester?: { user_id: string; responsible_name: string | null; company_name: string | null; email: string | null };
};

interface Props {
  /** Optional deep-linked request id to auto-open. */
  focusId?: string | null;
}

export function ChangeRequestsPanel({ focusId }: Props) {
  const { user } = useAuth();
  const [rows, setRows] = useState<RowExt[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<ChangeRequestStatus | "all">("pendente");
  const [decision, setDecision] = useState<{ row: RowExt; action: "aprovado" | "rejeitado" } | null>(null);
  const [notes, setNotes] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data, error } = await (supabase as any)
      .from("submission_change_requests")
      .select("*, submission:submissions(id,event_title,responsible_name,duvidas_whatsapp)")
      .order("created_at", { ascending: false });
    if (error) { toast.error("Não consegui carregar as solicitações."); setLoading(false); return; }
    const list = (data as RowExt[]) || [];
    // Enriquece com dados básicos do solicitante
    const ids = Array.from(new Set(list.map((r) => r.requested_by).filter(Boolean)));
    if (ids.length) {
      const { data: profs } = await supabase
        .from("profiles")
        .select("user_id, responsible_name, company_name, email")
        .in("user_id", ids);
      const map = new Map((profs || []).map((p: any) => [p.user_id, p]));
      list.forEach((r) => { r.requester = map.get(r.requested_by) as any; });
    }
    setRows(list);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  useEffect(() => {
    if (!focusId || !rows.length) return;
    const row = rows.find((r) => r.id === focusId);
    if (row) {
      const el = document.getElementById(`cr-${row.id}`);
      el?.scrollIntoView({ behavior: "smooth", block: "center" });
      el?.classList.add("ring-2", "ring-primary");
      setTimeout(() => el?.classList.remove("ring-2", "ring-primary"), 2400);
    }
  }, [focusId, rows]);

  const filtered = useMemo(
    () => (filter === "all" ? rows : rows.filter((r) => r.status === filter)),
    [rows, filter]
  );
  const pendingCount = rows.filter((r) => r.status === "pendente").length;

  const openDecision = (row: RowExt, action: "aprovado" | "rejeitado") => {
    setDecision({ row, action });
    setNotes("");
    setNewPhone(row.proposed_whatsapp || "");
  };

  const confirmDecision = async () => {
    if (!decision || !user) return;
    setSaving(true);
    const { row, action } = decision;
    const patch: Record<string, unknown> = {
      status: action,
      decision_notes: notes.trim() || null,
      decided_by: user.id,
      decided_at: new Date().toISOString(),
    };
    const { error } = await (supabase as any)
      .from("submission_change_requests")
      .update(patch)
      .eq("id", row.id);
    if (error) { setSaving(false); toast.error("Não deu pra salvar a decisão."); return; }

    // Se aprovado, aplica na submission.
    if (action === "aprovado") {
      const subPatch: Record<string, unknown> = {};
      if (row.request_type !== "authorization" && newPhone.trim()) {
        subPatch.duvidas_whatsapp = newPhone.trim();
        subPatch.responsavel_duvidas_whatsapp = newPhone.trim();
      }
      if (row.revoke_authorization || row.request_type === "authorization" || row.request_type === "both") {
        subPatch.duvidas_authorized = !row.revoke_authorization;
      }
      if (Object.keys(subPatch).length) {
        const { error: se } = await supabase.from("submissions").update(subPatch as any).eq("id", row.submission_id);
        if (se) toast.warning("Decisão salva, mas não consegui atualizar o evento automaticamente. Ajuste manual.");
      }
    }

    toast.success(action === "aprovado" ? "Solicitação aprovada." : "Solicitação rejeitada.");
    setDecision(null);
    setSaving(false);
    load();
  };

  return (
    <Card className="mb-6 border-border/60">
      <CardContent className="p-4 sm:p-5 space-y-4">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <Bell className="h-4 w-4 text-primary" />
            <h2 className="text-sm font-black uppercase tracking-widest text-foreground">
              Solicitações de alteração
            </h2>
            {pendingCount > 0 && (
              <Badge className="bg-amber-500 hover:bg-amber-500 text-white">{pendingCount} pendente{pendingCount > 1 ? "s" : ""}</Badge>
            )}
          </div>
          <div className="flex items-center gap-1 flex-wrap">
            {(["pendente", "aprovado", "rejeitado", "cancelado", "all"] as const).map((s) => (
              <Button
                key={s}
                size="sm"
                variant={filter === s ? "default" : "outline"}
                className="h-7 text-[11px]"
                onClick={() => setFilter(s)}
              >
                {s === "all" ? "Todas" : statusMeta[s].label}
              </Button>
            ))}
            <Button size="sm" variant="ghost" className="h-7 text-[11px]" onClick={load}>
              <RefreshCw className="h-3 w-3 mr-1" /> Atualizar
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center gap-2 text-xs text-muted-foreground py-4">
            <Loader2 className="h-3.5 w-3.5 animate-spin" /> Carregando…
          </div>
        ) : filtered.length === 0 ? (
          <p className="text-xs text-muted-foreground py-3">Nada por aqui. Tudo em dia! 🎉</p>
        ) : (
          <ul className="space-y-2">
            {filtered.map((r) => {
              const meta = statusMeta[r.status];
              const requesterName = r.requester?.responsible_name || r.requester?.company_name || r.requester?.email || "Solicitante";
              return (
                <li id={`cr-${r.id}`} key={r.id} className="rounded-md border bg-background p-3 text-xs space-y-2 transition-shadow">
                  <div className="flex items-start justify-between gap-2 flex-wrap">
                    <div className="space-y-0.5">
                      <div className="font-semibold text-foreground text-sm">
                        {r.submission?.event_title || "Evento"}
                      </div>
                      <div className="text-muted-foreground">
                        {typeLabel[r.request_type]} · por {requesterName}
                      </div>
                    </div>
                    <Badge variant="outline" className={meta.className}>{meta.label}</Badge>
                  </div>
                  <div className="grid sm:grid-cols-2 gap-2">
                    {r.current_whatsapp && (
                      <div><span className="text-muted-foreground">Atual:</span> <span className="font-mono">{r.current_whatsapp}</span></div>
                    )}
                    {r.proposed_whatsapp && (
                      <div><span className="text-muted-foreground">Proposto:</span> <span className="font-mono">{r.proposed_whatsapp}</span></div>
                    )}
                  </div>
                  {r.revoke_authorization && (
                    <div className="text-rose-700">Pediu revogação da autorização.</div>
                  )}
                  <div><span className="text-muted-foreground">Motivo:</span> {r.reason}</div>
                  <div className="text-[11px] text-muted-foreground">Enviado em {formatDate(r.created_at)}</div>
                  {r.decision_notes && (
                    <div className="rounded bg-muted/60 p-2">
                      <span className="text-muted-foreground">Nota da moderação:</span> {r.decision_notes}
                    </div>
                  )}
                  {r.status === "pendente" && (
                    <div className="flex flex-wrap gap-2 pt-1">
                      <Button size="sm" className="h-8 bg-emerald-600 hover:bg-emerald-700 text-white" onClick={() => openDecision(r, "aprovado")}>
                        <Check className="h-3.5 w-3.5 mr-1" /> Aprovar
                      </Button>
                      <Button size="sm" variant="outline" className="h-8 text-rose-700 border-rose-200" onClick={() => openDecision(r, "rejeitado")}>
                        <X className="h-3.5 w-3.5 mr-1" /> Rejeitar
                      </Button>
                      {r.proposed_whatsapp && (
                        <a
                          href={`https://wa.me/55${r.proposed_whatsapp.replace(/\D/g, "")}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs text-primary underline underline-offset-4"
                        >
                          <MessageSquare className="h-3 w-3" /> Testar número
                        </a>
                      )}
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}

        <Dialog open={!!decision} onOpenChange={(o) => { if (!o) setDecision(null); }}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{decision?.action === "aprovado" ? "Aprovar solicitação" : "Rejeitar solicitação"}</DialogTitle>
              <DialogDescription>
                {decision?.action === "aprovado"
                  ? "Confirma a mudança. Se aprovar, aplicamos no evento na hora."
                  : "Explica em uma linha o motivo pra quem pediu entender."}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3">
              {decision?.action === "aprovado" && decision.row.request_type !== "authorization" && (
                <div className="space-y-1">
                  <label className="text-xs font-medium">Aplicar como novo WhatsApp</label>
                  <Input value={newPhone} onChange={(e) => setNewPhone(e.target.value)} placeholder="(21) 9XXXX-XXXX" />
                </div>
              )}
              <div className="space-y-1">
                <label className="text-xs font-medium">Nota da decisão (opcional)</label>
                <Textarea rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Ex.: número confirmado com o promotor por telefone." />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDecision(null)}>Cancelar</Button>
              <Button onClick={confirmDecision} disabled={saving}
                className={decision?.action === "aprovado" ? "bg-emerald-600 hover:bg-emerald-700 text-white" : ""}>
                {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : null}
                Confirmar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
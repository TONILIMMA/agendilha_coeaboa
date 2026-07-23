import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, RefreshCw, Ban, MessageCircle } from "lucide-react";
import { formatDate } from "@/components/events-admin/types";
import { statusMeta, typeLabel, type ChangeRequestRow } from "./types";

interface Props {
  submissionId: string;
  /** Bump to force refetch. */
  refreshKey?: number;
}

export function MyChangeRequestsList({ submissionId, refreshKey = 0 }: Props) {
  const [rows, setRows] = useState<ChangeRequestRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [internal, setInternal] = useState(0);

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      const { data, error } = await (supabase as any)
        .from("submission_change_requests")
        .select("*")
        .eq("submission_id", submissionId)
        .order("created_at", { ascending: false });
      if (!alive) return;
      if (error) toast.error("Não consegui carregar suas solicitações.");
      setRows((data as ChangeRequestRow[]) || []);
      setLoading(false);
    })();
    return () => { alive = false; };
  }, [submissionId, refreshKey, internal]);

  const cancel = async (id: string) => {
    const { error } = await (supabase as any)
      .from("submission_change_requests")
      .update({ status: "cancelado" })
      .eq("id", id);
    if (error) return toast.error("Não deu pra cancelar. Tenta de novo.");
    toast.success("Solicitação cancelada.");
    setInternal((n) => n + 1);
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-xs text-muted-foreground py-3">
        <Loader2 className="h-3.5 w-3.5 animate-spin" /> Carregando solicitações…
      </div>
    );
  }
  if (!rows.length) {
    return (
      <p className="text-xs text-muted-foreground py-2">
        Nenhuma solicitação enviada ainda. Se algo precisar mudar, clique em <strong>Solicitar alteração</strong> acima.
      </p>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-semibold text-primary flex items-center gap-1.5">
          <MessageCircle className="h-3.5 w-3.5" /> Minhas solicitações
        </h4>
        <Button type="button" variant="ghost" size="sm" className="h-7 text-xs" onClick={() => setInternal((n) => n + 1)}>
          <RefreshCw className="h-3 w-3 mr-1" /> Atualizar
        </Button>
      </div>
      <ul className="space-y-2">
        {rows.map((r) => {
          const meta = statusMeta[r.status];
          return (
            <li key={r.id} className="rounded-md border bg-background p-3 text-xs space-y-1.5">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <span className="font-semibold text-foreground">{typeLabel[r.request_type]}</span>
                <Badge variant="outline" className={meta.className}>{meta.label}</Badge>
              </div>
              <div className="text-muted-foreground">
                Enviado em {formatDate(r.created_at)}
              </div>
              {r.proposed_whatsapp && (
                <div>Novo WhatsApp: <span className="font-mono">{r.proposed_whatsapp}</span></div>
              )}
              {r.revoke_authorization && (
                <div className="text-rose-700">Pediu revogação da autorização.</div>
              )}
              <div><span className="text-muted-foreground">Motivo:</span> {r.reason}</div>
              {r.decision_notes && (
                <div className="rounded bg-muted/60 p-2">
                  <span className="text-muted-foreground">Resposta da moderação:</span> {r.decision_notes}
                </div>
              )}
              {r.decided_at && (
                <div className="text-[11px] text-muted-foreground">Decidido em {formatDate(r.decided_at)}</div>
              )}
              {r.status === "pendente" && (
                <div className="pt-1">
                  <Button type="button" size="sm" variant="ghost" className="h-7 text-xs text-rose-700" onClick={() => cancel(r.id)}>
                    <Ban className="h-3 w-3 mr-1" /> Cancelar solicitação
                  </Button>
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
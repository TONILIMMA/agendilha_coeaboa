import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Megaphone, Check, X, Loader2, Phone } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { formatPhoneDisplay } from "@/lib/whatsapp";

/** Fila de pedidos pra virar Divulgador — só admin/master vê. */
export function DivulgadorRequestsPanel() {
  const qc = useQueryClient();
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["divulgador-requests", "pendente"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("divulgador_requests")
        .select("id, user_id, nome, whatsapp, tipo_divulgador, motivo, status, created_at")
        .eq("status", "pendente")
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
  });

  const decidir = async (id: string, status: "aprovado" | "recusado") => {
    setBusy(id);
    const { error } = await supabase
      .from("divulgador_requests")
      .update({
        status,
        admin_notes: notes[id]?.trim() || null,
        reviewed_at: new Date().toISOString(),
        reviewed_by: (await supabase.auth.getUser()).data.user?.id ?? null,
      })
      .eq("id", id);
    setBusy(null);
    if (error) {
      toast.error("Não deu pra registrar a decisão. Tenta de novo.");
      return;
    }
    toast.success(status === "aprovado" ? "Liberado! Já pode divulgar." : "Pedido recusado.");
    qc.invalidateQueries({ queryKey: ["divulgador-requests"] });
    qc.invalidateQueries({ queryKey: ["admin-users"] });
  };

  const items = data ?? [];

  return (
    <section className="rounded-2xl border border-border p-4 sm:p-5 space-y-4" data-testid="divulgador-requests-panel">
      <header className="flex items-center gap-2">
        <Megaphone className="h-4 w-4 text-primary" />
        <h2 className="font-bold tracking-tight">Pedidos pra virar Divulgador</h2>
        <Badge variant="secondary" className="rounded-full">{items.length}</Badge>
      </header>

      {isLoading ? (
        <div className="py-6 flex justify-center"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>
      ) : items.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nenhum pedido na fila. Tudo em dia.</p>
      ) : (
        <ul className="space-y-3">
          {items.map((r: any) => (
            <li key={r.id} className="rounded-xl border border-border p-3 space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-semibold">{r.nome || "Sem nome"}</span>
                {r.tipo_divulgador && (
                  <Badge variant="outline" className="rounded-full text-[10px]">{r.tipo_divulgador}</Badge>
                )}
                {r.whatsapp && (
                  <span className="text-xs text-muted-foreground inline-flex items-center gap-1">
                    <Phone className="h-3 w-3" /> {formatPhoneDisplay(r.whatsapp)}
                  </span>
                )}
              </div>
              {r.motivo && <p className="text-sm text-foreground/75">{r.motivo}</p>}
              <Textarea
                rows={2}
                placeholder="Observação (opcional) — aparece pra pessoa se recusar."
                value={notes[r.id] ?? ""}
                onChange={(e) => setNotes((n) => ({ ...n, [r.id]: e.target.value }))}
              />
              <div className="flex gap-2">
                <Button
                  size="sm"
                  className="rounded-full"
                  disabled={busy === r.id}
                  onClick={() => decidir(r.id, "aprovado")}
                >
                  <Check className="h-4 w-4 mr-1" /> Liberar
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="rounded-full"
                  disabled={busy === r.id}
                  onClick={() => decidir(r.id, "recusado")}
                >
                  <X className="h-4 w-4 mr-1" /> Recusar
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
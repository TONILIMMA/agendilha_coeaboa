import { useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { openWhatsappNotification } from "@/lib/notifications";
import { logger } from "@/lib/logger";
import type { TablesInsert, TablesUpdate } from "@/integrations/supabase/types";
import type { EditorialStatus, Submission } from "./types";
import { missingPublishFields } from "@/lib/publishValidation";
import type { PublishBlockInfo } from "./PublishBlockDialog";

type SubmissionUpdate = TablesUpdate<"submissions">;
type AuditInsert = TablesInsert<"event_audit_log">;
type PublicationLogInsert = TablesInsert<"event_publication_log">;

interface Options {
  userId: string | undefined;
  submissions: Submission[];
  setSubmissions: React.Dispatch<React.SetStateAction<Submission[]>>;
  onCollapse: () => void;
  onPublishBlocked?: (info: PublishBlockInfo) => void;
}

export function useEventActions({ userId, submissions, setSubmissions, onCollapse, onPublishBlocked }: Options) {
  const logAudit = useCallback(async (eventId: string, action: string, notes?: string) => {
    if (!userId) return;
    const payload: AuditInsert = {
      event_id: eventId, user_id: userId, action, notes: notes || null,
    };
    await supabase.from("event_audit_log").insert(payload);
  }, [userId]);

  const handleSoftDelete = useCallback(async (id: string) => {
    const patch: SubmissionUpdate = { deleted_at: new Date().toISOString() };
    const { error } = await supabase.from("submissions").update(patch).eq("id", id);
    if (error) { toast.error("Erro ao mover para lixeira"); return; }
    toast.success("Evento movido para a lixeira");
    setSubmissions(prev => prev.map(s => s.id === id ? { ...s, deleted_at: new Date().toISOString() } : s));
    onCollapse();
    if (userId) {
      const payload: AuditInsert = { event_id: id, user_id: userId, action: "deleted" };
      await supabase.from("event_audit_log").insert(payload);
    }
  }, [setSubmissions, onCollapse, userId]);

  const handleRestore = useCallback(async (id: string) => {
    const patch: SubmissionUpdate = { deleted_at: null };
    const { error } = await supabase.from("submissions").update(patch).eq("id", id);
    if (error) { toast.error("Erro ao restaurar evento"); return; }
    toast.success("Evento restaurado!");
    setSubmissions(prev => prev.map(s => s.id === id ? { ...s, deleted_at: null } : s));
    if (userId) {
      const payload: AuditInsert = { event_id: id, user_id: userId, action: "restored" };
      await supabase.from("event_audit_log").insert(payload);
    }
  }, [setSubmissions, userId]);

  const handlePermanentDelete = useCallback(async (id: string) => {
    const { error } = await supabase.from("submissions").delete().eq("id", id);
    if (error) { toast.error("Erro ao excluir definitivamente"); return; }
    toast.success("Evento excluído definitivamente");
    setSubmissions(prev => prev.filter(s => s.id !== id));
  }, [setSubmissions]);

  const handleHighlightToggle = useCallback(async (id: string, current: boolean) => {
    const patch: SubmissionUpdate = { is_highlight: !current };
    const { error } = await supabase.from("submissions").update(patch).eq("id", id);
    if (error) { toast.error("Erro ao atualizar destaque"); return; }
    toast.success(!current ? "Evento marcado como destaque!" : "Destaque removido");
    setSubmissions(prev => prev.map(s => s.id === id ? { ...s, is_highlight: !current } : s));
    await logAudit(id, !current ? "highlighted" : "unhighlighted");
  }, [setSubmissions, logAudit]);

  const handleStatusChange = useCallback(async (id: string, newStatus: string) => {
    const patch: SubmissionUpdate = { status: newStatus };
    const { error } = await supabase.from("submissions").update(patch).eq("id", id);
    if (error) { toast.error("Erro ao atualizar status"); return; }
    toast.success(newStatus === "approved" ? "Evento aprovado!" : newStatus === "rejected" ? "Evento rejeitado" : "Status atualizado");
    setSubmissions(prev => prev.map(s => s.id === id ? { ...s, status: newStatus } : s));
    await logAudit(id, newStatus);
    if (newStatus === "approved" || newStatus === "rejected") {
      const sub = submissions.find(s => s.id === id);
      if (sub) {
        const sent = openWhatsappNotification(sub, newStatus);
        if (!sent) toast.info("Anunciante sem telefone cadastrado.");
      }
    }
  }, [setSubmissions, logAudit, submissions]);

  const handleEditorialChange = useCallback(async (
    id: string,
    newStatus: EditorialStatus,
    extra: Partial<Submission> = {},
  ) => {
    const prev = submissions.find(s => s.id === id);
    // Bloqueia agendar/publicar sem os dados mínimos.
    if (newStatus === "publicado" || newStatus === "agendado" || newStatus === "pronto_divulgar") {
      const missing = missingPublishFields(prev);
      if (missing.length) {
        const action = newStatus === "publicado" ? "publicar" : newStatus === "agendado" ? "agendar" : "marcar como pronto";
        onPublishBlocked?.({ eventTitle: prev?.event_title, action, missing });
        toast.error(`Não dá pra ${action}: falta ${missing.join(", ")}.`);
        return false;
      }
    }
    const patch = { editorial_status: newStatus, ...extra } as SubmissionUpdate;
    // Optimistic update
    setSubmissions(curr => curr.map(s => s.id === id ? { ...s, ...patch } : s));
    const { data, error } = await supabase
      .from("submissions")
      .update(patch)
      .eq("id", id)
      .select("id, editorial_status, scheduled_at, scheduled_channel, published_channels, checklist_publ_canal, checklist_visivel_agenda, checklist_envio_registrado, rejection_reason");
    if (error || !data || data.length === 0) {
      const msg = error?.message || "Sem permissão para atualizar este evento (RLS).";
      logger.error("[editorial] update failed", { id, newStatus, error });
      toast.error(msg);
      if (prev) setSubmissions(curr => curr.map(s => s.id === id ? prev : s));
      return false;
    }
    // Sync state with what DB actually persisted (trigger may stamp timestamps)
    setSubmissions(curr => curr.map(s => s.id === id ? { ...s, ...(data[0] as Partial<Submission>) } : s));
    toast.success(`Etapa atualizada: ${newStatus}`);
    await logAudit(id, `editorial:${newStatus}`, extra.rejection_reason || extra.scheduled_channel || undefined);
    return true;
  }, [setSubmissions, submissions, logAudit]);

  const handleLogPublication = useCallback(async (
    id: string, channel: string,
  ) => {
    if (!userId) return false;
    const sub = submissions.find(s => s.id === id);
    const missing = missingPublishFields(sub);
    if (missing.length) {
      onPublishBlocked?.({ eventTitle: sub?.event_title, action: "publicar", missing });
      toast.error(`Não dá pra publicar: falta ${missing.join(", ")}.`);
      return false;
    }
    const channels = Array.from(new Set([...(sub?.published_channels || []), channel]));
    const prev = sub;
    setSubmissions(curr => curr.map(s => s.id === id ? { ...s, published_channels: channels, editorial_status: "publicado" } : s));
    const publishPatch: SubmissionUpdate = { published_channels: channels, editorial_status: "publicado" };
    const { data: upData, error: upErr } = await supabase
      .from("submissions")
      .update(publishPatch)
      .eq("id", id)
      .select("id, published_channels, editorial_status, editorial_published_at");
    if (upErr || !upData || upData.length === 0) {
      const msg = upErr?.message || "Sem permissão para publicar este evento (RLS).";
      logger.error("[publish] update failed", { id, channel, error: upErr });
      toast.error(msg);
      if (prev) setSubmissions(curr => curr.map(s => s.id === id ? prev : s));
      return false;
    }
    setSubmissions(curr => curr.map(s => s.id === id ? { ...s, ...(upData[0] as Partial<Submission>) } : s));
    const logPayload: PublicationLogInsert = {
      event_id: id, channel, responsible_id: userId, published_at: new Date().toISOString(),
    };
    const { error: logErr } = await supabase.from("event_publication_log").insert(logPayload);
    if (logErr) logger.warn("[publish] log insert failed", logErr);
    await logAudit(id, `published:${channel}`);
    toast.success(`Publicado em ${channel}!`);
    return true;
  }, [userId, submissions, setSubmissions, logAudit]);

  return {
    handleSoftDelete, handleRestore, handlePermanentDelete,
    handleHighlightToggle, handleStatusChange,
    handleEditorialChange, handleLogPublication,
  };
}
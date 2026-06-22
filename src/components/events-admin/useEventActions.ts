import { useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { openWhatsappNotification } from "@/lib/notifications";
import type { EditorialStatus, Submission } from "./types";

interface Options {
  userId: string | undefined;
  submissions: Submission[];
  setSubmissions: React.Dispatch<React.SetStateAction<Submission[]>>;
  onCollapse: () => void;
}

export function useEventActions({ userId, submissions, setSubmissions, onCollapse }: Options) {
  const logAudit = useCallback(async (eventId: string, action: string, notes?: string) => {
    if (!userId) return;
    await supabase.from("event_audit_log").insert({
      event_id: eventId, user_id: userId, action, notes: notes || null,
    } as any);
  }, [userId]);

  const handleSoftDelete = useCallback(async (id: string) => {
    const { error } = await supabase.from("submissions").update({ deleted_at: new Date().toISOString() } as any).eq("id", id);
    if (error) { toast.error("Erro ao mover para lixeira"); return; }
    toast.success("Evento movido para a lixeira");
    setSubmissions(prev => prev.map(s => s.id === id ? { ...s, deleted_at: new Date().toISOString() } : s));
    onCollapse();
    if (userId) await supabase.from("event_audit_log").insert({ event_id: id, user_id: userId, action: "deleted" } as any);
  }, [setSubmissions, onCollapse, userId]);

  const handleRestore = useCallback(async (id: string) => {
    const { error } = await supabase.from("submissions").update({ deleted_at: null } as any).eq("id", id);
    if (error) { toast.error("Erro ao restaurar evento"); return; }
    toast.success("Evento restaurado!");
    setSubmissions(prev => prev.map(s => s.id === id ? { ...s, deleted_at: null } : s));
    if (userId) await supabase.from("event_audit_log").insert({ event_id: id, user_id: userId, action: "restored" } as any);
  }, [setSubmissions, userId]);

  const handlePermanentDelete = useCallback(async (id: string) => {
    const { error } = await supabase.from("submissions").delete().eq("id", id);
    if (error) { toast.error("Erro ao excluir definitivamente"); return; }
    toast.success("Evento excluído definitivamente");
    setSubmissions(prev => prev.filter(s => s.id !== id));
  }, [setSubmissions]);

  const handleHighlightToggle = useCallback(async (id: string, current: boolean) => {
    const { error } = await supabase.from("submissions").update({ is_highlight: !current } as any).eq("id", id);
    if (error) { toast.error("Erro ao atualizar destaque"); return; }
    toast.success(!current ? "Evento marcado como destaque!" : "Destaque removido");
    setSubmissions(prev => prev.map(s => s.id === id ? { ...s, is_highlight: !current } : s));
    await logAudit(id, !current ? "highlighted" : "unhighlighted");
  }, [setSubmissions, logAudit]);

  const handleStatusChange = useCallback(async (id: string, newStatus: string) => {
    const { error } = await supabase.from("submissions").update({ status: newStatus } as any).eq("id", id);
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
    const patch: any = { editorial_status: newStatus, ...extra };
    // Optimistic update
    setSubmissions(curr => curr.map(s => s.id === id ? { ...s, ...patch } : s));
    const { data, error } = await supabase
      .from("submissions")
      .update(patch)
      .eq("id", id)
      .select("id, editorial_status, scheduled_at, scheduled_channel, published_channels, checklist_publ_canal, checklist_visivel_agenda, checklist_envio_registrado, rejection_reason");
    if (error || !data || data.length === 0) {
      const msg = error?.message || "Sem permissão para atualizar este evento (RLS).";
      if (import.meta.env.DEV) console.error("[editorial] update failed", { id, newStatus, error });
      toast.error(msg);
      if (prev) setSubmissions(curr => curr.map(s => s.id === id ? prev : s));
      return false;
    }
    // Sync state with what DB actually persisted (trigger may stamp timestamps)
    setSubmissions(curr => curr.map(s => s.id === id ? { ...s, ...(data[0] as any) } : s));
    toast.success(`Etapa atualizada: ${newStatus}`);
    await logAudit(id, `editorial:${newStatus}`, extra.rejection_reason || extra.scheduled_channel || undefined);
    return true;
  }, [setSubmissions, submissions, logAudit]);

  const handleLogPublication = useCallback(async (
    id: string, channel: string,
  ) => {
    if (!userId) return false;
    const sub = submissions.find(s => s.id === id);
    const channels = Array.from(new Set([...(sub?.published_channels || []), channel]));
    const prev = sub;
    setSubmissions(curr => curr.map(s => s.id === id ? { ...s, published_channels: channels, editorial_status: "publicado" } : s));
    const { data: upData, error: upErr } = await supabase
      .from("submissions")
      .update({ published_channels: channels, editorial_status: "publicado" } as any)
      .eq("id", id)
      .select("id, published_channels, editorial_status, editorial_published_at");
    if (upErr || !upData || upData.length === 0) {
      const msg = upErr?.message || "Sem permissão para publicar este evento (RLS).";
      if (import.meta.env.DEV) console.error("[publish] update failed", { id, channel, error: upErr });
      toast.error(msg);
      if (prev) setSubmissions(curr => curr.map(s => s.id === id ? prev : s));
      return false;
    }
    setSubmissions(curr => curr.map(s => s.id === id ? { ...s, ...(upData[0] as any) } : s));
    const { error: logErr } = await supabase.from("event_publication_log").insert({
      event_id: id, channel, responsible_id: userId, published_at: new Date().toISOString(),
    } as any);
    if (logErr) console.warn("[publish] log insert failed", logErr);
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
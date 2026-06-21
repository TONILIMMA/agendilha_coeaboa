import { useCallback, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { AuditLogEntry } from "./types";

export function useAuditLogs() {
  const [auditLogs, setAuditLogs] = useState<Record<string, AuditLogEntry[]>>({});

  const fetchAuditLog = useCallback(async (eventId: string) => {
    setAuditLogs(prev => {
      if (prev[eventId]) return prev;
      return prev;
    });
    if (auditLogs[eventId]) return;
    const { data } = await supabase
      .from("event_audit_log")
      .select("action, created_at, user_id")
      .eq("event_id", eventId)
      .order("created_at", { ascending: false }) as any;
    if (data && data.length > 0) {
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
  }, [auditLogs]);

  return { auditLogs, fetchAuditLog };
}
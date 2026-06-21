import { History } from "lucide-react";
import type { AuditLogEntry } from "./types";

const actionMap: Record<string, { icon: string; label: string }> = {
  approved: { icon: "✅", label: "Aprovou" },
  rejected: { icon: "❌", label: "Rejeitou" },
  edited: { icon: "✏️", label: "Editou" },
  deleted: { icon: "🗑️", label: "Moveu para lixeira" },
  restored: { icon: "♻️", label: "Restaurou" },
  pending: { icon: "⏳", label: "Voltou para pendente" },
};

export function EventAuditLog({ logs }: { logs: AuditLogEntry[] }) {
  if (!logs?.length) return null;
  return (
    <div className="bg-muted/50 rounded-lg p-3 space-y-2">
      <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
        <History className="h-3.5 w-3.5" />
        Histórico
      </div>
      {logs.map((log, i) => {
        const a = actionMap[log.action] || { icon: "📝", label: log.action };
        return (
          <div key={i} className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>{a.icon}</span>
            <span className="font-medium">{log.user_name}</span>
            <span>{a.label}</span>
            <span className="ml-auto text-[10px] opacity-70">
              {new Date(log.created_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}
            </span>
          </div>
        );
      })}
    </div>
  );
}
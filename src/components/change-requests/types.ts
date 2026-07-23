export type ChangeRequestStatus = "pendente" | "aprovado" | "rejeitado" | "cancelado";
export type ChangeRequestType = "whatsapp" | "authorization" | "both";

export interface ChangeRequestRow {
  id: string;
  submission_id: string;
  requested_by: string;
  request_type: ChangeRequestType;
  current_whatsapp: string | null;
  proposed_whatsapp: string | null;
  revoke_authorization: boolean;
  reason: string;
  status: ChangeRequestStatus;
  decision_notes: string | null;
  decided_by: string | null;
  decided_at: string | null;
  created_at: string;
  updated_at: string;
}

export const statusMeta: Record<ChangeRequestStatus, { label: string; className: string }> = {
  pendente:  { label: "Pendente",  className: "bg-amber-100 text-amber-800 border-amber-300" },
  aprovado:  { label: "Aprovado",  className: "bg-emerald-100 text-emerald-800 border-emerald-300" },
  rejeitado: { label: "Rejeitado", className: "bg-rose-100 text-rose-800 border-rose-300" },
  cancelado: { label: "Cancelado", className: "bg-slate-100 text-slate-700 border-slate-300" },
};

export const typeLabel: Record<ChangeRequestType, string> = {
  whatsapp: "Alterar WhatsApp",
  authorization: "Revisar autorização",
  both: "WhatsApp + autorização",
};
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowRight, CalendarClock, CheckCircle2, Megaphone, XCircle } from "lucide-react";
import { StatusBadge, NextStepLabel } from "./StatusBadge";
import type { EditorialStatus, Submission } from "./types";
import { toast } from "sonner";
import { missingPublishFields } from "@/lib/publishValidation";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface Props {
  sub: Submission;
  onChange: (id: string, newStatus: EditorialStatus, extra?: Partial<Submission>) => Promise<boolean | void>;
  onLogPublication: (id: string, channel: string) => Promise<boolean | void>;
}

const CHANNELS = ["WhatsApp", "Instagram", "Site", "Newsletter", "Facebook"];

export function EditorialTransitionPanel({ sub, onChange, onLogPublication }: Props) {
  const status = (sub.editorial_status || "recebido") as EditorialStatus;
  const missing = missingPublishFields(sub as any);
  const incomplete = missing.length > 0;
  const incompleteMsg = `Complete: ${missing.join(", ")}.`;

  return (
    <div className="rounded-lg border border-border bg-muted/30 p-3 space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <StatusBadge status={status} />
        <NextStepLabel status={status} />
      </div>
      {incomplete && (
        <p className="text-[11px] text-amber-700 dark:text-amber-300">
          Falta preencher <strong>{missing.join(", ")}</strong> antes de aprovar, agendar ou publicar.
        </p>
      )}
      <div className="flex flex-wrap gap-2">
        {status === "recebido" && (
          <LockableButton
            disabled={incomplete}
            reason={incompleteMsg}
            onClick={() => onChange(sub.id, "em_revisao")}
            label={<><ArrowRight className="h-3.5 w-3.5 mr-1" /> Iniciar revisão</>}
          />
        )}
        {status === "em_revisao" && (
          <LockableButton
            disabled={incomplete}
            reason={incompleteMsg}
            onClick={() => onChange(sub.id, "flyer_aprovado")}
            label={<><CheckCircle2 className="h-3.5 w-3.5 mr-1" /> Aprovar flyer</>}
          />
        )}
        {status === "flyer_aprovado" && (
          <LockableButton
            disabled={incomplete}
            reason={incompleteMsg}
            onClick={() => onChange(sub.id, "pronto_divulgar")}
            label={<><ArrowRight className="h-3.5 w-3.5 mr-1" /> Marcar pronto p/ divulgar</>}
          />
        )}
        {status === "pronto_divulgar" && <ScheduleDialog sub={sub} onChange={onChange} disabled={incomplete} reason={incompleteMsg} />}
        {status === "agendado" && <PublishDialog sub={sub} onLog={onLogPublication} disabled={incomplete} reason={incompleteMsg} />}
        {status === "publicado" && <ConfirmDialog sub={sub} onChange={onChange} />}
        {(status !== "rejeitado" && status !== "confirmado") && <RejectDialog sub={sub} onChange={onChange} />}
      </div>
      {sub.scheduled_at && (
        <p className="text-[11px] text-muted-foreground">
          <CalendarClock className="inline h-3 w-3 mr-1" />
          Agendado: <strong>{new Date(sub.scheduled_at).toLocaleString("pt-BR")}</strong> via <strong>{sub.scheduled_channel}</strong>
        </p>
      )}
      {sub.published_channels && sub.published_channels.length > 0 && (
        <p className="text-[11px] text-muted-foreground">
          <Megaphone className="inline h-3 w-3 mr-1" />
          Publicado em: <strong>{sub.published_channels.join(", ")}</strong>
        </p>
      )}
      {sub.rejection_reason && (
        <p className="text-[11px] text-destructive">Motivo: {sub.rejection_reason}</p>
      )}
    </div>
  );
}

function LockableButton({
  disabled,
  reason,
  onClick,
  label,
  variant = "outline",
  className,
}: {
  disabled?: boolean;
  reason?: string;
  onClick: () => void;
  label: React.ReactNode;
  variant?: "outline" | "default";
  className?: string;
}) {
  const btn = (
    <span className={disabled ? "inline-flex" : undefined}>
      <Button
        size="sm"
        variant={variant}
        disabled={disabled}
        onClick={onClick}
        className={className}
        aria-disabled={disabled}
      >
        {label}
      </Button>
    </span>
  );
  if (!disabled) return btn;
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>{btn}</TooltipTrigger>
        <TooltipContent>{reason}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

function ScheduleDialog({ sub, onChange, disabled, reason }: { sub: Submission; onChange: Props["onChange"]; disabled?: boolean; reason?: string }) {
  const [open, setOpen] = useState(false);
  const [channel, setChannel] = useState(CHANNELS[0]);
  const [when, setWhen] = useState("");
  const trigger = (
    <Button size="sm" disabled={disabled} aria-disabled={disabled}>
      <CalendarClock className="h-3.5 w-3.5 mr-1" /> Agendar
    </Button>
  );
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {disabled ? (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild><span className="inline-flex">{trigger}</span></TooltipTrigger>
              <TooltipContent>{reason}</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        ) : trigger}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Agendar divulgação</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div>
            <Label>Canal</Label>
            <Select value={channel} onValueChange={setChannel}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{CHANNELS.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div>
            <Label>Data e hora</Label>
            <Input type="datetime-local" value={when} onChange={e => setWhen(e.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
          <Button onClick={async () => {
            if (!when) { toast.error("Informe data e hora"); return; }
            const ok = await onChange(sub.id, "agendado", {
              scheduled_channel: channel,
              scheduled_at: new Date(when).toISOString(),
            });
            if (ok) setOpen(false);
          }}>Agendar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function PublishDialog({ sub, onLog, disabled, reason }: { sub: Submission; onLog: Props["onLogPublication"]; disabled?: boolean; reason?: string }) {
  const [open, setOpen] = useState(false);
  const [channel, setChannel] = useState(sub.scheduled_channel || CHANNELS[0]);
  const trigger = (
    <Button size="sm" disabled={disabled} aria-disabled={disabled}>
      <Megaphone className="h-3.5 w-3.5 mr-1" /> Registrar publicação
    </Button>
  );
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {disabled ? (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild><span className="inline-flex">{trigger}</span></TooltipTrigger>
              <TooltipContent>{reason}</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        ) : trigger}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Registrar publicação</DialogTitle></DialogHeader>
        <div className="space-y-2">
          <Label>Canal publicado</Label>
          <Select value={channel} onValueChange={setChannel}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{CHANNELS.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
          <Button onClick={async () => {
            const ok = await onLog(sub.id, channel);
            if (ok) setOpen(false);
          }}>Confirmar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ConfirmDialog({ sub, onChange }: { sub: Submission; onChange: Props["onChange"] }) {
  const [open, setOpen] = useState(false);
  const [c1, setC1] = useState(!!sub.checklist_publ_canal);
  const [c2, setC2] = useState(!!sub.checklist_visivel_agenda);
  const [c3, setC3] = useState(!!sub.checklist_envio_registrado);
  const allChecked = c1 && c2 && c3;
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white">
          <CheckCircle2 className="h-3.5 w-3.5 mr-1" /> Confirmar fluxo
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Checklist final</DialogTitle></DialogHeader>
        <div className="space-y-3 text-sm">
          <label className="flex items-center gap-2"><Checkbox checked={c1} onCheckedChange={v => setC1(!!v)} /> Publicado no canal</label>
          <label className="flex items-center gap-2"><Checkbox checked={c2} onCheckedChange={v => setC2(!!v)} /> Visível na agenda</label>
          <label className="flex items-center gap-2"><Checkbox checked={c3} onCheckedChange={v => setC3(!!v)} /> Envio registrado</label>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
          <Button disabled={!allChecked} onClick={async () => {
            const ok = await onChange(sub.id, "confirmado", {
              checklist_publ_canal: c1, checklist_visivel_agenda: c2, checklist_envio_registrado: c3,
            });
            if (ok) setOpen(false);
          }}>Confirmar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function RejectDialog({ sub, onChange }: { sub: Submission; onChange: Props["onChange"] }) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive ml-auto">
          <XCircle className="h-3.5 w-3.5 mr-1" /> Rejeitar
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Rejeitar evento</DialogTitle></DialogHeader>
        <div className="space-y-2">
          <Label>Motivo da rejeição</Label>
          <Textarea value={reason} onChange={e => setReason(e.target.value)} rows={3} placeholder="Explique o motivo..." />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
          <Button variant="destructive" onClick={async () => {
            if (!reason.trim()) { toast.error("Informe o motivo"); return; }
            const ok = await onChange(sub.id, "rejeitado", { rejection_reason: reason.trim() });
            if (ok) setOpen(false);
          }}>Rejeitar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
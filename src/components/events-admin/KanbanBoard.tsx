import { useMemo } from "react";
import { Card } from "@/components/ui/card";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { EDITORIAL_STAGES, type EditorialStatus, type Submission } from "./types";
import { StatusBadge, NextStepLabel, PendingPublishBadge } from "./StatusBadge";
import { CalendarDays, MapPin } from "lucide-react";

interface Props {
  submissions: Submission[];
  onSelect: (sub: Submission) => void;
  selectedId?: string | null;
}

export function KanbanBoard({ submissions, onSelect, selectedId }: Props) {
  const byStage = useMemo(() => {
    const map: Record<EditorialStatus, Submission[]> = {
      recebido: [], em_revisao: [], flyer_aprovado: [], pronto_divulgar: [],
      agendado: [], publicado: [], confirmado: [], rejeitado: [],
    };
    submissions.forEach(s => {
      const k = (s.editorial_status || "recebido") as EditorialStatus;
      (map[k] ||= []).push(s);
    });
    return map;
  }, [submissions]);

  return (
    <ScrollArea className="w-full whitespace-nowrap">
      <div className="flex gap-3 pb-3">
        {EDITORIAL_STAGES.filter(s => s.key !== "rejeitado").map(stage => {
          const items = byStage[stage.key] || [];
          return (
            <div key={stage.key} className="flex-shrink-0 w-[260px] flex flex-col">
              <div className={`rounded-t-xl border border-b-0 px-3 py-2 ${stage.color}`}>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider">{stage.label}</span>
                  <span className="text-xs font-mono opacity-80">{items.length}</span>
                </div>
                <p className="text-[10px] opacity-70 mt-0.5 whitespace-normal">{stage.nextStep}</p>
              </div>
              <div className="flex-1 min-h-[200px] rounded-b-xl border bg-muted/20 p-2 space-y-2">
                {items.length === 0 && (
                  <p className="text-[10px] text-muted-foreground text-center py-6">Sem eventos</p>
                )}
                {items.map(sub => {
                  const pending = stage.key === "pronto_divulgar";
                  return (
                    <Card
                      key={sub.id}
                      onClick={() => onSelect(sub)}
                      className={`cursor-pointer p-2.5 hover:border-primary/50 transition-all ${
                        selectedId === sub.id ? "ring-2 ring-primary border-primary" : ""
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <h4 className="text-xs font-semibold leading-tight whitespace-normal line-clamp-2">{sub.event_title}</h4>
                        {pending && <PendingPublishBadge />}
                      </div>
                      <div className="flex items-center gap-2 text-[10px] text-muted-foreground mb-1 whitespace-normal">
                        {sub.date && (
                          <span className="flex items-center gap-1"><CalendarDays className="h-3 w-3" />{sub.date}</span>
                        )}
                        {sub.location && (
                          <span className="flex items-center gap-1 truncate"><MapPin className="h-3 w-3" /><span className="truncate">{sub.location}</span></span>
                        )}
                      </div>
                      <div className="flex items-center justify-between gap-1 mt-2">
                        <StatusBadge status={sub.editorial_status} />
                      </div>
                      <div className="mt-1"><NextStepLabel status={sub.editorial_status} /></div>
                    </Card>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
      <ScrollBar orientation="horizontal" />
    </ScrollArea>
  );
}
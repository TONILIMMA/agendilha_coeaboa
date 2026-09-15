import { Button } from "@/components/ui/button";
import {
  CalendarDays, FileDown, LayoutDashboard, MessageCircle, RotateCcw, Send, FileText
} from "lucide-react";
import { toast } from "sonner";
import { buildTodayWhatsAppSummary, buildWeekWhatsAppSummary, buildCoeABoaSummary, openWhatsAppWithText } from "@/lib/todayWhatsappSummary";
import { buildWhatsAppMessage, type AdminSubmission } from "./adminEventsHelpers";

interface AdminEventsToolbarProps {
  submissions: AdminSubmission[];
  filtered: AdminSubmission[];
  onRefresh: () => void;
  onExportPdf: (list: AdminSubmission[]) => void;
}

const outlineBtn =
  "h-9 sm:h-10 font-bold border-border bg-background hover:bg-muted text-[10px] sm:text-xs px-3 sm:px-4";
const summaryBtn =
  "h-9 sm:h-10 font-bold border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 text-[10px] sm:text-xs px-3 sm:px-4";

/** Cabeçalho da Gestão de Eventos + ações rápidas (atualizar, PDF, resumos e divulgação). */
export function AdminEventsToolbar({
  submissions, filtered, onRefresh, onExportPdf,
}: AdminEventsToolbarProps) {
  function sendSummary(kind: "today" | "week") {
    const { text, count } =
      kind === "today" ? buildTodayWhatsAppSummary(submissions) : buildWeekWhatsAppSummary(submissions);

    if (count === 0) {
      toast.info(
        kind === "today"
          ? "Hoje não temos eventos cadastrados."
          : "Ainda não temos eventos cadastrados para esta semana.",
        { description: "Cadastre ou ajuste a data de um evento antes de gerar o resumo." },
      );
      return;
    }

    openWhatsAppWithText(text);
    toast.success(
      kind === "today"
        ? `Resumo pronto com ${count} rolê${count > 1 ? "s" : ""} de hoje!`
        : `Resumo da semana pronto com ${count} rolê${count > 1 ? "s" : ""}!`,
      { description: "É só escolher os grupos ou contatos e mandar." },
    );
  }

  function shareFirstApproved() {
    const approved = submissions.filter((s) => s.status === "aprovado");
    if (approved.length === 0) {
      toast.warning("Sem eventos para divulgar.", { description: "Aprove um rolê primeiro." });
      return;
    }
    window.open(`https://wa.me/?text=${buildWhatsAppMessage(approved[0])}`, "_blank");
  }

  return (
    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8 md:mb-10">
      <div className="space-y-1">
        <div className="flex items-center gap-2 text-primary">
          <LayoutDashboard className="h-4 w-4" />
          <span className="text-[10px] font-black uppercase tracking-[0.2em]">Backoffice</span>
        </div>
        <h1 className="text-2xl md:text-3xl font-black tracking-tight text-foreground uppercase">Gestão de Eventos</h1>
        <p className="text-muted-foreground text-xs sm:text-sm">Controle operacional e curadoria da agenda hiperlocal.</p>
      </div>

      <div className="flex flex-wrap items-center gap-2 sm:gap-3">
        <Button variant="outline" size="sm" className={outlineBtn} onClick={onRefresh}>
          <RotateCcw className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" /> Atualizar
        </Button>
        <Button variant="outline" size="sm" className={outlineBtn} onClick={() => onExportPdf(filtered)}>
          <FileDown className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" /> Exportar PDF
        </Button>
        <Button
          variant="outline"
          size="sm"
          className={summaryBtn}
          title="Gera o texto dos rolês de hoje e abre o WhatsApp — você escolhe pra quem mandar."
          onClick={() => sendSummary("today")}
        >
          <Send className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
          <span className="hidden sm:inline">Resumo de hoje no WhatsApp</span>
          <span className="sm:hidden">Resumo hoje</span>
        </Button>
        <Button
          variant="outline"
          size="sm"
          className={summaryBtn}
          title="Gera o relatório diário COEABOA e abre o WhatsApp."
          onClick={() => {
            const { text, count } = buildCoeABoaSummary(submissions);
            if (count === 0) {
              toast.info("Hoje não temos eventos cadastrados.", { description: "Cadastre ou mude a data de um evento para gerar o relatório." });
              return;
            }
            openWhatsAppWithText(text);
            toast.success(`Relatório COEABOA gerado com ${count} evento(s)!`);
          }}
        >
          <FileText className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
          <span className="hidden sm:inline">COEABOA do dia</span>
          <span className="sm:hidden">COEABOA</span>
        </Button>
        <Button
          variant="outline"
          size="sm"
          className={summaryBtn}
          title="Gera o texto dos rolês dos próximos 7 dias e abre o WhatsApp — você escolhe pra quem mandar."
          onClick={() => sendSummary("week")}
        >
          <CalendarDays className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
          <span className="hidden sm:inline">Resumo da semana no WhatsApp</span>
          <span className="sm:hidden">Resumo semana</span>
        </Button>
        <Button
          size="sm"
          className="h-9 sm:h-10 font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-600/20 text-[10px] sm:text-xs px-3 sm:px-4"
          onClick={shareFirstApproved}
        >
          <MessageCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
          <span className="hidden sm:inline">Divulgação WhatsApp</span>
          <span className="sm:hidden">WhatsApp</span>
        </Button>
      </div>
    </div>
  );
}

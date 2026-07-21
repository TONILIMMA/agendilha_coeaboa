import { ReactNode } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { FileDown, Printer, X } from "lucide-react";

interface PrintPreviewRow {
  label: string;
  value: string;
}

interface PrintPreviewSheet {
  title: string;
  subtitle?: string;
  rows: PrintPreviewRow[];
  description?: string | null;
}

interface PrintPreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  helper?: string;
  sheets: PrintPreviewSheet[];
  onDownload: () => void;
  downloadLabel?: string;
  extraActions?: ReactNode;
}

/**
 * Mostra uma prévia "pronta pra imprimir" em formato A4 antes de gerar o PDF.
 * O layout espelha o exportEventPdf pra evitar surpresa na hora do download.
 */
export function PrintPreviewDialog({
  open,
  onOpenChange,
  title = "Prévia para impressão",
  helper = "Confira como o PDF vai sair antes de baixar.",
  sheets,
  onDownload,
  downloadLabel = "Baixar PDF",
  extraActions,
}: PrintPreviewDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[92vh] overflow-hidden flex flex-col p-0">
        <DialogHeader className="px-6 pt-6 pb-3 border-b">
          <DialogTitle className="flex items-center gap-2">
            <Printer className="h-4 w-4" />
            {title}
          </DialogTitle>
          <DialogDescription>{helper}</DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-auto bg-muted/40 px-4 py-6 space-y-6">
          {sheets.map((sheet, idx) => (
            <div
              key={idx}
              className="mx-auto bg-white text-slate-900 shadow-lg border w-full max-w-[210mm] aspect-[210/297] p-8 relative print:shadow-none print:border-0"
              style={{ fontFamily: "Helvetica, Arial, sans-serif" }}
            >
              {/* header (matches PDF drawHeader: slate-900 band) */}
              <div className="-mx-8 -mt-8 mb-6 bg-slate-900 text-white px-8 py-4">
                <div className="text-lg font-bold">AgendIlha</div>
                <div className="text-[10px] opacity-80">
                  {sheet.subtitle || `Página ${idx + 1} de ${sheets.length}`}
                </div>
              </div>

              <h2 className="text-xl font-bold mb-5 leading-tight">{sheet.title}</h2>

              <table className="w-full text-[11px] border-collapse mb-4">
                <thead>
                  <tr className="bg-orange-600 text-white">
                    <th className="text-left px-2 py-1.5 font-bold w-1/3">Informação</th>
                    <th className="text-left px-2 py-1.5 font-bold">Detalhe</th>
                  </tr>
                </thead>
                <tbody>
                  {sheet.rows.map((row, i) => (
                    <tr key={i} className="border border-slate-300">
                      <td className="border border-slate-300 px-2 py-1.5 font-semibold align-top">
                        {row.label}
                      </td>
                      <td className="border border-slate-300 px-2 py-1.5 align-top">
                        {row.value || "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {sheet.description && (
                <div className="mt-4">
                  <div className="font-bold text-[11px] mb-1">Descrição</div>
                  <p className="text-[11px] whitespace-pre-wrap leading-relaxed">
                    {sheet.description}
                  </p>
                </div>
              )}

              <div className="absolute bottom-4 left-8 right-8 flex justify-between text-[9px] text-slate-500">
                <span>agendilha.lovable.app</span>
                <span>Página {idx + 1} de {sheets.length}</span>
              </div>
            </div>
          ))}
        </div>

        <DialogFooter className="border-t px-6 py-4 gap-2 flex-row sm:justify-between">
          <Button variant="ghost" onClick={() => onOpenChange(false)} className="gap-1">
            <X className="h-4 w-4" /> Fechar
          </Button>
          <div className="flex gap-2">
            {extraActions}
            <Button onClick={onDownload} className="gap-2">
              <FileDown className="h-4 w-4" />
              {downloadLabel}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export type { PrintPreviewSheet, PrintPreviewRow };
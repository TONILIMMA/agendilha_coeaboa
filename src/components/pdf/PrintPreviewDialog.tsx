import { ReactNode, useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FileDown, Printer, X, Link as LinkIcon, Check } from "lucide-react";
import { toast } from "sonner";

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

export interface PrintPreviewCover {
  eventTitle: string;
  date?: string | null;
  location?: string | null;
  subtitle?: string | null;
}

interface PrintPreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  helper?: string;
  sheets: PrintPreviewSheet[];
  onDownload: (filename: string) => void;
  downloadLabel?: string;
  extraActions?: ReactNode;
  /** Nome-base sugerido do arquivo (sem .pdf). O usuário pode editar antes de baixar. */
  filename?: string;
  /** Se informado, mostra botão "Copiar link" pra compartilhar a prévia sem baixar. */
  shareUrl?: string;
  /** Capa opcional renderizada como primeira página do PDF. */
  cover?: PrintPreviewCover | null;
  /** Conteúdo extra acima das folhas (ex.: seletor de atrativos). */
  beforeSheets?: ReactNode;
}

/**
 * Mostra uma prévia "pronta pra imprimir" em formato A4 antes de gerar o PDF.
 * O layout espelha o exportEventPdf pra evitar surpresa na hora do download.
 */
function slugifyFilename(v: string) {
  return (v || "")
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .toLowerCase().trim()
    .replace(/[^a-z0-9._-]+/g, "-")
    .replace(/-+/g, "-").replace(/^-|-$/g, "")
    .slice(0, 80) || "documento";
}

export function PrintPreviewDialog({
  open,
  onOpenChange,
  title = "Prévia para impressão",
  helper = "Confira como o PDF vai sair antes de baixar.",
  sheets,
  onDownload,
  downloadLabel = "Baixar PDF",
  extraActions,
  filename,
  shareUrl,
  cover,
  beforeSheets,
}: PrintPreviewDialogProps) {
  const suggested = slugifyFilename(filename || "agendilha");
  const [name, setName] = useState(suggested);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (open) setName(slugifyFilename(filename || "agendilha"));
  }, [open, filename]);

  const totalPages = sheets.length + (cover ? 1 : 0);

  const handleCopyLink = async () => {
    if (!shareUrl) return;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast.success("Link da prévia copiado — é só colar onde quiser.");
      setTimeout(() => setCopied(false), 2200);
    } catch {
      toast.error("Não deu pra copiar. Copia manual da barra do navegador.");
    }
  };

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
          {beforeSheets && (
            <div className="mx-auto w-full max-w-[210mm] rounded-lg border bg-background p-4">
              {beforeSheets}
            </div>
          )}

          {cover && (
            <div
              className="mx-auto bg-white text-slate-900 shadow-lg border w-full max-w-[210mm] aspect-[210/297] p-8 relative flex flex-col justify-between"
              style={{ fontFamily: "Helvetica, Arial, sans-serif" }}
            >
              <div className="-mx-8 -mt-8 bg-slate-900 text-white px-8 py-4">
                <div className="text-lg font-bold">AgendIlha</div>
                <div className="text-[10px] opacity-80">{cover.subtitle || "Capa"}</div>
              </div>
              <div className="flex-1 flex flex-col justify-center items-center text-center px-4">
                <div className="text-[10px] uppercase tracking-widest text-slate-500 mb-3">Ficha do evento</div>
                <h1 className="text-3xl font-bold leading-tight mb-6 capitalize">{cover.eventTitle}</h1>
                {cover.date && (
                  <div className="text-base text-slate-700 mb-1">{cover.date}</div>
                )}
                {cover.location && (
                  <div className="text-sm text-slate-600">{cover.location}</div>
                )}
              </div>
              <div className="flex justify-between text-[9px] text-slate-500">
                <span>agendilha.lovable.app</span>
                <span>Capa</span>
              </div>
            </div>
          )}

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
                <span>Página {idx + 1 + (cover ? 1 : 0)} de {totalPages}</span>
              </div>
            </div>
          ))}
        </div>

        <div className="border-t px-6 py-3 space-y-3 bg-background">
          <div className="flex flex-col sm:flex-row gap-2 sm:items-end">
            <div className="flex-1 min-w-0">
              <Label htmlFor="pdf-filename" className="text-xs text-muted-foreground">
                Nome do arquivo
              </Label>
              <div className="flex items-stretch mt-1">
                <Input
                  id="pdf-filename"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  onBlur={() => setName((v) => slugifyFilename(v))}
                  placeholder="agendilha"
                  className="rounded-r-none"
                />
                <span className="inline-flex items-center px-3 rounded-r-md border border-l-0 bg-muted text-xs text-muted-foreground">
                  .pdf
                </span>
              </div>
            </div>
            {shareUrl && (
              <Button type="button" variant="outline" onClick={handleCopyLink} className="gap-2 shrink-0">
                {copied ? <Check className="h-4 w-4" /> : <LinkIcon className="h-4 w-4" />}
                {copied ? "Link copiado" : "Copiar link da prévia"}
              </Button>
            )}
          </div>
          <DialogFooter className="gap-2 flex-row sm:justify-between p-0">
            <Button variant="ghost" onClick={() => onOpenChange(false)} className="gap-1">
              <X className="h-4 w-4" /> Fechar
            </Button>
            <div className="flex gap-2">
              {extraActions}
              <Button
                onClick={() => onDownload(`${slugifyFilename(name)}.pdf`)}
                className="gap-2"
                disabled={!sheets.length}
              >
                <FileDown className="h-4 w-4" />
                {downloadLabel}
              </Button>
            </div>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export type { PrintPreviewSheet, PrintPreviewRow };
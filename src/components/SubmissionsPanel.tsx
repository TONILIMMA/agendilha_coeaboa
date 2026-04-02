import { useEffect } from "react";
import { useSubmissions } from "@/contexts/SubmissionContext";
import { useAuth } from "@/contexts/AuthContext";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ClipboardList, MessageCircle, Trash2, Download, FileDown, Loader2 } from "lucide-react";
import { exportSingleEventPdf, exportBulkEventsPdf } from "@/lib/pdfExport";
import { toast } from "sonner";
import { useState } from "react";

const categoryLabels: Record<string, string> = {
  musica: "Música / Show",
  gastronomia: "Gastronomia",
  cultura: "Cultura / Arte",
  esporte: "Esporte",
  promocoes: "Promoções / Ofertas",
  outros: "Outros",
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("pt-BR", {
    day: "2-digit", month: "2-digit", year: "2-digit", hour: "2-digit", minute: "2-digit",
  });
}

function buildWhatsAppMessage(sub: any): string {
  const lines = [
    `📌 *${sub.event_title || "Evento"}*`,
    "",
    `📅 ${sub.date || ""} às ${sub.start_time || ""}`,
    `📍 ${sub.location || ""}`,
  ];
  const addressParts = [sub.address_street, sub.address_number, sub.address_neighborhood, sub.address_city, sub.address_state, sub.address_zip].filter(Boolean);
  if (addressParts.length) lines.push(`🗺️ ${addressParts.join(", ")}`);
  lines.push("", `${sub.description || ""}`);
  if (sub.promotion_type) lines.push(`🎯 Tipo: ${sub.promotion_type}`);
  if (sub.target_audience) lines.push(`👥 Público: ${sub.target_audience}`);
  if (sub.promotion_rules) lines.push(`📋 Regras: ${sub.promotion_rules}`);
  lines.push("", `🏢 ${sub.company_name || ""}`, `📞 ${sub.phone || ""}`);
  lines.push(`📂 ${categoryLabels[sub.category || ""] || sub.category || ""}`);
  if (sub.contact_social) lines.push(`📱 ${sub.contact_social}`);
  if (sub.video_link) lines.push(`🎬 ${sub.video_link}`);
  if (sub.additional_details) lines.push(`ℹ️ ${sub.additional_details}`);
  lines.push("", "Divulgação via AgendIlha / Coé a Boa? 🌴");
  return encodeURIComponent(lines.join("\n"));
}

function exportToCSV(submissions: any[]) {
  const headers = [
    "Data Envio", "Empresa", "Responsável", "E-mail", "Telefone",
    "Evento", "Data", "Horário", "Local", "Rua", "Número", "Bairro", "Cidade", "Estado", "CEP",
    "Descrição", "Categoria", "Tipo Promoção", "Público-alvo", "Regras", "Redes Sociais", "Detalhes Adicionais", "Vídeo",
  ];
  const rows = submissions.map((s) => [
    formatDate(s.created_at),
    s.company_name || "", s.responsible_name || "", s.email || "", s.phone || "",
    s.event_title || "", s.date || "", s.start_time || "", s.location || "",
    s.address_street || "", s.address_number || "", s.address_neighborhood || "",
    s.address_city || "", s.address_state || "", s.address_zip || "",
    s.description || "", categoryLabels[s.category || ""] || "",
    s.promotion_type || "", s.target_audience || "", s.promotion_rules || "",
    s.contact_social || "", s.additional_details || "", s.video_link || "",
  ]);
  const csv = [headers, ...rows]
    .map((r) => r.map((c: string) => `"${String(c).replace(/"/g, '""')}"`).join(","))
    .join("\n");
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `agendilha_envios_${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
  toast.success("CSV exportado com sucesso!");
}

export default function SubmissionsPanel({ children }: { children: React.ReactNode }) {
  const { submissions, loading, fetchSubmissions, deleteSubmission, savedCount } = useSubmissions();
  const { isAdmin } = useAuth();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (open) fetchSubmissions();
  }, [open, fetchSubmissions]);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>{children}</SheetTrigger>
      <SheetContent side="right" className="w-full sm:max-w-2xl overflow-y-auto">
        <SheetHeader className="pb-4">
          <SheetTitle className="font-display flex items-center gap-2 text-lg">
            <ClipboardList className="h-5 w-5 text-primary" />
            {isAdmin ? "Todos os Envios" : "Meus Envios"}
            {savedCount > 0 && (
              <Badge variant="secondary" className="ml-1 text-xs">{savedCount}</Badge>
            )}
          </SheetTitle>
        </SheetHeader>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : submissions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <ClipboardList className="h-12 w-12 text-muted-foreground/40 mb-3" />
            <p className="text-muted-foreground text-sm">Nenhum envio encontrado.</p>
          </div>
        ) : (
          <>
            <div className="flex flex-wrap justify-end gap-2 mb-3">
              <Button variant="outline" size="sm" onClick={() => exportToCSV(submissions)} className="text-xs">
                <Download className="mr-1.5 h-3.5 w-3.5" />
                Exportar CSV
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  exportBulkEventsPdf(submissions);
                  toast.success("PDF gerado com sucesso!");
                }}
                className="text-xs"
              >
                <FileDown className="mr-1.5 h-3.5 w-3.5" />
                Exportar PDF
              </Button>
            </div>
            <div className="space-y-4">
              {submissions.map((sub) => (
                <div key={sub.id} className="rounded-lg border border-border bg-card p-4 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-display font-semibold text-foreground">{sub.event_title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{formatDate(sub.created_at)}</p>
                    </div>
                    <Badge variant="outline" className="text-xs shrink-0">
                      {categoryLabels[sub.category || ""] || "—"}
                    </Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                    <div>
                      <span className="text-muted-foreground text-xs">Empresa:</span>
                      <p className="text-foreground">{sub.company_name || "—"}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground text-xs">Responsável:</span>
                      <p className="text-foreground">{sub.responsible_name || "—"}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground text-xs">Local:</span>
                      <p className="text-foreground">{sub.location || "—"}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground text-xs">Data/Hora:</span>
                      <p className="text-foreground">{sub.date || "—"} {sub.start_time || ""}</p>
                    </div>
                  </div>
                  {sub.description && (
                    <p className="text-sm text-muted-foreground italic">"{sub.description}"</p>
                  )}
                  <div className="flex items-center gap-2 pt-1">
                    <Button
                      size="sm"
                      onClick={() => window.open(`https://wa.me/?text=${buildWhatsAppMessage(sub)}`, "_blank")}
                      className="bg-[hsl(142,70%,40%)] hover:bg-[hsl(142,70%,35%)] text-white text-xs"
                    >
                      <MessageCircle className="mr-1.5 h-3.5 w-3.5" />
                      WhatsApp
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => deleteSubmission(sub.id)}
                      className="text-xs text-destructive hover:text-destructive"
                    >
                      <Trash2 className="mr-1 h-3.5 w-3.5" />
                      Remover
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}

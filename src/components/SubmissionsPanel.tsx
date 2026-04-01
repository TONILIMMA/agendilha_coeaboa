import { useState } from "react";
import { useSubmissions } from "@/contexts/SubmissionContext";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ClipboardList, MessageCircle, Trash2, Download } from "lucide-react";
import { toast } from "sonner";

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
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function buildWhatsAppMessage(data: Record<string, unknown>): string {
  const lines = [
    `📌 *${data.eventTitle || "Evento"}*`,
    "",
    `📅 ${data.dateTime || ""}`,
    `📍 ${data.location || ""}`,
    "",
    `${data.description || ""}`,
    "",
    `🏢 ${data.companyName || ""}`,
    `📞 ${data.phone || ""}`,
    `📂 ${categoryLabels[(data.category as string) || ""] || data.category || ""}`,
  ];
  if (data.videoLink) lines.push(`🎬 ${data.videoLink}`);
  lines.push("", "Divulgação via AgendIlha / Coé a Boa? 🌴");
  return encodeURIComponent(lines.join("\n"));
}

function exportToCSV(submissions: Array<{ id: string; timestamp: string; data: Record<string, unknown> }>) {
  const headers = [
    "Data Envio", "Empresa", "Responsável", "E-mail", "Telefone",
    "Evento", "Data/Hora", "Local", "Descrição", "Categoria", "Vídeo",
  ];
  const rows = submissions.map((s) => [
    formatDate(s.timestamp),
    s.data.companyName || "",
    s.data.responsibleName || "",
    s.data.email || "",
    s.data.phone || "",
    s.data.eventTitle || "",
    s.data.dateTime || "",
    s.data.location || "",
    s.data.description || "",
    categoryLabels[(s.data.category as string) || ""] || "",
    s.data.videoLink || "",
  ]);

  const csv = [headers, ...rows]
    .map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(","))
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

interface SubmissionsPanelProps {
  children: React.ReactNode;
}

export default function SubmissionsPanel({ children }: SubmissionsPanelProps) {
  const { getSavedSubmissions, savedCount } = useSubmissions();
  const [open, setOpen] = useState(false);
  const submissions = open ? getSavedSubmissions() : [];

  const handleWhatsApp = (data: Record<string, unknown>) => {
    const msg = buildWhatsAppMessage(data);
    window.open(`https://wa.me/?text=${msg}`, "_blank");
  };

  const handleDelete = (id: string) => {
    try {
      const stored = localStorage.getItem("agendilha_submissions");
      if (!stored) return;
      const all = JSON.parse(stored) as Array<{ id: string }>;
      const updated = all.filter((s) => s.id !== id);
      localStorage.setItem("agendilha_submissions", JSON.stringify(updated));
      toast.success("Envio removido");
      // Force re-render by toggling
      setOpen(false);
      setTimeout(() => setOpen(true), 50);
    } catch {
      toast.error("Erro ao remover");
    }
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>{children}</SheetTrigger>
      <SheetContent side="right" className="w-full sm:max-w-2xl overflow-y-auto">
        <SheetHeader className="pb-4">
          <SheetTitle className="font-display flex items-center gap-2 text-lg">
            <ClipboardList className="h-5 w-5 text-primary" />
            Envios Realizados
            {savedCount > 0 && (
              <Badge variant="secondary" className="ml-1 text-xs">{savedCount}</Badge>
            )}
          </SheetTitle>
        </SheetHeader>

        {submissions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <ClipboardList className="h-12 w-12 text-muted-foreground/40 mb-3" />
            <p className="text-muted-foreground text-sm">Nenhum envio salvo ainda.</p>
            <p className="text-muted-foreground/60 text-xs mt-1">
              Preencha o formulário e clique em "Enviar Divulgação".
            </p>
          </div>
        ) : (
          <>
            <div className="flex justify-end mb-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => exportToCSV(submissions)}
                className="text-xs"
              >
                <Download className="mr-1.5 h-3.5 w-3.5" />
                Exportar CSV
              </Button>
            </div>

            <div className="space-y-4">
              {submissions.map((sub) => (
                <div
                  key={sub.id}
                  className="rounded-lg border border-border bg-card p-4 space-y-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-display font-semibold text-foreground">
                        {(sub.data.eventTitle as string) || "Sem título"}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {formatDate(sub.timestamp)}
                      </p>
                    </div>
                    <Badge variant="outline" className="text-xs shrink-0">
                      {categoryLabels[(sub.data.category as string) || ""] || "—"}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                    <div>
                      <span className="text-muted-foreground text-xs">Empresa:</span>
                      <p className="text-foreground">{(sub.data.companyName as string) || "—"}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground text-xs">Responsável:</span>
                      <p className="text-foreground">{(sub.data.responsibleName as string) || "—"}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground text-xs">Local:</span>
                      <p className="text-foreground">{(sub.data.location as string) || "—"}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground text-xs">Data/Hora:</span>
                      <p className="text-foreground">{(sub.data.dateTime as string) || "—"}</p>
                    </div>
                  </div>

                  {sub.data.description && (
                    <p className="text-sm text-muted-foreground italic">
                      "{sub.data.description as string}"
                    </p>
                  )}

                  <div className="flex items-center gap-2 pt-1">
                    <Button
                      size="sm"
                      onClick={() => handleWhatsApp(sub.data)}
                      className="bg-[hsl(142,70%,40%)] hover:bg-[hsl(142,70%,35%)] text-white text-xs"
                    >
                      <MessageCircle className="mr-1.5 h-3.5 w-3.5" />
                      WhatsApp
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDelete(sub.id)}
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
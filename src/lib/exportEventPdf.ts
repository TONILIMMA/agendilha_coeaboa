import type jsPDF from "jspdf";

/**
 * jsPDF e jspdf-autotable pesam ~400kB. Carregamos só na hora de gerar o PDF
 * pra não travar o primeiro carregamento das telas que só oferecem o botão.
 */
type JsPdfCtor = typeof import("jspdf").default;
type AutoTableFn = typeof import("jspdf-autotable").default;

let jsPDFCtor: JsPdfCtor | null = null;
let autoTable: AutoTableFn | null = null;

async function loadPdfLibs(): Promise<{ jsPDFCtor: JsPdfCtor; autoTable: AutoTableFn }> {
  if (!jsPDFCtor || !autoTable) {
    const [pdfMod, tableMod] = await Promise.all([
      import("jspdf"),
      import("jspdf-autotable"),
    ]);
    jsPDFCtor = pdfMod.default;
    autoTable = tableMod.default;
  }
  return { jsPDFCtor, autoTable };
}

export interface EventPdfData {
  event_title?: string | null;
  date?: string | null;
  start_time?: string | null;
  end_time?: string | null;
  location?: string | null;
  address_street?: string | null;
  address_number?: string | null;
  address_neighborhood?: string | null;
  address_city?: string | null;
  category?: string | null;
  age_rating?: string | null;
  description?: string | null;
  artist_name?: string | null;
  music_style?: string | null;
  sale_price?: string | null;
}

export interface AtrativoPdfData {
  name?: string | null;
  tipo_atrativo?: string | null;
  estilos?: string[] | null;
  description?: string | null;
  contact_whatsapp?: string | null;
  email?: string | null;
}

function fmtDate(iso?: string | null) {
  if (!iso) return "—";
  try {
    const d = new Date(iso);
    return d.toLocaleDateString("pt-BR", {
      weekday: "long", day: "2-digit", month: "long", year: "numeric",
    });
  } catch {
    return iso;
  }
}

function drawHeader(doc: jsPDF, title: string, subtitle: string) {
  doc.setFillColor(15, 23, 42); // slate-900
  doc.rect(0, 0, 210, 28, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text("AgendIlha", 14, 12);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text(subtitle, 14, 20);
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text(title, 14, 40, { maxWidth: 180 });
}

function drawFooter(doc: jsPDF) {
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(120, 120, 120);
    doc.text(
      `Gerado em ${new Date().toLocaleString("pt-BR")} — agendilha.lovable.app`,
      14,
      287,
    );
    doc.text(`Página ${i} de ${pageCount}`, 196, 287, { align: "right" });
  }
}

export interface PdfCover {
  eventTitle: string;
  date?: string | null;
  location?: string | null;
  subtitle?: string | null;
}

function drawCover(doc: jsPDF, cover: PdfCover) {
  doc.setFillColor(15, 23, 42);
  doc.rect(0, 0, 210, 28, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text("AgendIlha", 14, 12);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text(cover.subtitle || "Capa", 14, 20);

  doc.setTextColor(120, 120, 120);
  doc.setFontSize(10);
  doc.text("FICHA DO EVENTO", 105, 110, { align: "center" });

  doc.setTextColor(0, 0, 0);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(24);
  const titleLines = doc.splitTextToSize(cover.eventTitle, 170);
  doc.text(titleLines, 105, 130, { align: "center" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(14);
  doc.setTextColor(60, 60, 60);
  let y = 130 + titleLines.length * 9 + 12;
  if (cover.date) {
    doc.text(cover.date, 105, y, { align: "center" });
    y += 9;
  }
  if (cover.location) {
    doc.setFontSize(12);
    const locLines = doc.splitTextToSize(cover.location, 170);
    doc.text(locLines, 105, y, { align: "center" });
  }

  doc.addPage();
}

export function exportEventToPdf(
  event: EventPdfData,
  opts?: { filename?: string; cover?: PdfCover | null } | string,
) {
  // Backward compat: 2nd arg used to be a filename string.
  const options = typeof opts === "string" ? { filename: opts } : (opts || {});
  const filename = options.filename;

  const doc = new jsPDF({ unit: "mm", format: "a4" });
  if (options.cover) drawCover(doc, options.cover);
  drawHeader(doc, event.event_title || "Evento sem título", "Ficha do evento");

  const addr = [event.address_street, event.address_number].filter(Boolean).join(", ");
  const local = [event.location, addr, event.address_neighborhood, event.address_city]
    .filter(Boolean).join(" — ");

  const rows: [string, string][] = [
    ["Data", fmtDate(event.date)],
    ["Horário", `${event.start_time || "—"}${event.end_time ? ` até ${event.end_time}` : ""}`],
    ["Local", local || "—"],
    ["Categoria", event.category || "—"],
    ["Classificação", event.age_rating || "Livre"],
    ["Atrativo", event.artist_name || "—"],
    ["Estilo", event.music_style || "—"],
    ["Ingresso / Preço", event.sale_price || "—"],
  ];

  autoTable(doc, {
    startY: 48,
    head: [["Informação", "Detalhe"]],
    body: rows,
    styles: { fontSize: 10, cellPadding: 3 },
    headStyles: { fillColor: [234, 88, 12], textColor: 255 },
    columnStyles: { 0: { cellWidth: 45, fontStyle: "bold" }, 1: { cellWidth: 145 } },
    theme: "grid",
  });

  if (event.description) {
    const y = (doc as any).lastAutoTable.finalY + 10;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text("Descrição", 14, y);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text(doc.splitTextToSize(event.description, 180), 14, y + 6);
  }

  drawFooter(doc);
  doc.save(filename || `evento-${(event.event_title || "agendilha").toLowerCase().replace(/\s+/g, "-")}.pdf`);
}

export function exportAtrativoToPdf(a: AtrativoPdfData, filename?: string) {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  drawHeader(doc, a.name || "Atrativo sem nome", "Ficha do atrativo");

  const rows: [string, string][] = [
    ["Tipo", a.tipo_atrativo || "—"],
    ["Estilos", (a.estilos || []).join(", ") || "—"],
    ["WhatsApp", a.contact_whatsapp || "—"],
    ["E-mail", a.email || "—"],
  ];

  autoTable(doc, {
    startY: 48,
    head: [["Informação", "Detalhe"]],
    body: rows,
    styles: { fontSize: 10, cellPadding: 3 },
    headStyles: { fillColor: [234, 88, 12], textColor: 255 },
    columnStyles: { 0: { cellWidth: 45, fontStyle: "bold" }, 1: { cellWidth: 145 } },
    theme: "grid",
  });

  if (a.description) {
    const y = (doc as any).lastAutoTable.finalY + 10;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text("Sobre", 14, y);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text(doc.splitTextToSize(a.description, 180), 14, y + 6);
  }

  drawFooter(doc);
  doc.save(filename || `atrativo-${(a.name || "agendilha").toLowerCase().replace(/\s+/g, "-")}.pdf`);
}

/**
 * Renderiza uma folha (sem save) para um atrativo específico dentro de um doc
 * já aberto. Usado pelo PDF consolidado.
 */
function renderAtrativoPage(doc: jsPDF, a: AtrativoPdfData, index: number, total: number) {
  drawHeader(doc, a.name || "Atrativo sem nome", `Ficha ${index + 1} de ${total} — Atrativos AgendIlha`);

  const rows: [string, string][] = [
    ["Tipo", a.tipo_atrativo || "—"],
    ["Estilos", (a.estilos || []).join(", ") || "—"],
    ["WhatsApp", a.contact_whatsapp || "—"],
    ["E-mail", a.email || "—"],
  ];

  autoTable(doc, {
    startY: 48,
    head: [["Informação", "Detalhe"]],
    body: rows,
    styles: { fontSize: 10, cellPadding: 3 },
    headStyles: { fillColor: [234, 88, 12], textColor: 255 },
    columnStyles: { 0: { cellWidth: 45, fontStyle: "bold" }, 1: { cellWidth: 145 } },
    theme: "grid",
  });

  if (a.description) {
    const y = (doc as any).lastAutoTable.finalY + 10;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text("Sobre", 14, y);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text(doc.splitTextToSize(a.description, 180), 14, y + 6);
  }
}

/**
 * PDF único com vários atrativos — uma ficha por página.
 */
export function exportAtrativosConsolidatedPdf(
  atrativos: AtrativoPdfData[],
  opts?: { filename?: string; cover?: PdfCover | null } | string,
) {
  if (!atrativos.length) return;
  const options = typeof opts === "string" ? { filename: opts } : (opts || {});
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  if (options.cover) drawCover(doc, options.cover);
  atrativos.forEach((a, i) => {
    if (i > 0) doc.addPage();
    renderAtrativoPage(doc, a, i, atrativos.length);
  });
  drawFooter(doc);
  doc.save(options.filename || `atrativos-agendilha-${new Date().toISOString().slice(0, 10)}.pdf`);
}
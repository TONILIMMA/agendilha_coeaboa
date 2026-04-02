import jsPDF from "jspdf";
import { AGENDILHA_LOGO_BASE64 } from "./logoBase64";

const categoryLabels: Record<string, string> = {
  musica: "Música / Show",
  gastronomia: "Gastronomia",
  cultura: "Cultura / Arte",
  esporte: "Esporte",
  promocoes: "Promoções / Ofertas",
  outros: "Outros",
};

interface EventData {
  event_title: string;
  date?: string | null;
  start_time?: string | null;
  end_time?: string | null;
  location?: string | null;
  address_street?: string | null;
  address_number?: string | null;
  address_neighborhood?: string | null;
  address_city?: string | null;
  address_state?: string | null;
  address_zip?: string | null;
  description?: string | null;
  company_name?: string | null;
  responsible_name?: string | null;
  phone?: string | null;
  email?: string | null;
  category?: string | null;
  promotion_type?: string | null;
  target_audience?: string | null;
  promotion_rules?: string | null;
  contact_social?: string | null;
  video_link?: string | null;
  additional_details?: string | null;
  created_at?: string;
}

const BRAND_ORANGE: [number, number, number] = [232, 89, 12];
const DARK_TEXT: [number, number, number] = [33, 33, 33];
const MEDIUM_TEXT: [number, number, number] = [100, 100, 100];
const LIGHT_LINE: [number, number, number] = [220, 220, 220];
const SECTION_BG: [number, number, number] = [250, 245, 240];

const PAGE_W = 210;
const MARGIN = 18;
const CONTENT_W = PAGE_W - MARGIN * 2;
const HEADER_H = 16;
const FOOTER_Y = 280;

function addSectionField(
  doc: jsPDF,
  label: string,
  value: string,
  x: number,
  y: number,
  maxWidth: number
): number {
  if (!value || value === "—") return y;

  // Check page break
  if (y > 258) {
    doc.addPage();
    y = 22;
  }

  // Label
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(...MEDIUM_TEXT);
  doc.text(label.toUpperCase(), x, y);
  y += 5;

  // Value
  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.setTextColor(...DARK_TEXT);
  const lines = doc.splitTextToSize(value, maxWidth - 4);
  doc.text(lines, x + 2, y);
  y += lines.length * 5.5 + 5;

  return y;
}

function drawHeader(doc: jsPDF) {
  // Orange header bar
  doc.setFillColor(...BRAND_ORANGE);
  doc.rect(0, 0, PAGE_W, HEADER_H, "F");

  // Logo image
  try {
    doc.addImage(
      `data:image/png;base64,${AGENDILHA_LOGO_BASE64}`,
      "PNG",
      MARGIN,
      2,
      24,
      12
    );
  } catch {
    // Fallback if image fails
  }

  // White title (offset for logo)
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text("AgendIlha  |  Coé a Boa?", MARGIN + 26, 10);

  // Right-aligned date
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  const dateStr = new Date().toLocaleDateString("pt-BR");
  doc.text(dateStr, PAGE_W - MARGIN, 10, { align: "right" });
}

function drawFooter(doc: jsPDF, isLastPage: boolean) {
  // Thin divider
  doc.setDrawColor(...LIGHT_LINE);
  doc.setLineWidth(0.3);
  doc.line(MARGIN, FOOTER_Y - 4, PAGE_W - MARGIN, FOOTER_Y - 4);

  // Footer text
  doc.setFontSize(7);
  doc.setTextColor(...MEDIUM_TEXT);
  doc.text(
    `Gerado em ${new Date().toLocaleDateString("pt-BR")} — AgendIlha`,
    MARGIN,
    FOOTER_Y
  );

  if (isLastPage) {
    const linkUrl = "https://coeaboa.lovable.app";
    const linkText = "Acesse: coeaboa.lovable.app";
    doc.setFontSize(8);
    doc.setTextColor(...BRAND_ORANGE);
    doc.textWithLink(linkText, MARGIN, FOOTER_Y + 5, { url: linkUrl });
  }
}

function drawEventPage(doc: jsPDF, event: EventData, isLastPage = true) {
  drawHeader(doc);
  let y = HEADER_H + 10;

  // Category badge
  const catLabel = categoryLabels[event.category || ""] || event.category || "";
  if (catLabel) {
    doc.setFillColor(...SECTION_BG);
    const badgeW = doc.getTextWidth(catLabel) + 10;
    doc.roundedRect(MARGIN, y - 4, badgeW, 7, 2, 2, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(...BRAND_ORANGE);
    doc.text(catLabel, MARGIN + 5, y + 1);
    y += 12;
  }

  // Event title
  doc.setTextColor(...DARK_TEXT);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  const titleLines = doc.splitTextToSize(event.event_title, CONTENT_W);
  doc.text(titleLines, MARGIN, y);
  y += titleLines.length * 8 + 4;

  // Orange divider under title
  doc.setDrawColor(...BRAND_ORANGE);
  doc.setLineWidth(0.8);
  doc.line(MARGIN, y, MARGIN + 40, y);
  y += 10;

  // ── Section: Informações do Evento ──
  doc.setFillColor(...SECTION_BG);
  doc.rect(MARGIN - 2, y - 4, CONTENT_W + 4, 7, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(...BRAND_ORANGE);
  doc.text("INFORMAÇÕES DO EVENTO", MARGIN + 2, y + 1);
  y += 12;

  const timeStr = event.start_time ? `${event.start_time}${event.end_time ? ` às ${event.end_time}` : ""}` : "—";
  y = addSectionField(doc, "Data e Horário", `${event.date || "—"}  •  ${timeStr}`, MARGIN, y, CONTENT_W);
  y = addSectionField(doc, "Local", event.location || "—", MARGIN, y, CONTENT_W);

  const addressParts = [
    event.address_street,
    event.address_number,
    event.address_neighborhood,
    event.address_city,
    event.address_state,
    event.address_zip,
  ].filter(Boolean);
  if (addressParts.length) {
    y = addSectionField(doc, "Endereço", addressParts.join(", "), MARGIN, y, CONTENT_W);
  }

  y = addSectionField(doc, "Descrição", event.description || "—", MARGIN, y, CONTENT_W);
  y += 2;

  // ── Section: Contato e Responsável ──
  if (y > 240) { doc.addPage(); y = 22; }
  doc.setFillColor(...SECTION_BG);
  doc.rect(MARGIN - 2, y - 4, CONTENT_W + 4, 7, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(...BRAND_ORANGE);
  doc.text("CONTATO E RESPONSÁVEL", MARGIN + 2, y + 1);
  y += 12;

  y = addSectionField(doc, "Empresa", event.company_name || "—", MARGIN, y, CONTENT_W);
  y = addSectionField(doc, "Responsável", event.responsible_name || "—", MARGIN, y, CONTENT_W);
  y = addSectionField(doc, "Telefone", event.phone || "—", MARGIN, y, CONTENT_W);
  y = addSectionField(doc, "E-mail", event.email || "—", MARGIN, y, CONTENT_W);
  if (event.contact_social) {
    y = addSectionField(doc, "Redes Sociais", event.contact_social, MARGIN, y, CONTENT_W);
  }
  y += 2;

  // ── Section: Detalhes Adicionais (conditional) ──
  const hasExtras = event.promotion_type || event.target_audience || event.promotion_rules || event.video_link || event.additional_details;
  if (hasExtras) {
    if (y > 240) { doc.addPage(); y = 22; }
    doc.setFillColor(...SECTION_BG);
    doc.rect(MARGIN - 2, y - 4, CONTENT_W + 4, 7, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(...BRAND_ORANGE);
    doc.text("DETALHES ADICIONAIS", MARGIN + 2, y + 1);
    y += 12;

    if (event.promotion_type) y = addSectionField(doc, "Tipo de Promoção", event.promotion_type, MARGIN, y, CONTENT_W);
    if (event.target_audience) y = addSectionField(doc, "Público-alvo", event.target_audience, MARGIN, y, CONTENT_W);
    if (event.promotion_rules) y = addSectionField(doc, "Regras", event.promotion_rules, MARGIN, y, CONTENT_W);
    if (event.video_link) y = addSectionField(doc, "Link de Vídeo", event.video_link, MARGIN, y, CONTENT_W);
    if (event.additional_details) y = addSectionField(doc, "Observações", event.additional_details, MARGIN, y, CONTENT_W);
  }

  drawFooter(doc, isLastPage);
}

export function exportSingleEventPdf(event: EventData) {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  drawEventPage(doc, event);
  doc.save(`evento_${event.event_title.replace(/\s+/g, "_").slice(0, 30)}.pdf`);
}

export function exportBulkEventsPdf(events: EventData[]) {
  if (events.length === 0) return;
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  events.forEach((event, i) => {
    if (i > 0) doc.addPage();
    drawEventPage(doc, event, i === events.length - 1);
  });
  doc.save(`agendilha_eventos_${new Date().toISOString().slice(0, 10)}.pdf`);
}

export function getEventPdfBlob(event: EventData): Blob {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  drawEventPage(doc, event);
  return doc.output("blob");
}

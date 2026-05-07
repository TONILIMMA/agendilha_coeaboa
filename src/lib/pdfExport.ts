import jsPDF from "jspdf";
import { AGENDILHA_LOGO_BASE64, LOGO_MIME } from "./logoBase64";

const categoryLabels: Record<string, string> = {
  musica: "Música / Show",
  gastronomia: "Gastronomia",
  cultura: "Cultura / Arte",
  esporte: "Esporte",
  promocoes: "Promoções / Ofertas",
  outros: "Outros",
};

interface EventData {
  id?: string;
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
  is_highlight?: boolean;
  views_count?: number;
  shares_count?: number;
}

const BRAND_ORANGE: [number, number, number] = [232, 89, 12];
const DARK_TEXT: [number, number, number] = [33, 33, 33];
const MEDIUM_TEXT: [number, number, number] = [100, 100, 100];
const LIGHT_LINE: [number, number, number] = [220, 220, 220];
const SECTION_BG: [number, number, number] = [250, 245, 240];

function formatWhatsApp(raw?: string | null): string {
  if (!raw) return "";
  const digits = raw.replace(/\D/g, "");
  if (digits.length === 11) return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
  if (digits.length === 10) return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  if (digits.length === 13) return `+${digits.slice(0, 2)} (${digits.slice(2, 4)}) ${digits.slice(4, 9)}-${digits.slice(9)}`;
  return raw;
}

const PAGE_W = 210;
const PAGE_H = 297;
const MARGIN = 18;
const CONTENT_W = PAGE_W - MARGIN * 2;
const HEADER_H = 16;
const FOOTER_Y = 280;

// Single-page layout limit (above footer divider)
const MAX_Y = FOOTER_Y - 8;

interface FieldOpts {
  labelSize?: number;
  valueSize?: number;
  lineHeight?: number;
  gap?: number;
}

function addSectionField(
  doc: jsPDF,
  label: string,
  value: string,
  x: number,
  y: number,
  maxWidth: number,
  opts: FieldOpts = {}
): number {
  if (!value || value === "—") return y;

  const labelSize = opts.labelSize ?? 9;
  const valueSize = opts.valueSize ?? 11;
  const lineHeight = opts.lineHeight ?? 5.5;
  const gap = opts.gap ?? 5;

  // Stop rendering if we've run out of room (single-page constraint)
  if (y > MAX_Y - 8) return y;

  // Label
  doc.setFont("helvetica", "bold");
  doc.setFontSize(labelSize);
  doc.setTextColor(...MEDIUM_TEXT);
  doc.text(label.toUpperCase(), x, y);
  y += labelSize * 0.55;

  // Value — clamp lines so we never overflow the page
  doc.setFont("helvetica", "normal");
  doc.setFontSize(valueSize);
  doc.setTextColor(...DARK_TEXT);
  const allLines: string[] = doc.splitTextToSize(value, maxWidth - 4);
  const remaining = MAX_Y - y;
  const maxLines = Math.max(1, Math.floor(remaining / lineHeight) - 1);
  let lines = allLines;
  if (allLines.length > maxLines) {
    lines = allLines.slice(0, maxLines);
    const last = lines[lines.length - 1] ?? "";
    lines[lines.length - 1] = last.replace(/\s+\S*$/, "") + "…";
  }
  doc.text(lines, x + 2, y);
  y += lines.length * lineHeight + gap;

  return y;
}

function drawSectionHeader(doc: jsPDF, title: string, y: number): number {
  doc.setFillColor(...SECTION_BG);
  doc.rect(MARGIN - 2, y - 4, CONTENT_W + 4, 7, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(...BRAND_ORANGE);
  doc.text(title, MARGIN + 2, y + 1);
  return y + 12;
}

function drawHeader(doc: jsPDF) {
  // Orange header bar
  doc.setFillColor(...BRAND_ORANGE);
  doc.rect(0, 0, PAGE_W, HEADER_H, "F");

  // Logo image (square Coé a Boa logo)
  try {
    const mime = LOGO_MIME === "JPEG" ? "jpeg" : "png";
    doc.addImage(
      `data:image/${mime};base64,${AGENDILHA_LOGO_BASE64}`,
      LOGO_MIME,
      MARGIN,
      2,
      12,
      12
    );
  } catch {
    // Fallback if image fails
  }

  // White title (offset for logo)
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text("AgendIlha | Coé a Boa?", MARGIN + 16, 10);

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
    `Gerado em ${new Date().toLocaleDateString("pt-BR")} — AgendIlha do Governador`,
    MARGIN,
    FOOTER_Y
  );

  if (isLastPage) {
    const linkUrl = "https://agendilha-divulgacao.lovable.app/agenda";
    const linkText = "Acesse a agenda completa: agendilha-divulgacao.lovable.app/agenda";
    doc.setFontSize(8);
    doc.setTextColor(...BRAND_ORANGE);
    doc.textWithLink(linkText, MARGIN, FOOTER_Y + 5, { url: linkUrl });
  }
}

function drawEventPage(doc: jsPDF, event: EventData, isLastPage = true) {
  drawHeader(doc);
  let y = HEADER_H + 10;

  // Decide compactness based on amount of content (single-page constraint)
  const extrasCount = [
    event.promotion_type,
    event.target_audience,
    event.promotion_rules,
    event.video_link,
    event.additional_details,
    event.contact_social,
  ].filter(Boolean).length;
  const descLen = (event.description || "").length;
  const compact = extrasCount >= 3 || descLen > 320;
  const fieldOpts: FieldOpts = compact
    ? { labelSize: 8, valueSize: 9.5, lineHeight: 4.6, gap: 3 }
    : {};

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
    y += 10;
  }

  // Event title — auto-shrink long titles
  doc.setTextColor(...DARK_TEXT);
  doc.setFont("helvetica", "bold");
  const titleSize = event.event_title.length > 60 ? 14 : event.event_title.length > 40 ? 16 : 18;
  doc.setFontSize(titleSize);
  const titleLines = doc.splitTextToSize(event.event_title, CONTENT_W).slice(0, 2);
  doc.text(titleLines, MARGIN, y);
  y += titleLines.length * (titleSize * 0.45) + 3;

  // Orange divider under title
  doc.setDrawColor(...BRAND_ORANGE);
  doc.setLineWidth(0.8);
  doc.line(MARGIN, y, MARGIN + 40, y);
  y += compact ? 7 : 10;

  // ── Section: Informações do Evento ──
  y = drawSectionHeader(doc, "INFORMAÇÕES DO EVENTO", y);

  const timeStr = event.start_time ? `${event.start_time}${event.end_time ? ` às ${event.end_time}` : ""}` : "—";
  y = addSectionField(doc, "Data e Horário", `${event.date || "—"}  •  ${timeStr}`, MARGIN, y, CONTENT_W, fieldOpts);
  y = addSectionField(doc, "Local", event.location || "—", MARGIN, y, CONTENT_W, fieldOpts);

  const addressParts = [
    event.address_street,
    event.address_number,
    event.address_neighborhood,
    event.address_city,
    event.address_state,
    event.address_zip,
  ].filter(Boolean);
  if (addressParts.length) {
    y = addSectionField(doc, "Endereço", addressParts.join(", "), MARGIN, y, CONTENT_W, fieldOpts);
  }

  // Uber link — clickable, uses full address (or location as fallback)
  const uberDestination = addressParts.length
    ? addressParts.join(", ")
    : event.location || "";
  if (uberDestination) {
    const labelSize = fieldOpts.labelSize ?? 9;
    const valueSize = fieldOpts.valueSize ?? 11;
    const lineHeight = fieldOpts.lineHeight ?? 5.5;
    const gap = fieldOpts.gap ?? 5;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(labelSize);
    doc.setTextColor(...MEDIUM_TEXT);
    doc.text("COMO CHEGAR", MARGIN, y);
    y += labelSize * 0.55;

    // Black Uber pill icon
    const iconX = MARGIN + 2;
    const iconY = y + 0.3;
    const pillW = 9;
    const pillH = 4.2;
    doc.setFillColor(0, 0, 0);
    doc.roundedRect(iconX - 1, iconY - 1, pillW, pillH, 1, 1, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(6);
    doc.text("Uber", iconX + pillW / 2 - 1, iconY + 1.9, { align: "center" });

    // Clickable link
    const uberUrl = `https://m.uber.com/ul/?action=setPickup&pickup=my_location&dropoff[formatted_address]=${encodeURIComponent(uberDestination)}`;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(valueSize);
    doc.setTextColor(0, 0, 0);
    const textX = iconX + pillW + 2;
    doc.textWithLink("Ir de Uber até o evento", textX, y + 2, { url: uberUrl });
    y += lineHeight + gap;
  }

  y = addSectionField(doc, "Descrição", event.description || "—", MARGIN, y, CONTENT_W, fieldOpts);
  y += compact ? 1 : 2;

  // ── Section: Contato e Responsável (no page break) ──
  if (y < MAX_Y - 20) {
    y = drawSectionHeader(doc, "CONTATO E RESPONSÁVEL", y);
    y = addSectionField(doc, "Empresa", event.company_name || "—", MARGIN, y, CONTENT_W, fieldOpts);
    y = addSectionField(doc, "Responsável", event.responsible_name || "—", MARGIN, y, CONTENT_W, fieldOpts);

    // WhatsApp do Divulgador (clickable with icon)
    const phoneFormatted = formatWhatsApp(event.phone);
    if (phoneFormatted) {
      const labelSize = fieldOpts.labelSize ?? 9;
      const valueSize = fieldOpts.valueSize ?? 11;
      const lineHeight = fieldOpts.lineHeight ?? 5.5;
      const gap = fieldOpts.gap ?? 5;

      doc.setFont("helvetica", "bold");
      doc.setFontSize(labelSize);
      doc.setTextColor(...MEDIUM_TEXT);
      doc.text("WHATSAPP DO DIVULGADOR", MARGIN, y);
      y += labelSize * 0.55;

      // WhatsApp green circle icon
      const iconX = MARGIN + 2;
      const iconY = y + 1;
      const iconR = 2.2;
      doc.setFillColor(37, 211, 102); // WhatsApp green
      doc.circle(iconX, iconY, iconR, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(3.2);
      doc.text("W", iconX, iconY + 1, { align: "center" });

      // Clickable phone text
      const digits = (event.phone || "").replace(/\D/g, "");
      const waUrl = digits ? `https://wa.me/${digits.length <= 11 ? "55" + digits : digits}` : "";
      doc.setFont("helvetica", "normal");
      doc.setFontSize(valueSize);
      doc.setTextColor(37, 211, 102);
      const textX = iconX + iconR + 2.5;
      if (waUrl) {
        doc.textWithLink(phoneFormatted, textX, y + 2, { url: waUrl });
      } else {
        doc.text(phoneFormatted, textX, y + 2);
      }
      y += lineHeight + gap;
    }

    y = addSectionField(doc, "E-mail", event.email || "—", MARGIN, y, CONTENT_W, fieldOpts);
    if (event.contact_social) {
      y = addSectionField(doc, "Redes Sociais", event.contact_social, MARGIN, y, CONTENT_W, fieldOpts);
    }
    y += compact ? 1 : 2;
  }

  // ── Section: Detalhes Adicionais (conditional, no page break) ──
  const hasExtras = event.promotion_type || event.target_audience || event.promotion_rules || event.video_link || event.additional_details;
  if (hasExtras && y < MAX_Y - 20) {
    y = drawSectionHeader(doc, "DETALHES ADICIONAIS", y);
    if (event.promotion_type) y = addSectionField(doc, "Tipo de Promoção", event.promotion_type, MARGIN, y, CONTENT_W, fieldOpts);
    if (event.target_audience) y = addSectionField(doc, "Público-alvo", event.target_audience, MARGIN, y, CONTENT_W, fieldOpts);
    if (event.promotion_rules) y = addSectionField(doc, "Regras", event.promotion_rules, MARGIN, y, CONTENT_W, fieldOpts);
    if (event.video_link) y = addSectionField(doc, "Link de Vídeo", event.video_link, MARGIN, y, CONTENT_W, fieldOpts);
    if (event.additional_details) y = addSectionField(doc, "Observações", event.additional_details, MARGIN, y, CONTENT_W, fieldOpts);
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

 export function exportEditorialAgendaPdf(events: EventData[], title: string = "Agenda Cultural") {
   if (events.length === 0) return;
   const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
   
   // --- Capa ---
   doc.setFillColor(...BRAND_ORANGE);
   doc.rect(0, 0, PAGE_W, 100, "F");
   
   try {
     const mime = LOGO_MIME === "JPEG" ? "jpeg" : "png";
     doc.addImage(`data:image/${mime};base64,${AGENDILHA_LOGO_BASE64}`, LOGO_MIME, PAGE_W/2 - 20, 15, 40, 40);
   } catch (e) {}

   doc.setTextColor(255, 255, 255);
   doc.setFont("helvetica", "bold");
   doc.setFontSize(32);
   doc.text("AgendIlha", PAGE_W/2, 70, { align: "center" });
   
   doc.setFontSize(16);
   doc.text(title, PAGE_W/2, 82, { align: "center" });
   
   doc.setTextColor(...DARK_TEXT);
   doc.setFontSize(14);
   const dateStr = new Date().toLocaleDateString("pt-BR", { day: '2-digit', month: 'long', year: 'numeric' });
   doc.text(dateStr, PAGE_W/2, 115, { align: "center" });

   // Destaques
   const highlights = events.filter(e => e.is_highlight);
   if (highlights.length > 0) {
     doc.setFont("helvetica", "bold");
     doc.setFontSize(14);
     doc.setTextColor(...BRAND_ORANGE);
     doc.text("EVENTOS EM DESTAQUE", MARGIN, 140);
     
     let hy = 150;
     highlights.slice(0, 6).forEach(h => {
       doc.setTextColor(...DARK_TEXT);
       doc.setFontSize(11);
       doc.text(`• ${h.event_title}`, MARGIN + 5, hy);
       doc.setFontSize(9);
       doc.setTextColor(...MEDIUM_TEXT);
       doc.text(`  ${h.start_time || ''} no ${h.location || ''}`, MARGIN + 5, hy + 5);
       hy += 12;
     });
   }

   // Rodapé da capa com QR Code (Simulado)
   doc.setFontSize(9);
   doc.setTextColor(...MEDIUM_TEXT);
   doc.text("Confira a agenda completa online:", PAGE_W/2, FOOTER_Y - 20, { align: "center" });
   doc.setTextColor(...BRAND_ORANGE);
   doc.text("agendilha-divulgacao.lovable.app/agenda", PAGE_W/2, FOOTER_Y - 15, { align: "center" });

   // --- Lista de Eventos ---
   const grouped: Record<string, EventData[]> = {};
   events.forEach(e => {
     const key = e.date || "Sem data";
     if (!grouped[key]) grouped[key] = [];
     grouped[key].push(e);
   });

   Object.entries(grouped).sort().forEach(([date, dayEvents]) => {
     doc.addPage();
     drawHeader(doc);
     let y = HEADER_H + 15;
     
     doc.setFont("helvetica", "bold");
     doc.setFontSize(18);
     doc.setTextColor(...BRAND_ORANGE);
     doc.text(date, MARGIN, y);
     y += 12;
     
     dayEvents.sort((a,b) => (a.start_time || '').localeCompare(b.start_time || '')).forEach(ev => {
       if (y > MAX_Y - 20) {
         drawFooter(doc, false);
         doc.addPage();
         drawHeader(doc);
         y = HEADER_H + 15;
       }
       
       doc.setFont("helvetica", "bold");
       doc.setFontSize(12);
       doc.setTextColor(...DARK_TEXT);
       doc.text(`${ev.start_time || '--:--'} - ${ev.event_title}`, MARGIN, y);
       y += 6;
       
       doc.setFont("helvetica", "normal");
       doc.setFontSize(10);
       doc.setTextColor(...MEDIUM_TEXT);
       doc.text(`Local: ${ev.location || 'N/I'} • ${ev.address_neighborhood || ''}`, MARGIN + 5, y);
       y += 10;
     });
     drawFooter(doc, true);
   });

   doc.save(`agenda_agendilha_${new Date().toISOString().slice(0, 10)}.pdf`);
 }

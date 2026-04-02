import jsPDF from "jspdf";

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

function addField(doc: jsPDF, label: string, value: string, x: number, y: number, maxWidth: number): number {
  if (!value || value === "—") return y;
  const lineHeight = 5;
  const gap = 3;

  // Label on its own line
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text(label, x, y);
  y += lineHeight + 1;

  // Value below the label, full width, wrapped
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  const lines = doc.splitTextToSize(value, maxWidth);
  doc.text(lines, x + 4, y);
  y += lines.length * lineHeight + gap;

  return y;
}

function drawEventPage(doc: jsPDF, event: EventData, pageWidth: number) {
  const margin = 20;
  const contentWidth = pageWidth - margin * 2;
  let y = margin;

  // Header bar
  doc.setFillColor(232, 89, 12); // orange brand
  doc.rect(0, 0, pageWidth, 14, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.text("AgendIlha / Coé a Boa? 🌴", margin, 9);
  y = 24;

  // Event title
  doc.setTextColor(232, 89, 12);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  const titleLines = doc.splitTextToSize(event.event_title, contentWidth);
  doc.text(titleLines, margin, y);
  y += titleLines.length * 8 + 4;

  // Divider
  doc.setDrawColor(232, 89, 12);
  doc.setLineWidth(0.5);
  doc.line(margin, y, pageWidth - margin, y);
  y += 8;

  // Fields
  doc.setTextColor(40, 40, 40);

  const fields: [string, string][] = [
    ["📅 Data:", `${event.date || "—"} às ${event.start_time || "—"}`],
    ["📍 Local:", event.location || "—"],
  ];

  const addressParts = [event.address_street, event.address_number, event.address_neighborhood, event.address_city, event.address_state, event.address_zip].filter(Boolean);
  if (addressParts.length) {
    fields.push(["🗺️ Endereço:", addressParts.join(", ")]);
  }

  fields.push(
    ["📝 Descrição:", event.description || "—"],
    ["🏢 Empresa:", event.company_name || "—"],
    ["👤 Responsável:", event.responsible_name || "—"],
    ["📞 Telefone:", event.phone || "—"],
    ["📧 E-mail:", event.email || "—"],
    ["📂 Categoria:", categoryLabels[event.category || ""] || event.category || "—"],
  );

  if (event.promotion_type) fields.push(["🎯 Tipo Promoção:", event.promotion_type]);
  if (event.target_audience) fields.push(["👥 Público-alvo:", event.target_audience]);
  if (event.promotion_rules) fields.push(["📋 Regras:", event.promotion_rules]);
  if (event.contact_social) fields.push(["📱 Redes Sociais:", event.contact_social]);
  if (event.video_link) fields.push(["🎬 Vídeo:", event.video_link]);
  if (event.additional_details) fields.push(["ℹ️ Detalhes:", event.additional_details]);

  for (const [label, value] of fields) {
    if (y > 255) {
      doc.addPage();
      y = 20;
    }
    y = addField(doc, label, value, margin, y, contentWidth);
  }

  // Footer
  const footerY = 285;
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.3);
  doc.line(margin, footerY - 4, pageWidth - margin, footerY - 4);
  doc.setFontSize(8);
  doc.setTextColor(150, 150, 150);
  doc.text(
    `Gerado em ${new Date().toLocaleDateString("pt-BR")} — AgendIlha`,
    margin,
    footerY
  );
}

export function exportSingleEventPdf(event: EventData) {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  drawEventPage(doc, event, 210);
  doc.save(`evento_${event.event_title.replace(/\s+/g, "_").slice(0, 30)}.pdf`);
}

export function exportBulkEventsPdf(events: EventData[]) {
  if (events.length === 0) return;
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  events.forEach((event, i) => {
    if (i > 0) doc.addPage();
    drawEventPage(doc, event, 210);
  });
  doc.save(`agendilha_eventos_${new Date().toISOString().slice(0, 10)}.pdf`);
}

export function getEventPdfBlob(event: EventData): Blob {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  drawEventPage(doc, event, 210);
  return doc.output("blob");
}

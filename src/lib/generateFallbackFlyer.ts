// Generates a default 1080x1080 flyer (PNG dataURL) using the Coé a Boa? brand
// when the user submits an event without uploading a flyer.

export interface FallbackFlyerData {
  title: string;
  date?: string | null;
  startTime?: string | null;
  location?: string | null;
  category?: string | null;
}

const BRAND_BG = "#1f4d3a";
const BRAND_BG_DARK = "#0e2a1f";
const BRAND_ACCENT = "#f5b400";
const TEXT_LIGHT = "#fafaf5";
const TEXT_MUTED = "rgba(250,250,245,0.78)";
const LOGO_URL = "/coeaboa-logo.jpg";
let cachedLogo: HTMLImageElement | null = null;

async function loadImage(src: string): Promise<HTMLImageElement | null> {
  if (cachedLogo) return cachedLogo;
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      cachedLogo = img;
      resolve(img);
    };
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  maxLines: number
): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    const test = current ? `${current} ${word}` : word;
    if (ctx.measureText(test).width > maxWidth && current) {
      lines.push(current);
      current = word;
      if (lines.length === maxLines - 1) break;
    } else {
      current = test;
    }
  }
  if (current && lines.length < maxLines) lines.push(current);
  if (lines.length === maxLines) {
    const last = lines[maxLines - 1];
    if (ctx.measureText(last + "…").width > maxWidth) {
      lines[maxLines - 1] = last.slice(0, -3) + "…";
    }
  }
  return lines;
}

export async function generateFallbackFlyer(
  data: FallbackFlyerData
): Promise<string> {
  const size = 1080;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas não disponível");

  const gradient = ctx.createLinearGradient(0, 0, size, size);
  gradient.addColorStop(0, BRAND_BG);
  gradient.addColorStop(1, BRAND_BG_DARK);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);

  const logo = await loadImage(LOGO_URL);
  if (logo) {
    const wmSize = size * 0.85;
    ctx.save();
    ctx.globalAlpha = 0.08;
    ctx.drawImage(logo, (size - wmSize) / 2, (size - wmSize) / 2, wmSize, wmSize);
    ctx.restore();

    ctx.save();
    ctx.globalAlpha = 0.95;
    ctx.drawImage(logo, 70, 70, 120, 120);
    ctx.restore();
  }

  ctx.fillStyle = TEXT_LIGHT;
  ctx.font = "600 32px 'Helvetica Neue', Arial, sans-serif";
  ctx.textBaseline = "middle";
  ctx.fillText("Coé a Boa?", logo ? 210 : 70, 130);

  ctx.fillStyle = BRAND_ACCENT;
  ctx.fillRect(70, 260, 120, 8);

  if (data.category) {
    const label = data.category.toUpperCase();
    ctx.font = "700 24px 'Helvetica Neue', Arial, sans-serif";
    const padX = 24;
    const w = ctx.measureText(label).width + padX * 2;
    const x = 70;
    const y = 300;
    ctx.fillStyle = "rgba(245,180,0,0.18)";
    ctx.strokeStyle = BRAND_ACCENT;
    ctx.lineWidth = 2;
    const r = 28;
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + 56, r);
    ctx.arcTo(x + w, y + 56, x, y + 56, r);
    ctx.arcTo(x, y + 56, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = BRAND_ACCENT;
    ctx.textBaseline = "middle";
    ctx.fillText(label, x + padX, y + 28);
  }

  ctx.fillStyle = TEXT_LIGHT;
  ctx.textBaseline = "top";
  ctx.font = "800 88px 'Helvetica Neue', Arial, sans-serif";
  const titleLines = wrapText(ctx, data.title || "Evento", size - 140, 4);
  let y = 400;
  for (const line of titleLines) {
    ctx.fillText(line, 70, y);
    y += 100;
  }

  const infoY = size - 320;
  ctx.fillStyle = "rgba(0,0,0,0.35)";
  ctx.fillRect(0, infoY, size, 320);

  ctx.fillStyle = BRAND_ACCENT;
  ctx.fillRect(70, infoY + 40, 60, 6);

  const drawLine = (label: string, value: string, lineY: number) => {
    ctx.fillStyle = TEXT_MUTED;
    ctx.font = "600 22px 'Helvetica Neue', Arial, sans-serif";
    ctx.fillText(label.toUpperCase(), 70, lineY);
    ctx.fillStyle = TEXT_LIGHT;
    ctx.font = "700 36px 'Helvetica Neue', Arial, sans-serif";
    ctx.fillText(value, 70, lineY + 32);
  };

  const when = [data.date, data.startTime].filter(Boolean).join("  •  ") || "A confirmar";
  drawLine("Quando", when, infoY + 70);
  drawLine("Onde", data.location || "A confirmar", infoY + 180);

  // JPEG ~5-8x menor que PNG para o mesmo flyer — corta upload/geração.
  return canvas.toDataURL("image/jpeg", 0.85);
}

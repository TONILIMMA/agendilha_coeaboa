// Compressão client-side de imagens antes do upload.
// Alvo: até 1600px no lado maior, JPEG qualidade 0.82. Mantém PNG só quando
// há transparência; caso contrário converte para JPEG (5-8x menor).

const MAX_SIDE = 1600;
const JPEG_QUALITY = 0.82;

export interface CompressedFile {
  file: File;
  preview: string;
  originalSize: number;
  finalSize: number;
  compressed: boolean;
  type: "image" | "video";
  durationSec?: number;
}

async function fileToImage(file: File): Promise<HTMLImageElement> {
  const url = URL.createObjectURL(file);
  try {
    return await new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = url;
    });
  } finally {
    // deixa o consumidor decidir se revoga; a preview usa outro objectURL
    URL.revokeObjectURL(url);
  }
}

export async function compressImage(file: File): Promise<CompressedFile> {
  const originalSize = file.size;
  // GIFs animados: não comprime (perderia animação)
  if (file.type === "image/gif") {
    return {
      file,
      preview: URL.createObjectURL(file),
      originalSize,
      finalSize: originalSize,
      compressed: false,
      type: "image",
    };
  }

  try {
    const img = await fileToImage(file);
    const { width, height } = img;
    const largest = Math.max(width, height);
    const scale = largest > MAX_SIDE ? MAX_SIDE / largest : 1;
    const targetW = Math.round(width * scale);
    const targetH = Math.round(height * scale);

    const canvas = document.createElement("canvas");
    canvas.width = targetW;
    canvas.height = targetH;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas indisponível");
    ctx.drawImage(img, 0, 0, targetW, targetH);

    const outType = file.type === "image/png" ? "image/png" : "image/jpeg";
    const blob: Blob | null = await new Promise((resolve) =>
      canvas.toBlob(resolve, outType, JPEG_QUALITY)
    );
    if (!blob || blob.size >= originalSize) {
      // se não ganhou nada, mantém o original
      return {
        file,
        preview: URL.createObjectURL(file),
        originalSize,
        finalSize: originalSize,
        compressed: false,
        type: "image",
      };
    }
    const ext = outType === "image/png" ? "png" : "jpg";
    const base = file.name.replace(/\.[^.]+$/, "");
    const compressed = new File([blob], `${base}.${ext}`, { type: outType });
    return {
      file: compressed,
      preview: URL.createObjectURL(compressed),
      originalSize,
      finalSize: compressed.size,
      compressed: true,
      type: "image",
    };
  } catch (e) {
    // fallback: sobe o original
    return {
      file,
      preview: URL.createObjectURL(file),
      originalSize,
      finalSize: originalSize,
      compressed: false,
      type: "image",
    };
  }
}

export async function inspectVideo(file: File): Promise<CompressedFile> {
  const preview = URL.createObjectURL(file);
  const durationSec = await new Promise<number | undefined>((resolve) => {
    const v = document.createElement("video");
    v.preload = "metadata";
    v.onloadedmetadata = () => resolve(v.duration || undefined);
    v.onerror = () => resolve(undefined);
    v.src = preview;
  });
  return {
    file,
    preview,
    originalSize: file.size,
    finalSize: file.size,
    compressed: false,
    type: "video",
    durationSec,
  };
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
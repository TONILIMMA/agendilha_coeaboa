import { supabase } from "@/integrations/supabase/client";

export const AD_PHOTOS_BUCKET = "ad-photos";
export const AD_PHOTOS_MAX = 5;
const MAX_BYTES = 10 * 1024 * 1024;

/**
 * Envia uma foto do anúncio e devolve o caminho salvo.
 * Cada pessoa grava dentro da própria pasta (regra do cofre de imagens).
 */
export async function uploadAdPhoto(file: File, userId: string): Promise<string> {
  if (!file.type.startsWith("image/")) {
    throw new Error("Só dá pra enviar imagem (JPG, PNG ou WEBP).");
  }
  if (file.size > MAX_BYTES) {
    throw new Error("A imagem passou de 10 MB. Manda uma versão mais leve.");
  }

  const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
  const path = `${userId}/${crypto.randomUUID()}.${ext}`;

  const { error } = await supabase.storage
    .from(AD_PHOTOS_BUCKET)
    .upload(path, file, { cacheControl: "3600", upsert: false });
  if (error) throw error;

  return path;
}

/** Apaga uma foto do anúncio. */
export async function removeAdPhoto(path: string): Promise<void> {
  const { error } = await supabase.storage.from(AD_PHOTOS_BUCKET).remove([path]);
  if (error) throw error;
}

/** Gera links temporários (7 dias) para exibir as fotos. */
export async function getAdPhotoUrls(paths: string[]): Promise<Record<string, string>> {
  if (paths.length === 0) return {};
  const { data, error } = await supabase.storage
    .from(AD_PHOTOS_BUCKET)
    .createSignedUrls(paths, 60 * 60 * 24 * 7);
  if (error) throw error;

  const map: Record<string, string> = {};
  (data ?? []).forEach((item) => {
    if (item.path && item.signedUrl) map[item.path] = item.signedUrl;
  });
  return map;
}

import { useQuery } from "@tanstack/react-query";
import { getAdPhotoUrls } from "@/lib/adPhotos";

/** Links de exibição das fotos de anúncio, em cache por 6 dias. */
export function useAdPhotoUrls(paths: string[]) {
  const chave = [...paths].sort().join("|");
  return useQuery({
    queryKey: ["ad-photo-urls", chave],
    enabled: paths.length > 0,
    staleTime: 6 * 24 * 60 * 60 * 1000,
    queryFn: () => getAdPhotoUrls(paths),
  });
}

/** Primeira foto do anúncio (capa) — undefined quando não há foto. */
export function useAdCoverUrl(paths: string[]): string | undefined {
  const { data } = useAdPhotoUrls(paths.slice(0, 1));
  return paths[0] ? data?.[paths[0]] : undefined;
}

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

/** Chaves de configuração usadas pelo app. */
export const SETTING_KEYS = {
  teamWhatsapp: "team_whatsapp",
  destaqueEventoTitulo: "destaque_evento_titulo",
  destaqueEventoTexto: "destaque_evento_texto",
  destaqueAnuncioTitulo: "destaque_anuncio_titulo",
  destaqueAnuncioTexto: "destaque_anuncio_texto",
  destaqueCta: "destaque_cta",
} as const;

export type SettingKey = (typeof SETTING_KEYS)[keyof typeof SETTING_KEYS];

export const DEFAULT_SETTINGS: Record<SettingKey, string> = {
  team_whatsapp: "",
  destaque_evento_titulo: "Destaque sua publicação para maior visibilidade",
  destaque_evento_texto:
    "Contrate o destaque e seu flyer ficará em evidência no carrossel de até 10 eventos, aumentando alcance e público.",
  destaque_anuncio_titulo: "Destaque sua publicação para maior visibilidade",
  destaque_anuncio_texto:
    "Contrate um destaque e seu anúncio ficará em evidência no carrossel de até 10 destaques, aumentando alcance e vendas.",
  destaque_cta: "Destacar publicação",
};

export const APP_SETTINGS_KEY = ["app_settings"] as const;

export interface AppSettingRow {
  key: string;
  value: string;
  description: string | null;
}

/** Configurações do app (WhatsApp da equipe, textos do modal de destaque). */
export function useAppSettings() {
  return useQuery({
    queryKey: APP_SETTINGS_KEY,
    staleTime: 60_000,
    queryFn: async (): Promise<Record<string, string>> => {
      const { data, error } = await supabase
        .from("app_settings")
        .select("key, value, description");
      if (error) throw error;
      const map: Record<string, string> = { ...DEFAULT_SETTINGS };
      (data ?? []).forEach((row) => {
        if (row.value !== null && row.value !== undefined) map[row.key] = row.value;
      });
      return map;
    },
  });
}

/** Lê uma configuração com fallback para o texto padrão. */
export function settingOr(
  settings: Record<string, string> | undefined,
  key: SettingKey,
): string {
  const value = settings?.[key];
  return value && value.trim() ? value : DEFAULT_SETTINGS[key];
}

/** Grava/atualiza configurações (somente Administrador ou Master pelas regras do banco). */
export function useSaveAppSettings() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (entries: Record<string, string>) => {
      const rows = Object.entries(entries).map(([key, value]) => ({ key, value }));
      const { error } = await supabase
        .from("app_settings")
        .upsert(rows, { onConflict: "key" });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: APP_SETTINGS_KEY });
    },
  });
}

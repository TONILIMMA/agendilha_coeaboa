/**
 * Changelog do AgendIlha.
 *
 * Como usar:
 *  1. Antes de publicar uma nova versão, aumente APP_VERSION (ex.: "2026.06.30").
 *  2. Adicione um novo item no TOPO da lista UPDATES com o mesmo número de versão.
 *  3. Escreva como se fosse uma conversa entre amigos da Ilha (guia de voz do AgendIlha):
 *     - "title": comece SEMPRE com "Novidade no AgendIlha:" ou "Novo jeito de…".
 *       Curto, até 60 caracteres, sem ponto final.
 *     - "items": 2–4 bullets, cada um com 1 frase curta no padrão
 *       "[O que mudou]. [Como usar, em linguagem do dia a dia]."
 *     - PROIBIDO usar termos técnicos no texto do modal: nada de "RLS", "endpoint",
 *       "service worker", "cache", "deploy", "PWA", "API". Se precisar citar, troque
 *       por uma explicação simples ("instalar como app", "atualizar com 1 toque").
 *
 * O modal aparece UMA VEZ por versão para cada usuário (salvo em localStorage).
 */

export const APP_VERSION = "2026.06.30";

export interface AppUpdate {
  version: string;
  date: string; // "30/06/2026"
  title: string;
  items: string[];
}

export const UPDATES: AppUpdate[] = [
  {
    version: "2026.06.30",
    date: "30/06/2026",
    title: "Novidade no AgendIlha: app no celular e sininho de avisos",
    items: [
      "Dá pra instalar o AgendIlha no celular. Toca em 'Instalar' no rodapé e ele vira app na sua tela inicial.",
      "Chegou versão nova do app. Aparece um aviso no topo — toca em 'Atualizar' e pronto, sem ficar preso em tela antiga.",
      "Sininho lá em cima pros administradores: cada evento novo cai ali. Clica e vai direto pro rolê esperando aprovação.",
      "Toda mudança importante abre uma janelinha como esta. É só ler e tocar em 'Beleza, bora usar' pra seguir.",
    ],
  },
];
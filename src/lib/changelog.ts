/**
 * Changelog do AgendIlha.
 *
 * Como usar:
 *  1. Antes de publicar uma nova versão, aumente APP_VERSION (ex.: "2026.06.30").
 *  2. Adicione um novo item no TOPO da lista UPDATES com o mesmo número de versão.
 *  3. Escreva em linguagem normal, como se estivesse explicando para um amigo.
 *     - "title" curto (até 60 caracteres).
 *     - "items" são bullets do que mudou e como usar.
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
    title: "Notificações, instalação no celular e avisos de atualização",
    items: [
      "Agora você pode instalar o AgendIlha como app no seu celular: aparece um botão discreto no rodapé, é só tocar em 'Instalar'.",
      "Quando sair uma nova versão do app, você verá um aviso para atualizar com 1 toque — nada de ficar preso em telas antigas.",
      "Administradores recebem um sininho no canto superior: cada novo evento enviado aparece ali. Clicou na notificação, vai direto para o evento aguardando aprovação.",
      "Toda atualização importante vai abrir uma janelinha como esta, explicando o que mudou.",
    ],
  },
];
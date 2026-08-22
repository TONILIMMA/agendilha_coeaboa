# Plano de Melhorias AgendIlha / Coé a Boa

Melhorias focadas em UX do Divulgador, simplificação do fluxo de cadastro, organização temporal da agenda e relatórios administrativos.

## 1. Área do Divulgador: Compartilhamento de Perfil
- **Objetivo**: Facilitar a divulgação do perfil público do divulgador.
- **Implementação**:
  - Adicionar botão "Compartilhar Perfil" em `src/pages/divulgador/StatusDivulgador.tsx` (quando aprovado).
  - Usar a Web Share API (se disponível) ou fallback para copiar para o clipboard.
  - Gerar link no formato: `window.location.origin + "/divulgador/" + user.id`.
  - Template de mensagem WhatsApp: "Confira meu perfil no AgendIlha e acompanhe meus eventos: [link]".

## 2. Simplificação do Fluxo de Cadastro (Etapas 3-7)
- **Objetivo**: Reduzir o número de cliques unificando o cadastro do evento em uma única visualização densa.
- **Implementação**:
  - Refatorar `src/components/SubmissionForm.tsx` para combinar os campos das etapas 3 (Evento), 4 (Atrativo), 5 (Local), 6 (Arte) e 7 (Legal).
  - Manter as etapas 1 (Identificação) e 2 (Profissional) como onboarding inicial (ou combiná-las se possível, mas o pedido foca em 3 a 7).
  - Utilizar `Accordions` ou `Sections` verticais para organizar os grupos de campos sem mudar de página.

## 3. Agenda Organizada por Semana e Calendário Compacto
- **Objetivo**: Melhorar a navegação temporal na Landing e na Explorar.
- **Implementação**:
  - Modificar `src/pages/Explorar.tsx` e `src/pages/Landing.tsx`.
  - Criar componente `WeeklyCalendar` que exibe 7 dias por vez.
  - Destacar apenas dias com eventos (usando os dados já buscados).
  - Adicionar navegação "Semana anterior/próxima".
  - Filtro de lista: Ao selecionar um dia, filtrar o array local de eventos e ordenar por `start_time`.

## 4. Relatório de Parceiros com Busca por Região/Data
- **Objetivo**: Ferramenta administrativa para curadoria.
- **Implementação**:
  - Criar ou atualizar a página de relatório (presumivelmente em `src/pages/AdminNewsletter.tsx` ou similar, mas o pedido sugere algo novo/específico).
  - Filtros: `Região` (Bairro) e `Data`.
  - Ordenação obrigatória por horário crescente.

## 5. QR Code Coé a Boa
- **Objetivo**: Divulgação física do portal.
- **Implementação**:
  - Adicionar componente de geração de QR Code (usando `qrcode.react`) direcionado para `https://coeaboa.com`.
  - Opção de download como PNG.
  - Label: "Acesse o Coé a Boa".

## Detalhes Técnicos
- **Frontend**: React, Lucide-React para ícones, Shadcn UI para componentes.
- **Backend**: Supabase (RLS já configurado para `submissions` aprovadas).
- **Responsividade**: Tailwind classes (`sm:`, `md:`, `lg:`) garantindo mobile-first.

---
Informe ao final:
- **Componentes**: `SubmissionForm`, `Explorar`, `StatusDivulgador`, `DiscoveryEventCard`.
- **Tabelas**: `submissions`, `profiles`, `user_roles`.
- **Regras**: Somente eventos `status = 'aprovado'` na área pública.

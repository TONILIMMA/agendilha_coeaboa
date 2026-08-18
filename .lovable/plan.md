# Plano de Refatoração e Otimização - AgendIlha (Coé a Boa?)

Este plano detalha as próximas etapas para consolidar o sistema, focando em robustez técnica, segurança e performance mobile-first.

## Etapa 1: Consolidação da Camada de Dados (Em Andamento)
- **Ações:**
  - Finalizar a migração de hooks legados para o padrão centralizado em `src/data/`.
  - Implementar lógica de paginação infinita padronizada para todas as listas (Atrativos, Usuários, Eventos).
  - Unificar o gerenciamento de estados de carregamento (Loading) e erro em um padrão visual consistente.
- **Técnico:** Uso extensivo de `useInfiniteQuery` e chaves de cache (`queryKeys`) estruturadas.

## Etapa 2: Refinamento de Segurança e Auditoria
- **Ações:**
  - Revisão completa das políticas RLS para garantir que o PII (Dados Pessoais) esteja acessível apenas via Security Invoker Views.
  - Implementar um log de auditoria no frontend para ações críticas de administradores (aprovações, edições de PIN).
  - Fortalecer a validação de tipos nos Edge Functions (Auth/PIN).
- **Técnico:** Migrações SQL para auditoria e triggers de sistema.

## Etapa 3: Performance Frontend e Imagens
- **Ações:**
  - Implementar otimização automática de flyers no upload (redimensionamento client-side).
  - Virtualização de listas no Painel Master e Explorar para suportar milhares de itens sem perda de FPS.
  - Implementar Skeleton Screens em substituição aos Spinners genéricos para melhorar o LCP percebido.
- **Técnico:** `react-window` ou `tanstack-virtual` e `canvas` para compressão de imagem.

## Etapa 4: UX Administrativa Mobile-First
- **Ações:**
  - Substituir diálogos densos por Bottom Sheets no mobile para ações rápidas.
  - Criar um Dashboard de Insights rápido para Master/Admin (KPIs com gráficos simples).
  - Melhorar o fluxo de "Aprovação Silenciosa" com feedback táctil (Haptic Feedback) via PWA.
- **Técnico:** `@vaul` (Drawer) para Shadcn e `lucide-react` para iconografia intuitiva.

## Etapa 5: Qualidade de Código e CI/CD
- **Ações:**
  - Remover códigos mortos e arquivos legados identificados na Fase 1.
  - Implementar testes de integração E2E para o fluxo crítico de submissão e aprovação.
  - Documentação das chaves de memória (`mem://`) para garantir consistência nas futuras iterações da IA.
- **Técnico:** Playwright para testes e `ts-morph` para análise de código morto.

---

## Detalhes Técnicos
- **Prioridade:** Estabilidade da Camada de Dados > Segurança > Performance > UX.
- **Voz:** Manter o tom "Insulano" em todas as mensagens de erro e feedbacks do sistema.

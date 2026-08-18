# Plano de Refatoração e Otimização do Sistema

Este plano visa melhorar a escalabilidade, performance e manutenibilidade do AgendIlha, focando na unificação de camadas de dados e otimização de renderização mobile-first.

## Etapa 1: Unificação da Camada de Dados e Cache (React Query)
- **Problema:** Múltiplos hooks (`useAgendaData`, `useSubmissions`) com lógicas de fetch duplicadas.
- **Ação:** Criar uma estrutura unificada de Queries e Mutations no diretório `src/data/` (ex: `events.ts`, `profiles.ts`).
- **Benefício:** Redução de requisições redundantes e estado consistente em todo o app.

## Etapa 2: Endurecimento de Segurança e RLS
- **Problema:** Políticas de RLS complexas podem causar gargalos ou vazamentos acidentais.
- **Ação:** Revisar e simplificar políticas, garantindo que `user_roles` seja a única fonte de verdade para permissões administrativas. Implementar auditoria automática para alterações em status de eventos.
- **Benefício:** Segurança robusta e performance em queries filtradas por permissão.

## Etapa 3: Tipagem Estrita e Manutenibilidade
- **Problema:** Uso excessivo de `any` em payloads de formulário e respostas do backend.
- **Ação:** Gerar tipos TypeScript atualizados a partir do banco e aplicá-los em `SubmissionForm.tsx` e helpers administrativos.
- **Benefício:** Detecção de bugs em tempo de compilação e melhor DX (Developer Experience).

## Etapa 4: Otimização de Performance Frontend
- **Problema:** Componentes grandes (ex: `AdminEvents.tsx`) causando lentidão no carregamento mobile.
- **Ação:** 
  - Aplicar `React.memo` em cards de lista.
  - Implementar virtualização para listas longas de eventos.
  - Otimizar o LCP das imagens dos flyers com carregamento prioritário.
- **Benefício:** Fluidez em dispositivos de entrada e menor consumo de dados.

## Etapa 5: Refatoração de UI/UX Mobile-First
- **Problema:** Algumas telas administrativas ainda são densas para visualização em celular.
- **Ação:** Transformar tabelas em layouts de cards expansíveis (já iniciado em algumas partes) e otimizar modais de ação para "bottom sheets" no mobile.
- **Benefício:** Melhor usabilidade para administradores em trânsito.

---

## Detalhes Técnicos
- **Stack:** React 18 + Vite + Shadcn UI + Supabase.
- **Monitoramento:** Utilizar `QueryCache` global para logging de erros e performance.
- **Testes:** Priorizar verificação de fluxos críticos (Auth/Submissão) via Playwright após as mudanças estruturais.

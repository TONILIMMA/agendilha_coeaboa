

## Análise atual

**Sistema de Aprovação (`SubmissionsPanel.tsx`)** — já implementa:
- 3 status com cores/ícones (✅ verde / ⏳ amarelo / ❌ vermelho)
- Textarea de observação aparece só em Pendente/Reprovado, oculta em Aprovado
- Botão "Salvar observação" para edição posterior em Pendentes
- Histórico via `event_audit_log` (componente `StatusHistory`)
- Validação obrigatória de motivo na reprovação

**Landing (`Landing.tsx`)** — já tem header glass com scroll, hamburger mobile, gradiente eco, cards de ecossistema com hover/scroll-reveal, CTA Agenda.

## Lacunas identificadas

1. **Botões de status no admin não diferenciam visualmente o status atual** de forma forte — o "Aprovar" usa apenas tom claro quando inativo. Falta um indicador "ativo/atual" mais óbvio.
2. **Observação em modo Pendente fica incompleta**: o usuário comum vê a observação só quando admin escreveu, mas o admin não vê visualmente o resumo do status atual com cor de fundo do card.
3. **Histórico mostra `user_id.slice(0,8)`** em vez do nome do moderador.
4. **Avatar do usuário no header da Landing** — `HeaderUserMenu` precisa ser verificado para garantir fallback de iniciais (item explícito do prompt).
5. **Microinterações** — botões da moderação podem ganhar fade-in/animação de feedback ao clicar.
6. **Landing Agenda CTA** — já existe o botão "Baixar PDF" mas leva para `/coeaboa`, não dispara export. Item do prompt: "feedback visual claro de sucesso/erro" no export.

## Plano de implementação

### 1. Refinar `SubmissionsPanel.tsx` — moderação mais clara
- Adicionar **borda lateral colorida** no card do envio conforme status (verde/âmbar/vermelho) para leitura imediata.
- Marcar visualmente o botão de status **ativo** com `ring-2` + `font-semibold` para destacar qual está aplicado agora.
- No bloco de moderação, exibir um pequeno cabeçalho "Status atual: ✅ Aprovado" com cor.
- Garantir transição suave (`transition-all duration-200`) nas trocas de status.

### 2. Histórico com nome do moderador (`StatusHistory`)
- Após buscar logs, fazer um segundo query em `collaborators` (e fallback `profiles`) para mapear `user_id → name`.
- Substituir `l.user_id.slice(0,8)` por `nome` quando disponível.

### 3. Verificar/garantir avatar com iniciais no `HeaderUserMenu`
- Ler o componente; se ainda não houver fallback de iniciais a partir de `responsible_name`/`email`, adicionar usando `<Avatar>` shadcn com `AvatarFallback`.

### 4. Landing — feedback no export PDF
- No botão "Baixar PDF" da seção Agenda CTA, em vez de só linkar para `/coeaboa`, manter o link mas garantir que na página `CoeABoa`/`AgendaCultural` o botão de export já mostra `toast.success`/`toast.error` (validar; caso falte, adicionar).

### 5. Microinterações sutis na Landing
- Adicionar `hover:scale-[1.02]` e `active:scale-[0.98]` nos botões CTA principais (já há shadow-elevated; reforçar transição).
- Garantir classe `animate-fade-in` em mensagens de toast já vem do Sonner.

## Detalhes técnicos

- **Arquivos a editar:**
  - `src/components/SubmissionsPanel.tsx` — borda lateral por status, destaque do botão ativo, header "Status atual".
  - `src/components/SubmissionsPanel.tsx` (sub-componente `StatusHistory`) — join com `collaborators` para nome do autor.
  - `src/components/HeaderUserMenu.tsx` — verificar/ajustar `AvatarFallback` com iniciais.
  - `src/pages/Landing.tsx` — micro-hover nos botões CTA.
  - `src/pages/CoeABoa.tsx` / `src/pages/AgendaCultural.tsx` — confirmar `toast` de sucesso no export PDF (apenas se ausente).

- **Banco de dados:** sem mudanças. O `event_audit_log` e o campo `rejection_reason` já cobrem histórico e observação.

- **Sem novas dependências.** Apenas Tailwind, lucide-react e shadcn já no projeto.

- **Permissões/RLS:** sem alterações; consulta de `collaborators` para mapear nomes já está coberta pela policy "Managers can view all collaborators" (admins). Para usuários comuns o histórico não é exibido (bloco de moderação só aparece para `isAdmin`).


# Gestão de destaques dos rolês

## O que muda para você

1. **Nova aba "Rolês em destaque"** dentro de Destaques (hoje a página só lista os pacotes). Nela a equipe vê, num só lugar: o rolê destacado, qual pacote foi contratado, quando começou, até quando vale, quantos dias faltam e o status — **Ativo**, **Expirado** ou **Escondido**. Dá para ativar um destaque escolhendo o pacote (o prazo é calculado automaticamente), estender, esconder da vitrine ou encerrar. Só Administrador e Master entram.
2. **Carrossel com até 10 rolês**, sempre começando pelos que têm destaque ativo e completando com os próximos rolês por data. Quando o prazo de um destaque vence, ele deixa de ser prioridade sozinho, sem ninguém precisar mexer. A home passa a usar a mesma regra de prioridade.
3. **Modal "Destaque sua publicação"**: mostra apenas pacotes que a equipe deixou ativos e, quando não houver nenhum, exibe um aviso claro de que os planos estão sendo ajustados, com o caminho para falar pelo WhatsApp — sem botão de contratação clicável nesse caso.

## Detalhes técnicos

**Banco (migração)** — hoje `submissions` só tem `is_highlight`; não há prazo nem pacote:
- Adicionar `highlight_package_id uuid references public.highlight_packages(id)`, `highlight_starts_at timestamptz`, `highlight_until timestamptz`, `highlight_hidden boolean not null default false`.
- Índice parcial em `(highlight_until)` para os destacados.
- Manter as políticas atuais de `submissions` (Admin/Master editam; leitura pública via `public_submissions`) e expor as novas colunas na view `public_submissions` — exceto nada sensível; só datas/flags.
- Status é derivado: escondido → `highlight_hidden`; ativo → `is_highlight` e (`highlight_until` nulo ou futuro); expirado → `highlight_until` no passado.

**Frontend**
- `src/data/useHighlights.ts`: hook para listar destaques (join com `highlight_packages`) e mutações ativar/estender/esconder/encerrar, invalidando as queries de agenda e carrossel.
- `src/pages/AdminDestaques.tsx`: virar duas abas (`Tabs`) — "Pacotes" (conteúdo atual) e "Rolês em destaque" (nova lista com badges de status, filtro por status e ações).
- `src/pages/Carrossel.tsx`: buscar aprovados, ordenar por destaque ativo (considerando `highlight_until` e `highlight_hidden`) e depois por data, limitando a 10; contador e export .zip seguem os 10.
- `src/pages/Landing.tsx`: substituir `order('is_highlight')` por ordenação equivalente que respeite prazo/escondido (coluna calculada na view ou ordenação client-side na primeira página).
- `src/components/destaque/DestaqueModal.tsx`: já filtra ativos; ajustar o estado vazio para não pré-selecionar pacote nem permitir contratar, e reforçar a mensagem.
- Helper compartilhado `highlightStatus(event)` em `src/lib/highlights.ts` + testes unitários dos três estados e do corte de 10 no carrossel.

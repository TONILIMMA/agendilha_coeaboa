

## Análise

**Já implementado:**
- Sistema de aprovação (Aprovado/Pendente/Reprovado) com cores, ícones, justificativa condicional, fluxo automático para Agenda Cultural, histórico — tudo concluído nas iterações anteriores.
- "Master" já existe como conceito virtual: o admin **mais antigo** (`useUserBadge.ts`) é tratado como Master com badge "Admin Master" + ícone Crown.
- Landing.tsx já tem header glass, hamburger mobile, gradiente, scroll reveal, microinterações e avatar com iniciais (`HeaderUserMenu`).

**Faltando:** a página exclusiva "Painel Master" com privilégios de gestão e ranking de divulgadores.

## Plano

### 1. Formalizar o papel "Master" no banco
- Adicionar valor `'master'` ao enum `app_role` (migration).
- Helper RPC `is_master(_user_id uuid)` (SECURITY DEFINER) que retorna true se o user tem role `master` **ou** é o admin mais antigo (fallback transitório). Usado pelas RLS futuras e UI.
- Atualizar `useUserBadge.ts` para usar `is_master` em vez do cálculo "oldest admin".

### 2. Nova página `/admin/master` — Painel Master
Arquivo `src/pages/AdminMaster.tsx`, rota protegida (redireciona se não Master).

Conteúdo:
- **Estatísticas no topo (cards glass):** total de usuários, total de admins, total de eventos aprovados.
- **Gestão de admins:** lista de todos os usuários com role admin/master. Ações:
  - Promover usuário a Admin
  - Promover Admin a Admin Master
  - Remover Admin / Remover Master (com salvaguarda: não pode remover a si mesmo nem deixar zero masters).
  - Reusa edge function `list-users` existente (sem mudanças) + insert/delete em `user_roles`.
- **Ranking de divulgadores:** filtros por período (semanal/mensal/anual/todos). Query agregada em `submissions` agrupando por `user_id` + status `approved`, ordenando por contagem. Join com `profiles` para nome. Mostra posição, nome, nº eventos aprovados, nº pendentes/reprovados como métrica secundária.

### 3. Integração no menu
- `HeaderUserMenu.tsx`: adicionar item "Painel Master" visível apenas quando `status === "master"`, apontando para `/admin/master`.
- `App.tsx`: registrar rota `/admin/master` protegida (e atrás do `AdminPinGate` por consistência com `/admin/users`).

### 4. RLS / Segurança
- Política de `user_roles`: permitir INSERT/DELETE de role `master` apenas para masters (via novo helper `is_master`).
- Manter políticas atuais de admin intactas — admins continuam podendo nomear admins, mas só Master nomeia/remove Master.

### 5. Estilo
- Cards do Painel Master em **glassmorphism** (`bg-white/60 backdrop-blur-md border border-white/40`) sobre gradiente verde→azul→cinza local (sem mudar tema global).
- Animações sutis (`animate-fade-in`, `hover:scale-[1.01]`).
- Ícone Crown reforçando identidade "Master".

## Detalhes técnicos
- **Migration:** `ALTER TYPE app_role ADD VALUE 'master'` + função `is_master`.
- **Sem novas dependências.**
- **Arquivos novos:** `src/pages/AdminMaster.tsx`.
- **Arquivos editados:** `src/App.tsx`, `src/components/HeaderUserMenu.tsx`, `src/hooks/useUserBadge.ts`.
- **Ranking:** consulta cliente em `submissions` filtrando `status='approved'` e `created_at` ≥ período; agrupamento feito em JS (volume baixo previsto).
- **Salvaguardas no UI:** botão de remover master desabilitado se restar apenas 1 master.


# Plano de Liberação de Edição de Atrativos

O objetivo é permitir que usuários com permissão de edição em estabelecimentos (como o Mauro Ilha) também possam editar cadastros de atrativos. O ajuste será feito tanto no nível do banco de dados (RLS) quanto na interface do usuário.

## Etapas Técnicas

### 1. Ajuste no Banco de Dados (RLS)
Garantir que as políticas de `UPDATE` e `DELETE` na tabela `atrativos` permitam o acesso não apenas a donos e administradores, mas também a colaboradores autorizados (seguindo o padrão da tabela `submissions`).

### 2. Ajuste na Interface (Frontend)
- Modificar o componente `AdminAtrativos.tsx` para permitir que usuários que não são "Super Admin" (mas que possuem permissões de colaborador ou são donos) vejam os botões de edição.
- Sincronizar a lógica de `canEdit` com a de estabelecimentos, permitindo flexibilidade para colaboradores ativos.

### 3. Validação
- Verificar se a mensagem "sem permissão" parou de aparecer ao salvar alterações.
- Confirmar se a lista de atrativos continua restrita a quem tem autorização.

## Detalhes de Implementação (Técnico)
- **RLS**: Adicionar verificação na tabela `atrativos` que consulta a tabela `collaborators` para ver se o `auth.uid()` atual tem `can_edit = true` ou se é um admin/master.
- **Frontend**: Ajustar a variável `canManage` e `isAdmin` no `AdminAtrativos.tsx` para incluir a verificação de `isCollaborator` ou `hasPermission('events.update')` quando necessário.

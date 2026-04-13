

## Diagnostico

O codigo do Header esta correto. As badges **Admin**, **Master** e **Colaborador** ja existem no codigo. O motivo de nao aparecerem e que o usuario logado atualmente (TONI, id `95c18d9a...`):

1. **Nao e admin** - a chamada `has_role` retorna `false`
2. **Nao e colaborador** - a consulta a tabela `collaborators` retorna `[]` (vazio)

Portanto, o usuario e um **usuario comum** e nenhuma badge aparece (comportamento correto do codigo).

## Plano

Para que a badge apareca, e preciso atribuir o papel correto a esse usuario no banco de dados:

1. **Opcao A - Tornar Admin**: Inserir uma linha na tabela `user_roles` com `user_id = '95c18d9a-6979-48c4-a72d-8b48967af5b9'` e `role = 'admin'`. A badge "Admin" (dourada) aparecera.

2. **Opcao B - Tornar Colaborador/Master**: Inserir uma linha na tabela `collaborators` com o `user_id` do TONI e as permissoes desejadas (ex: `can_approve = true` para badge "Master", ou `can_approve = false` para badge "Colaborador").

### Implementacao

Executar uma migration SQL para inserir o registro do TONI como admin:

```sql
INSERT INTO public.user_roles (user_id, role)
VALUES ('95c18d9a-6979-48c4-a72d-8b48967af5b9', 'admin')
ON CONFLICT (user_id, role) DO NOTHING;
```

Apos isso, ao recarregar a pagina, a badge "Admin" aparecera no Header.

### Detalhes tecnicos
- O `usePermissions` hook consulta `collaborators` para determinar `isCollaborator`/`canApprove`
- O `AuthContext` chama `has_role('admin')` via RPC para determinar `isAdmin`
- A logica condicional no Header ja renderiza as badges corretamente
- Nenhuma alteracao de codigo e necessaria - apenas dados no banco




# Tornar br.tonilima@gmail.com administrador

Dos logs de autenticação, o `user_id` desse e-mail é `74fbae7a-3a7b-4753-93d9-c732b0c14177`.

## Ação

Inserir um registro na tabela `user_roles`:

```sql
INSERT INTO public.user_roles (user_id, role)
VALUES ('74fbae7a-3a7b-4753-93d9-c732b0c14177', 'admin');
```

Isso dará acesso de administrador imediato — o usuário poderá ver e gerenciar todos os envios no painel "Envios".


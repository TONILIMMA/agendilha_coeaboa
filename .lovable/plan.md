

# Plano: Controle de Acesso por Papel (Usuário vs Admin)

## Situação Atual
- Os envios ficam salvos apenas no **localStorage** do navegador
- Não há autenticação de usuários nem banco de dados
- Qualquer pessoa vê todos os envios salvos no seu próprio navegador

## O que é necessário

Para separar os acessos, precisamos de **3 pilares**:

1. **Banco de dados** — salvar os envios em um servidor (não mais no navegador)
2. **Autenticação** — login com e-mail e senha para identificar quem enviou
3. **Controle de acesso** — regras que garantem que cada pessoa veja apenas o que deve

## Etapas do Plano

### 1. Ativar o Lovable Cloud (Supabase)
- Habilitar backend com banco de dados e autenticação integrados

### 2. Criar tabelas no banco de dados
- **submissions** — armazena todos os envios, com coluna `user_id` vinculada ao usuário
- **user_roles** — tabela separada para papéis (admin, user), seguindo boas práticas de segurança

### 3. Configurar segurança no banco (RLS)
- Usuários comuns: `SELECT` apenas onde `user_id = auth.uid()`
- Admins: `SELECT` em todos os registros (via função `has_role`)
- `INSERT`: qualquer usuário autenticado pode criar envios

### 4. Adicionar autenticação (Login/Cadastro)
- Página de login com e-mail e senha
- Redirecionar para o formulário após login
- Proteger o formulário para exigir login

### 5. Atualizar o formulário de envio
- Ao enviar, salvar no banco de dados (não mais no localStorage)
- Vincular automaticamente o `user_id` do usuário logado

### 6. Atualizar o painel "Envios"
- Buscar envios do banco de dados
- Usuário comum vê só os seus; admin vê todos
- Manter funcionalidades de WhatsApp, exportar CSV e remover

## Detalhes Técnicos

```text
┌─────────────┐     ┌──────────────┐     ┌─────────────┐
│   Frontend   │────▶│  Supabase    │────▶│  PostgreSQL  │
│  (React)     │     │  Auth + API  │     │  submissions │
└─────────────┘     └──────────────┘     │  user_roles  │
                                          └─────────────┘
```

**Tabela submissions:**
- id, user_id, company_name, responsible_name, email, phone, event_title, date, start_time, location, description, video_link, category, created_at

**Tabela user_roles:**
- id, user_id, role (enum: admin, user)

**RLS policies:**
- `SELECT submissions`: `user_id = auth.uid() OR has_role(auth.uid(), 'admin')`
- `INSERT submissions`: `auth.uid() IS NOT NULL` com `user_id = auth.uid()`
- `DELETE submissions`: `user_id = auth.uid() OR has_role(auth.uid(), 'admin')`

**Pré-requisito:** Ativar o Lovable Cloud antes de implementar.


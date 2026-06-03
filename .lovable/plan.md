## Funcionalidades de senha — visão geral

Vou cobrir 3 fluxos, todos integrados ao login por WhatsApp já existente:

1. **Usuário trocar a própria senha** (autoatendimento, autenticado)
2. **Usuário esqueceu a senha** (não-autenticado, recebe senha temporária via wa.me)
3. **Admin/Master resetar senha de outro usuário** (no painel, gera senha temporária e envia via wa.me)

Em todos os campos de senha (login, cadastro, troca, reset): botão **olhinho** para mostrar/ocultar enquanto digita.

---

### 1. Trocar a própria senha (autenticado)

- Nova seção **"Segurança"** na página de perfil/configurações do usuário.
- Campos: senha atual, nova senha, confirmar nova senha — todos com olhinho.
- Validação: mínimo 8 caracteres, mesmo medidor de força do cadastro (`PasswordStrengthMeter`).
- Reautentica com a senha atual antes de chamar `supabase.auth.updateUser({ password })`.
- Mensagens de erro tratadas (senha fraca, senha igual à atual, senha vazada — HIBP).

### 2. Esqueci a senha → senha temporária por WhatsApp

Substitui o fluxo OTP atual por **senha temporária** (mais simples para o público):

- Página `/forgot-password` simplificada: campo telefone → botão "Gerar senha temporária".
- Edge function nova `generate-temp-password`:
  - Recebe telefone, valida formato BR.
  - Confirma que o usuário existe (sem revelar caso negativo — mensagem genérica).
  - Gera senha temporária aleatória (10 caracteres, fácil de digitar: letras+números, sem ambíguos).
  - Atualiza a senha do usuário via service role e marca flag `must_change_password = true` no profile.
  - Retorna `{ tempPassword, whatsappUrl }` com link `wa.me` pronto contendo a mensagem.
- Tela mostra a senha gerada **uma única vez** + botão "Abrir WhatsApp" que abre o `wa.me` para o próprio número informado.
- No próximo login, se `must_change_password = true`, redireciona para tela "Defina sua nova senha" antes de liberar o app.

### 3. Admin/Master resetar senha de outros usuários

- Na página `AdminUsers`, dropdown de ações ganha item **"Resetar senha"**.
- Modal pede confirmação → chama edge function `admin-reset-password`:
  - Valida que caller é admin/master (via `is_admin_or_master`).
  - Bloqueia reset de master por não-master.
  - Gera senha temporária, atualiza, marca `must_change_password`.
  - Registra em `audit_logs`.
  - Retorna `{ tempPassword, whatsappUrl }` (pré-formatado para o telefone do usuário-alvo).
- Modal exibe a senha temporária com botão copiar + botão "Enviar pelo WhatsApp" (abre `wa.me` do usuário-alvo com mensagem pronta).
- Senha some ao fechar o modal; admin precisa copiar/enviar antes.

### 4. Componente reutilizável: input de senha com olhinho

- `<PasswordInput />` em `src/components/ui/` (wrap do Input com botão eye/eye-off).
- Substituir nos formulários: Login, Cadastro, ForgotPassword, ResetPassword, ChangePassword, AdminResetPassword.

---

## Detalhes técnicos

**Schema (migration):**
- Adicionar coluna `must_change_password BOOLEAN DEFAULT false` em `profiles`.
- Limpa `password_reset_codes` antigas (manter por compatibilidade do fluxo OTP existente, mas não usado nos novos fluxos).

**Edge functions novas:**
- `generate-temp-password` (public, `verify_jwt = false`) — fluxo "esqueci a senha".
- `admin-reset-password` (auth obrigatória, valida role) — fluxo admin.

**Mensagem WhatsApp padrão:**
```
🔐 *AgendIlha — Senha temporária*

Sua nova senha de acesso é: *<SENHA>*

Acesse: https://agendilha.lovable.app/auth
Por segurança, troque a senha logo após entrar.
```

**Frontend novo:**
- `src/components/ui/PasswordInput.tsx`
- `src/components/ChangePasswordSection.tsx` (na página de perfil)
- `src/pages/MustChangePassword.tsx` (gate após login com senha temporária)
- Atualizações em `Auth.tsx`, `ForgotPassword.tsx`, `AdminUsers.tsx`, `AuthContext.tsx` (checar flag).

**Segurança:**
- Senha temporária só é exibida uma vez na resposta da function; nunca persistida em texto claro.
- Rate-limit simples por telefone (1 reset a cada 60s) na function `generate-temp-password`.
- `must_change_password` força troca antes de qualquer outra ação no app.
- Audit log em todo reset feito por admin.

**Não inclui:** envio automático de mensagem WhatsApp (apenas link `wa.me` manual, conforme escolhido).

# Plano de Restrição e Edição de Atrativos

O objetivo é garantir que o campo **Atrativo** no formulário de eventos seja estritamente baseado em uma lista pré-cadastrada, removendo a possibilidade de criação direta no fluxo de cadastro de eventos e restringindo a edição após o envio apenas para administradores.

## Alterações Realizadas e Pendentes

### 1. Backend (Segurança)
- [x] **RLS na tabela `atrativos`**: Criada política `atrativos_admin_insert` que permite `INSERT` apenas para usuários com papel `admin` ou `master`.
- [x] **Remoção de política antiga**: Removida a política `atrativos_authorized_insert` que permitia qualquer usuário logado criar atrativos.

### 2. Componentes de Interface
- [x] **`AtrativoAutocomplete.tsx`**:
    - Adicionada prop `disabled` para bloquear o input.
    - Mantido o Autocomplete apenas como busca, sem aceitar valores livres (a validação do formulário já exige seleção vinculada).
- [x] **`AtrativoStep.tsx`**:
    - Implementada lógica `canEditAtrativo`:
        - Usuários comuns: podem selecionar apenas na criação (`isExistingEvent` é falso).
        - Admins/Masters: podem selecionar ou trocar em qualquer momento.
    - Desativada a função `onCreateNew` no Autocomplete (removido o botão de "Cadastrar novo atrativo" do fluxo).
    - Adicionadas mensagens de ajuda contextuais sobre as restrições de permissão.

### 3. Validação e Fluxo
- [ ] **`SubmissionForm.tsx`**: 
    - Garantir que o `atrativoSourceId` seja obrigatório e validado para evitar envios com nomes soltos que não existam no banco.
    - Ajustar os campos de detalhes do atrativo (contato, e-mail, categoria) para serem `readOnly` quando um atrativo está vinculado, permitindo edição apenas por administradores se necessário (conforme o requisito de "administradores podem editar o atrativo escolhido").

## Detalhes Técnicos

- **Controle de Acesso**: Utilização do hook `useAppPermissions` para identificar `isAdmin` e `isMaster`.
- **Estado do Evento**: Detecção de evento existente através da presença do campo `id` no formulário (geralmente injetado durante a edição).
- **Integridade**: A busca no Autocomplete agora é puramente informativa, forçando o usuário a escolher um item da lista para obter o `sourceId`.

---
*Nota: A criação de novos atrativos deverá ser feita em uma área administrativa separada (já existente em `/admin/atrativos`), mantendo o fluxo de eventos limpo e curado.*

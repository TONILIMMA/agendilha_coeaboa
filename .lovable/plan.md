# Melhorias no formulário, publicidade e eventos gratuitos

## Objetivo
Aprimorar a divulgação de eventos sem alterar o fluxo de aprovação existente: novos locais e atrativos entram como pré-cadastros pendentes, o formulário ganha uma conferência clara e a agenda passa a destacar publicidade e rolês gratuitos.

## Implementação

### 1. Corrigir e proteger a base
- Reproduzir o erro informado em `utils.ts` no fluxo completo de verificação de tipos e corrigir a origem real sem alterar a assinatura pública de `cn`.
- Adicionar testes focados nas regras novas, preservando as rotas, permissões e aprovações atuais.

### 2. Pré-cadastro de local e atrativo
- Ao digitar um item inexistente, oferecer a ação de pré-cadastro no próprio autocomplete.
- Abrir um modal curto, preenchido com o nome já digitado, para confirmar os dados mínimos.
- Gravar novos locais e atrativos como não aprovados e vinculá-los ao evento enviado.
- Mostrar claramente “Pendente de aprovação” no formulário e informar: “Novos itens serão analisados pela curadoria”.
- Manter itens pendentes fora das páginas públicas; a equipe continua aprovando pelos controles administrativos existentes.

### 3. Conferência e exigências legais
- Transformar o quadro atual em um painel lateral no desktop e bloco superior no celular.
- Usar três estados informativos: concluído, atenção e impedimento, com ícones ✔️ ⚠️ ❌.
- Manter o quadro somente para leitura, sem botões de edição.
- Adicionar legenda fixa logo abaixo do quadro.
- Destacar autorização do WhatsApp e aceite dos termos como exigências legais.
- Bloquear a publicação enquanto qualquer exigência obrigatória estiver incompleta.
- Exibir no final: “Seu evento e os novos cadastros serão analisados pela curadoria antes da publicação.”

### 4. Contatos vinculados
- Montar uma lista pré-selecionada com os contatos disponíveis do divulgador, atrativos e local vinculados.
- Preencher automaticamente os telefones já cadastrados, evitando nova digitação.
- Permitir alteração direta somente a Administrador, Master ou colaborador com permissão de edição; demais usuários apenas visualizam.
- Manter a autorização explícita do WhatsApp e a validação brasileira antes do envio.

### 5. Carrossel de publicidade
- Criar um componente reutilizável de publicidade rotativa para a curadoria e a agenda.
- Combinar anúncios publicados da vitrine com peças próprias configuradas pela equipe.
- Cada imagem abre um modal acessível com título, texto e link seguro; anúncios existentes apontam para seus detalhes.
- Reaproveitar a página de Anúncios já existente como destino, deixando o componente preparado para novas páginas promocionais.
- Preservar a faixa da Mercearia do Tio João como peça própria inicial.

### 6. Rolês gratuitos
- Identificar como gratuito apenas quando o valor estiver vazio/zero ou marcado como “gratuito”, “grátis”, “gratis” ou “free”.
- Exibir uma seção “Rolês gratuitos” abaixo da programação na Curadoria de Hoje e na Agenda Cultural.
- Ordenar por data e horário mais próximos.
- Mostrar cards simples com título, data, descrição e contato, reutilizando a abertura de detalhes e compartilhamento existentes.
- Não duplicar o evento dentro da própria seção e limitar a quantidade inicial para manter a leitura rápida.

## Dados e segurança
- Usar migração somente se for necessário guardar peças próprias de publicidade ou tornar explícito o estado pendente dos pré-cadastros.
- Qualquer nova tabela terá permissões explícitas, proteção por usuário e acesso administrativo validado no servidor.
- Validar textos, links e telefones no formulário e no banco; nenhum conteúdo digitado será renderizado como HTML.
- `user_roles` permanece a única fonte para Administrador/Master; permissões finas continuam em `collaborators`.

## Validação
- Testar pré-cadastro novo, seleção de item existente, bloqueios legais e edição de contatos por perfil.
- Testar carrossel, modal, links e fallback sem anúncios.
- Testar ordem e exibição dos gratuitos nas duas páginas.
- Conferir celular e desktop, além da navegação e aprovação atuais.

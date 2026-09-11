# Curadoria detalhada “Hoje na Ilha”

## Objetivo
Criar uma visão exclusiva, mobile-first, aberta somente pelo botão **“Ver o que tem hoje”**, mantendo intactos o restante da página inicial, agenda, filtros, rotas, dados e o logotipo oficial.

## Experiência escolhida
- Direção **Curadoria do dia modernista**, adaptada à identidade atual.
- Paleta preservada: areia editorial `#FAF8F5`, `#F0EBE3`, `#8B7355` e tinta `#261F1B` por meio dos tokens existentes.
- Tipografia preservada: **Outfit** nos títulos e **Figtree** nos textos.
- Estrutura de revista cultural, com leitura rápida no celular e expansão elegante no desktop.

## Implementação
1. **Entrada exclusiva**
   - Criar uma rota pública dedicada à curadoria do dia.
   - Alterar somente o destino do botão “Ver o que tem hoje” para essa nova visão.
   - Não modificar o comportamento das entradas atuais de Agenda, Eventos, categorias ou links diretos.

2. **Topo e identidade**
   - Reutilizar o cabeçalho existente para manter o logotipo oficial original e suas ações.
   - Exibir “Hoje na Ilha”, a data atual em português e uma introdução curta.

3. **Carrossel de destaques**
   - Usar eventos aprovados do dia, priorizando destaques ativos e mantendo o mesmo conteúdo real já disponível.
   - Mostrar imagem, título, horário, local e selo de destaque.
   - Adicionar navegação por setas, indicadores, rolagem por toque e abertura do detalhe atual do evento.
   - Se não houver destaque pago, preencher o carrossel com os eventos do dia sem deixar a área vazia.

4. **Filtros rápidos por data**
   - Criar pílulas para Hoje, Amanhã, Fim de semana e Próximos 7 dias.
   - Atualizar carrossel e grid na própria tela, sem modal e sem perder as ações dos cards.
   - Manter Hoje selecionado ao chegar pelo botão da página inicial.

5. **Publicidade da Mercearia do Tio João**
   - Inserir uma faixa editorial entre destaques e grid.
   - Usar o texto “Mercearia do Tio João” e o slogan “Qualidade de família para a sua mesa”.
   - Identificar discretamente como “Publicidade”, com tratamento visual distinto para não parecer um evento.
   - Não criar pop-up, redirecionamento automático ou nova regra de dados.

6. **Grid moderno de eventos**
   - Reaproveitar os cards e imagens reais, preservando abertura de detalhes, acessibilidade e estados de carregamento/erro/vazio.
   - Organizar em 2 colunas no celular e ampliar progressivamente no desktop.
   - Exibir categoria, título, horário e local com hierarquia compacta e legível.

## Detalhes técnicos
- Criar a página de curadoria e componentes focados para carrossel e faixa publicitária.
- Reutilizar a consulta pública existente de eventos aprovados, sem alterar banco, permissões ou regras de negócio.
- Registrar a nova rota na configuração central e no roteador; somente o CTA da página inicial apontará para ela.
- Usar componentes de botão existentes, tokens semânticos e animações discretas com suporte a `prefers-reduced-motion`.
- Não substituir imagens enviadas, o logo, a paleta global ou o comportamento das páginas atuais.

## Validação
- Conferir o fluxo completo: página inicial → “Ver o que tem hoje” → filtros → detalhe do evento.
- Testar estados com e sem eventos/destaques e falha de carregamento.
- Verificar visualmente celular e desktop, incluindo carrossel por toque, textos sem cortes e ausência de sobreposições.
- Executar os testes relacionados às rotas e à listagem de eventos.

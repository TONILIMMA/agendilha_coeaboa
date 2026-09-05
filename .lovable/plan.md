# Auditoria completa — AgendIlha / Coé a Boa?

Auditoria em 5 frentes, entregando um relatório com severidade e recomendação para cada problema, e corrigindo os itens confirmados de severidade crítica e média.

## O que já foi verificado agora

- Compilação: sem erros.
- Testes automatizados: 77 passam, 1 falha (o aviso de novidades quebra no teste por falta do contexto de navegação).
- Segurança do banco: 5 alertas ativos, sendo 2 críticos — contatos pessoais de atrativos (telefone/e-mail) visíveis para qualquer visitante, e uma consulta interna com permissões elevadas demais.
- Sinais de código: 41 pontos sem tipagem definida, 16 consultas puxando todas as colunas (mais dados que o necessário), telas grandes concentrando muita lógica (gerenciamento de eventos e formulário de divulgação passam de 800 linhas).

## Etapas da auditoria

### 1. Relatório e correções de segurança (crítico)
- Fechar a exposição pública de telefone e e-mail dos responsáveis por atrativos, criando uma visão pública sem esses campos (mesmo padrão já usado em outras áreas).
- Revisar a consulta interna com permissão elevada e reduzi-la ao mínimo necessário.
- Avaliar os 3 alertas de nível médio (identidade de quem avalia, contatos de atrativos ligados a eventos, funções sem caminho de busca fixo) e corrigir ou justificar cada um.

### 2. Estabilidade dos testes e das telas (médio)
- Corrigir o teste do aviso de novidades envolvendo-o no contexto de navegação.
- Percorrer no navegador os fluxos principais: cadastro de usuário, divulgação de evento (etapas 1 e 2), envio e troca de flyer, aprovação no painel administrativo, cadastro de atrativo e estabelecimento. Registrar cada falha com passos de reprodução.

### 3. Usabilidade e responsividade (médio/baixo)
- Testar em telas de celular e desktop: campos obrigatórios, mensagens de erro, textos truncados, botões pequenos demais, estados vazios e de carregamento.
- Conferir se toda mensagem de erro diz o próximo passo, no tom do app.

### 4. Qualidade de código (médio/baixo)
- Mapear duplicações (validação de telefone, formatação de datas, buscas repetidas) e propor um único ponto de verdade.
- Trocar consultas que puxam todas as colunas por listas explícitas nas telas mais pesadas.
- Reduzir pontos sem tipagem nos arquivos de formulário e painel.
- Remover registros de depuração que sobraram.

### 5. Performance e estabilidade (baixo)
- Medir o tempo de carregamento das telas principais e o tamanho dos pacotes carregados.
- Verificar vazamentos: assinaturas em tempo real e timers sem limpeza; buscas em loop.
- Conferir imagens sem carregamento tardio e listas longas sem paginação.

## Entrega

Um documento de relatório com: problema, onde acontece, severidade (crítico / médio / baixo), impacto para o usuário e recomendação. Os itens críticos e médios confirmados são corrigidos nesta mesma execução; os de baixa severidade ficam listados como melhorias sugeridas.

## Detalhes técnicos

- Correções de banco via migração: view pública `atrativos_public` (sem `responsavel_telefone`, `responsavel_email`, `contact_info`, `contact_whatsapp`), ajuste da policy `atrativos_select_v2` para `anon`, revisão da view SECURITY DEFINER e `SET search_path` nas funções sinalizadas.
- Testes: wrapper `MemoryRouter` em `UpdateAnnouncement.test.tsx`; novos testes para os fluxos que apresentarem regressão.
- Verificação funcional via Playwright autenticado em `/enviar-evento`, `/admin/events`, `/cadastro/*`.
- Relatório salvo como documento em `/mnt/documents/auditoria-agendilha.md`.

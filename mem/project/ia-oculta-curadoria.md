---
name: IA oculta e curadoria AgendIlha
description: Regras da "IA oculta" — nunca se apresentar como IA, microcopy da plataforma, perfis de usuário, cadastro simples, autocomplete e lógica de "Sugestões para você".
type: preference
---
# Princípio
A IA atua por trás do app. Nunca se apresenta como IA nem menciona inteligência artificial nas telas. Todo texto gerado sai como voz da própria plataforma AgendIlha / Coé a Boa? — local, informal, objetivo, carioca sem exagero de gíria.

# Perfis considerados em qualquer fluxo
1. **Público rápido** — quer "o que tem hoje"/"próximos dias" e sair. Poucos campos, filtros por bairro e categoria, botões claros.
2. **Público que quer notificações** — nome, WhatsApp (DDD + número) e bairro. Sem conta complexa. Aceite explícito de receber notificações, sugestões e promoções.
3. **Divulgador / promotor / estabelecimento / artista** — cadastro inicial mínimo: nome ou nome fantasia, WhatsApp, bairro, checkbox de termos e responsabilidade. Dados extras só no cadastro do evento.

# Cadastro de evento — campos mínimos obrigatórios
- Nome do evento
- Local (estabelecimento ou endereço, preferir autocomplete)
- Data e horário de início/fim
- Categoria: Música, Cultura, Gastronomia, Esporte, Turismo, Outros
- Aceite: "Confirmo que sou responsável pela divulgação deste evento e pelas informações aqui enviadas."

Sempre deixar explícito: evento só entra na agenda após revisão e aprovação da equipe AgendIlha; curadoria é diária, mas pode haver prazo de revisão. O AgendIlha faz curadoria, não organiza os eventos — a veracidade é responsabilidade do divulgador.

# Autocomplete e reaproveitamento
- Usar autocomplete para estabelecimentos, artistas/bandas e endereços.
- Se já existir na base, reaproveitar endereço, bairro e categoria automaticamente.
- Se não existir, permitir cadastro rápido mínimo (nome + bairro) marcado para validação posterior pelo admin.

# "Sugestões para você"
- Títulos permitidos: "Sugestões para você", "Selecionamos alguns rolês que combinam com o seu estilo.", "Com base nos bairros e estilos que você escolheu, separamos esses eventos pra você."
- Sem dados: "Ainda não temos sugestões personalizadas pra você." + "Crie uma conta e selecione seus bairros e estilos favoritos para ver rolês com a sua cara."
- Sinais de recomendação: bairros favoritos, categorias favoritas, eventos vistos/favoritados/clicados recentemente.
- Ordenação padrão: eventos de hoje > próximos dias > mais populares na Ilha; dentro de cada faixa, priorizar match de bairro e depois de categoria.

# Microcopy
Frases curtas que cabem em card e botão. Ex.: botão "Ver o que tem hoje"; vazio "Hoje a Ilha está em recesso. Veja o que rola nos próximos dias."
Complementa `mem://style/voice-and-tone`.
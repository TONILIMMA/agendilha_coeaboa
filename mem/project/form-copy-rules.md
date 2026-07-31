---
name: Regras de cadastro e microcopy dos formulários
description: Padrão de formulários em 2 camadas (cadastro simples + complemento no evento), rótulos curtos, placeholders e mensagens de erro na voz do AgendIlha
type: preference
---

## Princípios
- Usuário é apressado: poucos campos, rótulos curtos, sem jargão.
- O app precisa se resguardar: todo fluxo termina com aceite de responsabilidade.
- Nunca mencionar IA, nunca escrever em 1ª pessoa ("eu"). O texto é o AgendIlha falando com o usuário.

## Cadastro em duas camadas
1. **Cadastro inicial simples**: nome, WhatsApp, bairro, aceite.
2. **Complemento ao cadastrar evento**: dados do evento + aceite de responsabilidade.

## Divulgador/Promotor (camada 1)
| Campo | Tipo | Obrigatório | Rótulo | Placeholder |
|---|---|---|---|---|
| nome | texto | sim | Seu nome | Nome ou nome fantasia |
| whatsapp | tel | sim | WhatsApp (DDD + número) | (21) 99999-0000 |
| bairro | select/texto | sim | Seu bairro | Onde você mora ou trabalha |
| aceite | checkbox | sim | Li e concordo com os termos de uso e responsabilidade pela divulgação dos eventos. | — |

## Evento (camada 2)
| Campo | Tipo | Obrigatório | Rótulo | Placeholder/Ajuda |
|---|---|---|---|---|
| nome | texto | sim | Nome do evento | Como o povo vai reconhecer o rolê |
| local | autocomplete | sim | Onde vai ser | Comece a digitar o nome do lugar |
| data | data | sim | Dia | dd/mm/aaaa |
| horario | hora | sim | Começa que horas | 20:00 |
| categoria | select | sim | Categoria | Música, Cultura, Gastronomia, Esporte, Turismo, Outros |
| aceite | checkbox | sim | Confirmo que sou responsável pela divulgação deste evento e pelas informações aqui enviadas. | — |

## Mensagens de erro (padrão)
- Nome: "Coloca seu nome pra galera saber quem tá divulgando."
- WhatsApp: "Preencha seu WhatsApp para a gente conseguir falar com você."
- WhatsApp inválido: "Esse número não parece certo. Confere o DDD e os 9 dígitos."
- Bairro: "Escolhe seu bairro pra gente saber sua área."
- Local: "Diz onde vai ser o rolê."
- Data: "Falta a data do evento."
- Horário: "Falta o horário de início."
- Categoria: "Escolhe uma categoria pro evento aparecer nas buscas certas."
- Aceite: "Marque o aceite para continuar."

## Estilo das mensagens
- Frase curta, direta, sempre indicando o próximo passo.
- Sem "erro", "inválido", "campo obrigatório" sozinhos.

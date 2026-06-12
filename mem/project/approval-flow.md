---
name: Fluxo de aprovação de eventos
description: Regra crítica — todo evento exige aprovação de admin antes de ir ao público
type: feature
---
Status do evento (CHECK no banco): `pendente | aprovado | rejeitado`. Default = `pendente`.

- Toda submissão (público, divulgador, artista) entra como `pendente`.
- Apenas `aprovado` aparece publicamente (AgendaCultural, CoeABoa, Landing, AdminAgendaInforma).
- `pendente` e `rejeitado` nunca são listados ao público.
- Aprovação grava `approved_at` + `approved_by` (e zera campos de rejeição).
- Rejeição grava `rejected_at` + `rejected_by` e aceita `admin_notes` (observação interna, motivo).
- Não existe mais "publicado", "divulgado", "cancelado", "em_revisao", "rascunho" — proibido reintroduzir.
- A publicação NUNCA é automática. Sempre requer ação de admin/master no painel `/admin/events`.
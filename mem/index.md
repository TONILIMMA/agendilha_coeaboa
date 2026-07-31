# Project Memory

## Core
Community portal for local events (AgendIlha / Coé a Boa?).
Supabase backend, PWA enabled. Mobile-first Shadcn UI.
Auth: WhatsApp number mapped to @phone.agendilha.app, OTP verified.
Role hierarchy: Admin, Master, Colaborador.
BR WhatsApp Regex: `^\(?\d{2}\)?\s?9?\d{4}-?\d{4}$`
Cadastro tem 3 perfis SEPARADOS (público/divulgador/artista): jornadas, wizards e tabelas próprias. Nunca unificar.
Roles: `user_roles` (enum app_role: admin/master/user) é a ÚNICA fonte da verdade. Tabelas `app_user_roles`/`app_roles`/`app_permissions` estão depreciadas — não criar novos usos.
Permissões finas de colaboradores ficam em `collaborators` (can_submit/approve/edit/delete) + função `has_permission`.
Voz: insulano gente boa — próximo, descontraído, confiável. Frases curtas, sem formalismo, sem jargão técnico no UI. Usar "rolê", "programa", "o que tá rolando". Erros e estados vazios sempre dizem o próximo passo.
IA é oculta: nunca se apresentar como IA no UI; todo texto sai como voz do AgendIlha. Recomendações = "Sugestões para você".
Evento só aparece na agenda após revisão/aprovação da equipe; AgendIlha cura, não organiza — veracidade é do divulgador.

## Memories
- [Auth method](mem://auth/method) — Phone-based WhatsApp auth mapped to placeholder emails
- [Permissions](mem://auth/permissions) — Supabase RLS and multi-tier role hierarchy
- [Validation rules](mem://constraints/validation-rules) — Regex constraint for Brazilian WhatsApp numbers
- [Admin dashboard](mem://features/admin-dashboard) — User management and event submission tracking
- [Audit log](mem://features/audit-log) — Tracking administrative changes on events
- [Event form](mem://features/event-form) — Form fields, ViaCEP integration, calendar constraints
- [Event metadata](mem://features/event-metadata) — Sales, costs, commissions, and lifecycle tracking
- [Public portals](mem://features/public-portal) — Layouts for Coé a Boa and Agenda Cultural
- [Sharing & Export](mem://features/sharing-and-export) — WhatsApp templates and PDF export with logo
- [Event policies](mem://project/policies) — Approval workflow and 30-day trash retention
- [Profile separation](mem://project/profile-separation) — 3 perfis (público/divulgador/artista) com tabelas e wizards próprios
- [IA oculta e curadoria](mem://project/ia-oculta-curadoria) — Perfis de usuário, campos mínimos de evento, autocomplete, regras de "Sugestões para você"
- [Design direction](mem://style/design-direction) — Header layout, badges, navigation
- [Voice and tone](mem://style/voice-and-tone) — Microcopy, descrições de evento/lugar, erros, modais de atualização
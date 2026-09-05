# Anúncios de venda no Coé a Boa?

Nova área de anúncios (produtos, serviços, espaços) separada dos rolês, com planos de destaque configurados pela equipe e convite de destaque após o envio.

## Como vai funcionar

**Para quem anuncia (divulgadores)**
- Atalho "Anúncios" no menu, visível para divulgadores, Administradores e Master.
- Formulário curto em uma página: título, descrição, categoria, preço, fotos (até 5), bairro/cidade e WhatsApp de contato.
- O anúncio entra como "aguardando análise" e só aparece publicamente depois da liberação da equipe.
- Lista "Meus anúncios" com status (em análise, publicado, recusado) e opção de editar enquanto não está publicado.

**Vitrine pública**
- Página de anúncios publicados com busca, filtro por categoria e carrossel com até 10 anúncios em destaque no topo.
- Cada anúncio abre com fotos, descrição e botão para falar com o anunciante no WhatsApp.

**Modal de destaque (após enviar o anúncio)**
- Título: "Destaque sua publicação para maior visibilidade".
- Texto: "Contrate um destaque e seu anúncio ficará em evidência no carrossel de até 10 destaques, aumentando alcance e vendas."
- Mostra os planos ativos com nome, benefícios, valor e prazo exatamente como a equipe configurou.
- Botão de contratação abre a conversa no WhatsApp com a equipe já com o plano escolhido escrito na mensagem.
- Aparece uma vez por anúncio; o botão "Destacar anúncio" continua disponível na página do anúncio.

**Para a equipe (só Administrador e Master)**
- Tela "Planos de anúncio": criar, editar, ativar/desativar e ordenar planos (ex.: Básico, Intermediário, Premium) com nome, descrição, lista de benefícios, valor e duração em dias.
- Tela "Anúncios (gestão)": aprovar, recusar com motivo, marcar/retirar destaque e definir até quando o destaque vale.
- Quem não é Administrador ou Master não vê essas telas nem consegue alterar valores e prazos.

## Detalhes técnicos

Banco (uma migração):
- `public.ad_plans`: `name`, `description`, `benefits` (text[]), `price_cents`, `duration_days`, `is_active`, `display_order`, `updated_by`, timestamps. Leitura pública apenas de planos ativos; criar/editar/remover somente via `is_admin_or_master(auth.uid())`. Semente com Básico, Intermediário e Premium.
- `public.ads`: `user_id`, `title`, `description`, `category`, `price_cents`, `contact_whatsapp`, `city`, `neighborhood`, `photos` (text[]), `status` ('pendente'|'publicado'|'recusado'), `rejection_reason`, `is_highlight`, `highlight_plan_id`, `highlight_until`, `views_count`, timestamps. Inserção por quem tem perfil de divulgador (ou admin), edição pelo dono enquanto pendente, moderação e destaque só por admin/master, leitura pública somente de publicados.
- GRANTs explícitos para `anon` (só leitura), `authenticated` e `service_role`; trigger `update_updated_at_column`; trigger que impede o dono de alterar `status`/`is_highlight`.
- Bucket de imagens `ad-photos` (público para leitura, escrita restrita ao dono da pasta), no padrão de `artist-media`.

Frontend:
- `src/data/useAdPlans.ts` e `src/data/useAds.ts` (React Query) para planos, meus anúncios, vitrine e mutações.
- Páginas: `src/pages/anuncios/Anuncios.tsx` (vitrine), `AnuncioDetalhe.tsx`, `NovoAnuncio.tsx`, `MeusAnuncios.tsx`, `src/pages/AdminAdPlans.tsx`, `src/pages/AdminAds.tsx`.
- Componente `src/components/anuncios/DestaqueAnuncioModal.tsx`, reutilizando o padrão de `DestaqueModal` e `buildWhatsappUrl`.
- Rotas em `src/routes/config.ts` + `src/App.tsx` (lazy) e itens em `src/components/layout/sidebarItems.ts` com `roles` de divulgador e admin/master.
- Guard de admin nas telas de gestão via `useAppPermissions().isAdmin`, como em `AdminDestaques.tsx`.

Observações:
- O número de WhatsApp da equipe para contratação será lido dos dados de contato já usados no app; se não houver um definido, precisarei que você informe o número.
- Nada dos rolês existentes muda: os planos de destaque de eventos (`highlight_packages`) continuam como estão.

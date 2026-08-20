-- Migration to make event_title nullable in submissions table
ALTER TABLE public.submissions ALTER COLUMN event_title DROP NOT NULL;
ALTER TABLE public.submissions ALTER COLUMN event_title SET DEFAULT NULL;

-- Ensure public_submissions view (if it exists) reflects this, though views usually follow base table nullability
-- If there are other tables/views that depend on event_title being non-null, they should be adjusted.
-- 1. Remove a política que permite qualquer usuário inserir atrativos
DROP POLICY IF EXISTS "atrativos_authorized_insert" ON public.atrativos;

-- 2. Cria nova política: Apenas Admin/Master pode inserir novos atrativos
CREATE POLICY "atrativos_admin_insert" 
ON public.atrativos 
FOR INSERT 
TO authenticated 
WITH CHECK (public.is_admin_or_master(auth.uid()));

-- 3. Ajusta a política de update dos atrativos (caso exista necessidade de restringir mais, 
-- mas por enquanto mantemos que o responsável ou admin pode editar o atrativo em si).
-- O requisito foca no VÍNCULO dentro do evento.

-- 4. Ajusta permissões na tabela de submissions para garantir que a edição do atrativo
-- seja restrita a admins após a criação.
-- Atualmente 'submissions_update_owner_admin_collab' permite que o dono edite.
-- Precisamos garantir que no frontend essa edição seja bloqueada para usuários comuns.

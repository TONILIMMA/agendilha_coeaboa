ALTER TABLE public.submissions DROP CONSTRAINT IF EXISTS submissions_status_check;
ALTER TABLE public.submissions ADD CONSTRAINT submissions_status_check
  CHECK (status = ANY (ARRAY['pendente','aprovado','rejeitado','publicado','divulgado','cancelado']));

ALTER TABLE public.profiles DISABLE TRIGGER USER;
UPDATE public.profiles
   SET user_type = CASE
     WHEN lower(coalesce(user_type,'')) IN ('promoter','promotor','divulgador') THEN 'divulgador'
     WHEN lower(coalesce(user_type,'')) IN ('artist','artista','banda','musico') THEN 'artista'
     ELSE 'publico'
   END
 WHERE lower(coalesce(user_type,'')) NOT IN ('publico','divulgador','artista');
ALTER TABLE public.profiles ENABLE TRIGGER USER;

ALTER TABLE public.profiles ALTER COLUMN user_type SET DEFAULT 'publico';

CREATE OR REPLACE FUNCTION public.can_create_events(_user_id uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT _user_id IS NOT NULL
     AND (
       public.is_admin_or_master(_user_id)
       OR EXISTS (
         SELECT 1 FROM public.profiles p
          WHERE p.user_id = _user_id
            AND lower(coalesce(p.user_type, '')) IN ('divulgador', 'promotor')
       )
       OR EXISTS (
         SELECT 1 FROM public.collaborators c
          WHERE c.user_id = _user_id
            AND c.is_active = true
            AND c.can_submit = true
       )
     );
$function$;
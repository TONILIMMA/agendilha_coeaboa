UPDATE public.profiles p
SET user_type = 'usuario', updated_at = now()
WHERE p.user_type IN ('divulgador', 'promotor')
  AND EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = p.user_id AND ur.role IN ('admin', 'master')
  );
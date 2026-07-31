UPDATE public.profiles SET user_type = 'divulgador' WHERE lower(user_type) = 'promotor';
UPDATE public.promotor_profiles SET tipo_promotor = 'divulgador' WHERE lower(tipo_promotor) = 'promotor';
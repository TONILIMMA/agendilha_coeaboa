ALTER TABLE public.profiles DISABLE TRIGGER trg_prevent_user_type_self_escalation;
UPDATE public.profiles SET user_type = 'divulgador' WHERE user_type IN ('promoter','promotor');
ALTER TABLE public.profiles ENABLE TRIGGER trg_prevent_user_type_self_escalation;
UPDATE public.promotor_profiles SET tipo_promotor = 'divulgador' WHERE tipo_promotor IN ('promoter','promotor');
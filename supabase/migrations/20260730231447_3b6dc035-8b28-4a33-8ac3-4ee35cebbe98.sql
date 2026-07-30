UPDATE public.admin_configs
SET pin_hash = crypt('0000', gen_salt('bf')),
    requires_change = true,
    last_changed_at = now(),
    updated_at = now()
WHERE user_id = '44c5515f-e338-405a-b4bb-e76e2549cf53';

DELETE FROM public.admin_pin_attempts WHERE user_id = '44c5515f-e338-405a-b4bb-e76e2549cf53';
DELETE FROM public.admin_pin_sessions WHERE user_id = '44c5515f-e338-405a-b4bb-e76e2549cf53';
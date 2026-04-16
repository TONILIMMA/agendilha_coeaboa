
CREATE TABLE public.password_reset_codes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  phone TEXT NOT NULL,
  code_hash TEXT NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  attempts INTEGER NOT NULL DEFAULT 0,
  used BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.password_reset_codes ENABLE ROW LEVEL SECURITY;

-- No RLS policies = no client access. Only SECURITY DEFINER functions can access.

-- Index for quick lookup by phone
CREATE INDEX idx_password_reset_codes_phone ON public.password_reset_codes (phone, used, expires_at);

-- Cleanup function to delete expired codes
CREATE OR REPLACE FUNCTION public.cleanup_expired_reset_codes()
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  DELETE FROM public.password_reset_codes
  WHERE expires_at < now() OR used = true;
$$;


CREATE TABLE public.promotor_profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  promotor_nome TEXT NOT NULL,
  promotor_whatsapp TEXT,
  tipo_promotor TEXT CHECK (tipo_promotor IN ('artista','produtor','estabelecimento','outro')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.promotor_profiles TO authenticated;
GRANT ALL ON public.promotor_profiles TO service_role;

ALTER TABLE public.promotor_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owner can view own promotor profile"
  ON public.promotor_profiles FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.is_admin_or_master(auth.uid()));

CREATE POLICY "Owner can insert own promotor profile"
  ON public.promotor_profiles FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id OR public.is_admin_or_master(auth.uid()));

CREATE POLICY "Owner or admin can update promotor profile"
  ON public.promotor_profiles FOR UPDATE TO authenticated
  USING (auth.uid() = user_id OR public.is_admin_or_master(auth.uid()))
  WITH CHECK (auth.uid() = user_id OR public.is_admin_or_master(auth.uid()));

CREATE POLICY "Admin can delete promotor profile"
  ON public.promotor_profiles FOR DELETE TO authenticated
  USING (public.is_admin_or_master(auth.uid()));

CREATE TRIGGER promotor_profiles_set_updated_at
  BEFORE UPDATE ON public.promotor_profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

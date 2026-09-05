CREATE TABLE public.highlight_packages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  price_cents integer NOT NULL DEFAULT 0 CHECK (price_cents >= 0),
  duration_days integer NOT NULL DEFAULT 7 CHECK (duration_days > 0),
  is_active boolean NOT NULL DEFAULT true,
  display_order integer NOT NULL DEFAULT 0,
  updated_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.highlight_packages TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.highlight_packages TO authenticated;
GRANT ALL ON public.highlight_packages TO service_role;

ALTER TABLE public.highlight_packages ENABLE ROW LEVEL SECURITY;

CREATE POLICY highlight_packages_select_active ON public.highlight_packages
  FOR SELECT TO anon, authenticated
  USING (is_active = true OR public.is_admin_or_master(auth.uid()));

CREATE POLICY highlight_packages_admin_insert ON public.highlight_packages
  FOR INSERT TO authenticated
  WITH CHECK (public.is_admin_or_master(auth.uid()));

CREATE POLICY highlight_packages_admin_update ON public.highlight_packages
  FOR UPDATE TO authenticated
  USING (public.is_admin_or_master(auth.uid()))
  WITH CHECK (public.is_admin_or_master(auth.uid()));

CREATE POLICY highlight_packages_admin_delete ON public.highlight_packages
  FOR DELETE TO authenticated
  USING (public.is_admin_or_master(auth.uid()));

CREATE TRIGGER highlight_packages_updated_at
  BEFORE UPDATE ON public.highlight_packages
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.highlight_packages (name, description, price_cents, duration_days, display_order)
VALUES
  ('Destaque Simples', 'Seu flyer entra no carrossel de até 10 eventos e ganha selo especial na agenda.', 3000, 7, 1),
  ('Destaque Plus', 'Topo do carrossel, chamada nos stories e no canal oficial por mais tempo.', 6000, 15, 2);
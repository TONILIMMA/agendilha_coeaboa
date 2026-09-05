-- ===== Planos de anúncio =====
CREATE TABLE public.ad_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  benefits text[] NOT NULL DEFAULT '{}',
  price_cents integer NOT NULL DEFAULT 0 CHECK (price_cents >= 0),
  duration_days integer NOT NULL DEFAULT 7 CHECK (duration_days > 0),
  is_active boolean NOT NULL DEFAULT true,
  display_order integer NOT NULL DEFAULT 0,
  updated_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.ad_plans TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ad_plans TO authenticated;
GRANT ALL ON public.ad_plans TO service_role;

ALTER TABLE public.ad_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY ad_plans_select_active ON public.ad_plans
  FOR SELECT TO anon, authenticated
  USING (is_active = true OR public.is_admin_or_master(auth.uid()));

CREATE POLICY ad_plans_admin_insert ON public.ad_plans
  FOR INSERT TO authenticated
  WITH CHECK (public.is_admin_or_master(auth.uid()));

CREATE POLICY ad_plans_admin_update ON public.ad_plans
  FOR UPDATE TO authenticated
  USING (public.is_admin_or_master(auth.uid()))
  WITH CHECK (public.is_admin_or_master(auth.uid()));

CREATE POLICY ad_plans_admin_delete ON public.ad_plans
  FOR DELETE TO authenticated
  USING (public.is_admin_or_master(auth.uid()));

CREATE TRIGGER ad_plans_updated_at
  BEFORE UPDATE ON public.ad_plans
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ===== Anúncios =====
CREATE TABLE public.ads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  title text NOT NULL,
  description text NOT NULL,
  category text NOT NULL,
  price_cents integer CHECK (price_cents IS NULL OR price_cents >= 0),
  contact_whatsapp text NOT NULL,
  city text,
  neighborhood text,
  photos text[] NOT NULL DEFAULT '{}',
  status text NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente','publicado','recusado')),
  rejection_reason text,
  is_highlight boolean NOT NULL DEFAULT false,
  highlight_plan_id uuid REFERENCES public.ad_plans(id) ON DELETE SET NULL,
  highlight_until timestamptz,
  views_count integer NOT NULL DEFAULT 0,
  published_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX ads_status_created_idx ON public.ads (status, created_at DESC);
CREATE INDEX ads_user_idx ON public.ads (user_id);

GRANT SELECT ON public.ads TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ads TO authenticated;
GRANT ALL ON public.ads TO service_role;

ALTER TABLE public.ads ENABLE ROW LEVEL SECURITY;

-- Visitantes e usuários veem anúncios publicados
CREATE POLICY ads_select_published ON public.ads
  FOR SELECT TO anon, authenticated
  USING (status = 'publicado');

-- Autor vê os próprios anúncios em qualquer situação
CREATE POLICY ads_select_own ON public.ads
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- Equipe vê tudo
CREATE POLICY ads_select_admin ON public.ads
  FOR SELECT TO authenticated
  USING (public.is_admin_or_master(auth.uid()));

-- Divulgadores e equipe podem enviar
CREATE POLICY ads_insert_promotor ON public.ads
  FOR INSERT TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    AND (public.is_promotor(auth.uid()) OR public.is_admin_or_master(auth.uid()))
  );

-- Autor edita enquanto está em análise ou recusado
CREATE POLICY ads_update_own ON public.ads
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid() AND status IN ('pendente','recusado'))
  WITH CHECK (user_id = auth.uid());

CREATE POLICY ads_update_admin ON public.ads
  FOR UPDATE TO authenticated
  USING (public.is_admin_or_master(auth.uid()))
  WITH CHECK (public.is_admin_or_master(auth.uid()));

CREATE POLICY ads_delete_own ON public.ads
  FOR DELETE TO authenticated
  USING (user_id = auth.uid() AND status <> 'publicado');

CREATE POLICY ads_delete_admin ON public.ads
  FOR DELETE TO authenticated
  USING (public.is_admin_or_master(auth.uid()));

CREATE TRIGGER ads_updated_at
  BEFORE UPDATE ON public.ads
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Impede que o autor mude situação/destaque por conta própria
CREATE OR REPLACE FUNCTION public.ads_guard_moderation_fields()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF public.is_admin_or_master(auth.uid()) THEN
    RETURN NEW;
  END IF;

  NEW.status := OLD.status;
  NEW.rejection_reason := OLD.rejection_reason;
  NEW.is_highlight := OLD.is_highlight;
  NEW.highlight_plan_id := OLD.highlight_plan_id;
  NEW.highlight_until := OLD.highlight_until;
  NEW.views_count := OLD.views_count;
  NEW.published_at := OLD.published_at;
  RETURN NEW;
END;
$$;

CREATE TRIGGER ads_guard_moderation
  BEFORE UPDATE ON public.ads
  FOR EACH ROW EXECUTE FUNCTION public.ads_guard_moderation_fields();

-- Contador de visitas sem expor UPDATE amplo
CREATE OR REPLACE FUNCTION public.increment_ad_views(target_ad_id uuid)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE public.ads
     SET views_count = views_count + 1
   WHERE id = target_ad_id AND status = 'publicado';
$$;

REVOKE ALL ON FUNCTION public.increment_ad_views(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.increment_ad_views(uuid) TO anon, authenticated;

-- Planos iniciais
INSERT INTO public.ad_plans (name, description, benefits, price_cents, duration_days, display_order)
VALUES
  ('Básico', 'Seu anúncio entra no carrossel de destaques da vitrine.',
   ARRAY['Vaga no carrossel de até 10 destaques', 'Selo de destaque no anúncio'], 3000, 7, 1),
  ('Intermediário', 'Mais tempo em evidência e chamada nos stories.',
   ARRAY['Vaga no carrossel de até 10 destaques', 'Selo de destaque no anúncio', 'Chamada nos stories'], 6000, 15, 2),
  ('Premium', 'Topo do carrossel, stories e divulgação no canal oficial.',
   ARRAY['Topo do carrossel de destaques', 'Selo de destaque no anúncio', 'Chamada nos stories', 'Divulgação no canal oficial'], 12000, 30, 3);

-- Fotos dos anúncios
CREATE POLICY "ad_photos_public_read" ON storage.objects
  FOR SELECT TO anon, authenticated
  USING (bucket_id = 'ad-photos');

CREATE POLICY "ad_photos_owner_insert" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'ad-photos' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "ad_photos_owner_update" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'ad-photos' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "ad_photos_owner_delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'ad-photos' AND (storage.foldername(name))[1] = auth.uid()::text);
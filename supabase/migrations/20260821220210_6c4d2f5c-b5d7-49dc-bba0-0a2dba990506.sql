BEGIN;

-- 1. Update atrativos search to explicitly ignore any misclassified establishments
CREATE OR REPLACE FUNCTION public.search_atrativos_autocomplete(
    _q text DEFAULT NULL::text,
    _limit integer DEFAULT 20,
    _offset integer DEFAULT 0
)
RETURNS TABLE(
    id uuid,
    name text,
    type text,
    tipo_atrativo text,
    style text,
    estilos text[],
    description text,
    contact_whatsapp text,
    estabelecimento_id uuid,
    pais text,
    estado text,
    cidade_regiao text,
    logo_url text,
    fotos text[],
    is_approved boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT a.id, a.name, a.type, a.tipo_atrativo, a.style, a.estilos, a.description,
         a.contact_whatsapp, a.estabelecimento_id, a.pais, a.estado, a.cidade_regiao,
         a.logo_url, a.fotos, a.is_approved
    FROM public.atrativos a
   WHERE (_q IS NULL OR _q = '' OR a.name ILIKE '%' || _q || '%')
     AND (lower(a.type) NOT LIKE '%bar%' AND lower(a.type) NOT LIKE '%restaurante%')
     AND (lower(a.tipo_atrativo) NOT LIKE '%bar%' AND lower(a.tipo_atrativo) NOT LIKE '%restaurante%')
   ORDER BY a.is_approved DESC, a.name ASC
   LIMIT GREATEST(LEAST(_limit, 50), 1)
  OFFSET GREATEST(_offset, 0);
END;
$$;

-- 2. Add a constraint trigger to atrativos to prevent future Bar/Restaurante classifications
CREATE OR REPLACE FUNCTION public.check_atrativo_category_restriction()
RETURNS TRIGGER AS $$
BEGIN
  IF lower(NEW.type) LIKE '%bar%' OR lower(NEW.type) LIKE '%restaurante%' OR 
     lower(NEW.tipo_atrativo) LIKE '%bar%' OR lower(NEW.tipo_atrativo) LIKE '%restaurante%' THEN
    RAISE EXCEPTION 'Bares e Restaurantes devem ser cadastrados como Estabelecimentos, não Atrativos.';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_atrativo_category_restriction ON public.atrativos;
CREATE TRIGGER trg_atrativo_category_restriction
BEFORE INSERT OR UPDATE ON public.atrativos
FOR EACH ROW EXECUTE FUNCTION public.check_atrativo_category_restriction();

COMMIT;
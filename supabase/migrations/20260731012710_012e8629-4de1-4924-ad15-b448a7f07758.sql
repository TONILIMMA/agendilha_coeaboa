CREATE OR REPLACE FUNCTION public.search_atrativos_autocomplete(_q text DEFAULT NULL, _limit int DEFAULT 20, _offset int DEFAULT 0)
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
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT a.id, a.name, a.type, a.tipo_atrativo, a.style, a.estilos, a.description,
         a.contact_whatsapp, a.estabelecimento_id, a.pais, a.estado, a.cidade_regiao,
         a.logo_url, a.fotos, a.is_approved
    FROM public.atrativos a
   WHERE _q IS NULL OR _q = '' OR a.name ILIKE '%' || _q || '%'
   ORDER BY a.is_approved DESC, a.name ASC
   LIMIT GREATEST(LEAST(_limit, 50), 1)
  OFFSET GREATEST(_offset, 0);
END;
$$;

REVOKE ALL ON FUNCTION public.search_atrativos_autocomplete(text, int, int) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.search_atrativos_autocomplete(text, int, int) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.search_estabelecimentos_autocomplete(_q text DEFAULT NULL, _limit int DEFAULT 20, _offset int DEFAULT 0)
RETURNS TABLE(
  id uuid,
  nome text,
  endereco text,
  bairro text,
  cep text,
  numero text,
  complemento text,
  tipo text,
  tipos text[],
  contato text,
  fotos text[],
  is_approved boolean
)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT e.id, e.nome, e.endereco, e.bairro, e.cep, e.numero, e.complemento,
         e.tipo, e.tipos, e.contato, e.fotos, e.is_approved
    FROM public.estabelecimentos e
   WHERE _q IS NULL OR _q = '' OR e.nome ILIKE '%' || _q || '%'
   ORDER BY e.is_approved DESC, e.nome ASC
   LIMIT GREATEST(LEAST(_limit, 50), 1)
  OFFSET GREATEST(_offset, 0);
END;
$$;

REVOKE ALL ON FUNCTION public.search_estabelecimentos_autocomplete(text, int, int) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.search_estabelecimentos_autocomplete(text, int, int) TO authenticated, service_role;
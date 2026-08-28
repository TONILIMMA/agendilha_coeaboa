CREATE OR REPLACE FUNCTION public.search_atrativos_autocomplete(_q text DEFAULT NULL, _limit integer DEFAULT 12, _offset integer DEFAULT 0)
RETURNS TABLE(id uuid, name text, type text, tipo_atrativo text, style text, estilos text[], description text, contact_whatsapp text, estabelecimento_id uuid, pais text, estado text, cidade_regiao text, logo_url text, fotos text[], is_approved boolean)
LANGUAGE plpgsql
STABLE
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
     AND lower(coalesce(a.type, '')) NOT LIKE '%bar%'
     AND lower(coalesce(a.type, '')) NOT LIKE '%restaurante%'
     AND lower(coalesce(a.tipo_atrativo, '')) NOT LIKE '%bar%'
     AND lower(coalesce(a.tipo_atrativo, '')) NOT LIKE '%restaurante%'
   ORDER BY a.is_approved DESC, a.name ASC
   LIMIT GREATEST(LEAST(_limit, 50), 1)
  OFFSET GREATEST(_offset, 0);
END;
$$;
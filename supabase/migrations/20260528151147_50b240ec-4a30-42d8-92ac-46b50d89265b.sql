CREATE OR REPLACE FUNCTION public.get_admin_dashboard_stats(
  p_period text DEFAULT 'month'::text, 
  p_neighborhood text DEFAULT 'all'::text, 
  p_category text DEFAULT 'all'::text
)
 RETURNS jsonb
 LANGUAGE plpgsql
AS $function$
DECLARE
  v_result JSONB;
  v_start_date TIMESTAMP;
  v_total_users INT;
  v_promoters INT;
  v_admins INT;
  v_total_events INT;
  v_pending_events INT;
  v_approved_events INT;
  v_cancelled_events INT;
  v_total_favorites INT;
  v_total_artists INT;
  v_total_places INT;
  v_neighborhoods_count INT;
  v_kpis JSONB;
  v_charts JSONB;
  v_rankings JSONB;
  v_system_health JSONB;
BEGIN
  -- 1. Definir período
  IF p_period = 'week' THEN v_start_date := NOW() - INTERVAL '7 days';
  ELSIF p_period = 'month' THEN v_start_date := NOW() - INTERVAL '30 days';
  ELSIF p_period = 'year' THEN v_start_date := NOW() - INTERVAL '365 days';
  ELSE v_start_date := '1970-01-01'::TIMESTAMP;
  END IF;

  -- 2. KPIs de Usuários (Global)
  SELECT COUNT(*) INTO v_total_users FROM profiles;
  SELECT COUNT(DISTINCT user_id) INTO v_promoters FROM user_roles WHERE role IN ('collaborator', 'admin', 'master');
  SELECT COUNT(DISTINCT user_id) INTO v_admins FROM user_roles WHERE role IN ('admin', 'master');

  -- 3. KPIs de Eventos (Filtrados)
  SELECT 
    COUNT(*),
    COUNT(*) FILTER (WHERE status = 'pendente'),
    COUNT(*) FILTER (WHERE status = 'aprovado' OR status = 'publicado'),
    COUNT(*) FILTER (WHERE status = 'cancelado'),
    COUNT(DISTINCT address_neighborhood)
  INTO 
    v_total_events,
    v_pending_events,
    v_approved_events,
    v_cancelled_events,
    v_neighborhoods_count
  FROM submissions
  WHERE (created_at >= v_start_date OR v_start_date = '1970-01-01'::TIMESTAMP)
    AND (p_neighborhood = 'all' OR address_neighborhood = p_neighborhood)
    AND (p_category = 'all' OR category = p_category);

  -- 4. Métricas adicionais
  SELECT COUNT(*) INTO v_total_artists FROM artist_profiles;
  -- Estabelecimentos (baseado em localizações únicas nos eventos)
  SELECT COUNT(DISTINCT location) INTO v_total_places FROM submissions WHERE location IS NOT NULL;
  -- Favoritos (se houver tabela, senão 0)
  v_total_favorites := 0;

  v_kpis := jsonb_build_object(
    'totalUsers', COALESCE(v_total_users, 0),
    'publicUsers', COALESCE(v_total_users, 0) - COALESCE(v_promoters, 0),
    'promoters', COALESCE(v_promoters, 0),
    'admins', COALESCE(v_admins, 0),
    'totalEvents', COALESCE(v_total_events, 0),
    'pendingEvents', COALESCE(v_pending_events, 0),
    'approvedEvents', COALESCE(v_approved_events, 0),
    'cancelledEvents', COALESCE(v_cancelled_events, 0),
    'totalFavorites', v_total_favorites,
    'totalArtists', COALESCE(v_total_artists, 0),
    'totalPlaces', COALESCE(v_total_places, 0),
    'neighborhoodsWithEvents', COALESCE(v_neighborhoods_count, 0)
  );

  -- 5. Gráficos de Evolução
  WITH event_days AS (
    SELECT date_trunc('day', created_at)::DATE as d, COUNT(*) as c
    FROM submissions
    WHERE (created_at >= v_start_date OR v_start_date = '1970-01-01'::TIMESTAMP)
    GROUP BY 1
    ORDER BY 1
  )
  SELECT jsonb_agg(jsonb_build_object('date', d, 'count', c)) INTO v_charts FROM event_days;

  -- 6. Rankings por Bairro
  WITH neighborhood_stats AS (
    SELECT address_neighborhood, COUNT(*) as c
    FROM submissions
    WHERE (created_at >= v_start_date OR v_start_date = '1970-01-01'::TIMESTAMP)
    GROUP BY 1
    ORDER BY 2 DESC
    LIMIT 10
  )
  SELECT jsonb_agg(jsonb_build_object('name', COALESCE(address_neighborhood, 'Não informado'), 'value', c)) INTO v_rankings FROM neighborhood_stats;

  -- 7. Saúde do Sistema
  v_system_health := jsonb_build_object(
    'database', 'online',
    'storage', 'online',
    'newsletter', 'online',
    'last_update', NOW()
  );

  v_result := jsonb_build_object(
    'kpis', v_kpis,
    'charts', jsonb_build_object(
      'eventsByPeriod', COALESCE(v_charts, '[]'::jsonb),
      'newUsersEvolution', '[]'::jsonb,
      'eventsByNeighborhood', COALESCE(v_rankings, '[]'::jsonb)
    ),
    'rankings', jsonb_build_object(
      'topEvents', '[]'::jsonb,
      'topPlaces', '[]'::jsonb,
      'topArtists', '[]'::jsonb,
      'topPromoters', '[]'::jsonb
    ),
    'system_health', v_system_health
  );

  RETURN v_result;
END;
$function$;

CREATE OR REPLACE FUNCTION get_admin_dashboard_stats(
  p_period TEXT DEFAULT 'month',
  p_neighborhood TEXT DEFAULT 'all',
  p_category TEXT DEFAULT 'all'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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
    COUNT(*) FILTER (WHERE status = 'pending'),
    COUNT(*) FILTER (WHERE status = 'approved'),
    COUNT(*) FILTER (WHERE status = 'cancelled')
  INTO 
    v_total_events,
    v_pending_events,
    v_approved_events,
    v_cancelled_events
  FROM submissions
  WHERE created_at >= v_start_date
    AND (p_neighborhood = 'all' OR neighborhood = p_neighborhood)
    AND (p_category = 'all' OR category = p_category);

  v_kpis := jsonb_build_object(
    'totalUsers', v_total_users,
    'publicUsers', v_total_users - v_promoters,
    'promoters', v_promoters,
    'admins', v_admins,
    'totalEvents', v_total_events,
    'pendingEvents', v_pending_events,
    'approvedEvents', v_approved_events,
    'cancelledEvents', v_cancelled_events
  );

  -- 4. Gráficos
  WITH event_days AS (
    SELECT date_trunc('day', created_at)::DATE as d, COUNT(*) as c
    FROM submissions
    WHERE created_at >= v_start_date
    GROUP BY 1
    ORDER BY 1
  )
  SELECT jsonb_agg(jsonb_build_object('date', d, 'count', c)) INTO v_charts FROM event_days;

  -- 5. Rankings
  WITH neighborhood_stats AS (
    SELECT neighborhood, COUNT(*) as c
    FROM submissions
    WHERE created_at >= v_start_date
    GROUP BY 1
    ORDER BY 2 DESC
    LIMIT 10
  )
  SELECT jsonb_agg(jsonb_build_object('name', COALESCE(neighborhood, 'Não informado'), 'value', c)) INTO v_rankings FROM neighborhood_stats;

  -- 6. Saúde do Sistema (Mock ou dados reais se houver tabela)
  v_system_health := jsonb_build_object(
    'database', 'healthy',
    'storage', 'healthy',
    'auth', 'healthy',
    'lastUpdate', NOW()
  );

  v_result := jsonb_build_object(
    'kpis', v_kpis,
    'charts', jsonb_build_object(
      'eventsByPeriod', COALESCE(v_charts, '[]'::jsonb),
      'newUsersEvolution', '[]'::jsonb, -- Adicionar lógica se necessário
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
$$;

GRANT EXECUTE ON FUNCTION get_admin_dashboard_stats TO authenticated;
GRANT EXECUTE ON FUNCTION get_admin_dashboard_stats TO service_role;

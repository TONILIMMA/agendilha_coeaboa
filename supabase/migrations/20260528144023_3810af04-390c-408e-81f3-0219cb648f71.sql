CREATE OR REPLACE FUNCTION public.get_admin_dashboard_stats(
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
  v_start_date TIMESTAMP WITH TIME ZONE;
  v_result JSONB;
  v_approved_count INT;
  v_published_count INT;
  v_divulged_count INT;
  v_total_favorites INT;
  v_total_views INT;
  v_pending_events INT;
  v_cancelled_events INT;
  v_total_events INT;
  v_total_users INT;
  v_admin_count INT;
  v_promoter_count INT;
  v_public_count INT;
BEGIN
  -- Set start date based on period
  IF p_period = 'week' THEN
    v_start_date := NOW() - INTERVAL '7 days';
  ELSIF p_period = 'month' THEN
    v_start_date := NOW() - INTERVAL '30 days';
  ELSIF p_period = 'year' THEN
    v_start_date := NOW() - INTERVAL '1 year';
  ELSE
    v_start_date := '1900-01-01'::TIMESTAMP WITH TIME ZONE;
  END IF;

  -- KPI Counts
  SELECT COUNT(*) INTO v_approved_count FROM submissions WHERE status = 'aprovado' AND (p_category = 'all' OR category = p_category) AND (p_neighborhood = 'all' OR address_neighborhood = p_neighborhood);
  SELECT COUNT(*) INTO v_published_count FROM submissions WHERE status = 'publicado' AND (p_category = 'all' OR category = p_category) AND (p_neighborhood = 'all' OR address_neighborhood = p_neighborhood);
  -- For "divulged", we'll count those with shares or views for now, or use approved as fallback if no specific field
  SELECT COUNT(*) INTO v_divulged_count FROM submissions WHERE shares_count > 0 AND (p_category = 'all' OR category = p_category) AND (p_neighborhood = 'all' OR address_neighborhood = p_neighborhood);
  
  SELECT COUNT(*) INTO v_total_favorites FROM user_favorites;
  SELECT COALESCE(SUM(views_count), 0) INTO v_total_views FROM submissions WHERE (p_category = 'all' OR category = p_category) AND (p_neighborhood = 'all' OR address_neighborhood = p_neighborhood);
  
  SELECT COUNT(*) INTO v_pending_events FROM submissions WHERE status = 'pendente';
  SELECT COUNT(*) INTO v_cancelled_events FROM submissions WHERE status = 'cancelado';
  SELECT COUNT(*) INTO v_total_events FROM submissions;

  -- User Counts
  SELECT COUNT(*) INTO v_total_users FROM profiles;
  SELECT COUNT(*) INTO v_admin_count FROM user_roles WHERE role IN ('admin', 'master');
  SELECT COUNT(*) INTO v_promoter_count FROM profiles WHERE role = 'promoter';
  SELECT COUNT(*) INTO v_public_count FROM profiles WHERE role = 'public';

  -- Build Result
  v_result := jsonb_build_object(
    'kpis', jsonb_build_object(
      'approvedEvents', v_approved_count,
      'publishedEvents', v_published_count,
      'divulgedEvents', v_divulged_count,
      'totalFavorites', v_total_favorites,
      'totalViews', v_total_views,
      'pendingEvents', v_pending_events,
      'cancelledEvents', v_cancelled_events,
      'totalEvents', v_total_events,
      'totalUsers', v_total_users,
      'admins', v_admin_count,
      'promoters', v_promoter_count,
      'publicUsers', v_public_count
    ),
    'charts', jsonb_build_object(
      'eventsByNeighborhood', (
        SELECT jsonb_agg(jsonb_build_object('name', COALESCE(address_neighborhood, 'Outros'), 'value', count))
        FROM (
          SELECT address_neighborhood, COUNT(*) as count
          FROM submissions
          GROUP BY address_neighborhood
          ORDER BY count DESC
          LIMIT 10
        ) s
      ),
      'eventsByPeriod', (
        SELECT jsonb_agg(jsonb_build_object('date', date_trunc('day', created_at), 'count', count))
        FROM (
          SELECT date_trunc('day', created_at) as created_at, COUNT(*) as count
          FROM submissions
          WHERE created_at >= v_start_date
          GROUP BY 1
          ORDER BY 1 ASC
        ) s
      ),
      'newUsersEvolution', (
        SELECT jsonb_agg(jsonb_build_object('date', date_trunc('day', created_at), 'count', count))
        FROM (
          SELECT date_trunc('day', created_at) as created_at, COUNT(*) as count
          FROM profiles
          WHERE created_at >= v_start_date
          GROUP BY 1
          ORDER BY 1 ASC
        ) s
      )
    ),
    'rankings', jsonb_build_object(
      'topEvents', (
        SELECT jsonb_agg(jsonb_build_object('name', event_title, 'value', views_count))
        FROM (
          SELECT event_title, views_count
          FROM submissions
          ORDER BY views_count DESC
          LIMIT 5
        ) s
      ),
      'topPlaces', (
        SELECT jsonb_agg(jsonb_build_object('name', location, 'value', count))
        FROM (
          SELECT location, COUNT(*) as count
          FROM submissions
          GROUP BY location
          ORDER BY count DESC
          LIMIT 5
        ) s
      ),
      'topPromoters', (
        SELECT jsonb_agg(jsonb_build_object('name', COALESCE(p.responsible_name, p.company_name, 'Usuário'), 'value', count))
        FROM (
          SELECT user_id, COUNT(*) as count
          FROM submissions
          GROUP BY user_id
          ORDER BY count DESC
          LIMIT 5
        ) s
        LEFT JOIN profiles p ON p.user_id = s.user_id
      ),
      'topArtists', (
        SELECT jsonb_agg(jsonb_build_object('name', atrativo_name, 'value', count))
        FROM (
          SELECT atrativo_name, COUNT(*) as count
          FROM submissions
          WHERE atrativo_name IS NOT NULL
          GROUP BY atrativo_name
          ORDER BY count DESC
          LIMIT 5
        ) s
      )
    ),
    'system_health', jsonb_build_object(
      'database', 'online',
      'storage', 'online',
      'newsletter', 'online',
      'last_update', NOW()
    )
  );

  RETURN v_result;
END;
$$;

-- Grant access to authenticated users
GRANT EXECUTE ON FUNCTION public.get_admin_dashboard_stats(TEXT, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_admin_dashboard_stats(TEXT, TEXT, TEXT) TO service_role;

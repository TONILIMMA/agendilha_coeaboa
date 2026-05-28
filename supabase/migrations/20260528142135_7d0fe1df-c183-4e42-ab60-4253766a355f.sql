CREATE OR REPLACE FUNCTION public.get_admin_dashboard_stats(
    p_period text DEFAULT 'month',
    p_neighborhood text DEFAULT 'all',
    p_category text DEFAULT 'all'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_is_authorized boolean;
    v_now timestamp with time zone := now();
    v_cutoff timestamp with time zone;
    v_stats JSONB;
BEGIN
    -- Authorization check
    v_is_authorized := public.is_admin_or_master(auth.uid());

    IF NOT v_is_authorized THEN
        RAISE EXCEPTION 'Unauthorized access to dashboard stats';
    END IF;

    -- Period cutoff
    IF p_period = 'week' THEN v_cutoff := v_now - interval '7 days';
    ELSIF p_period = 'month' THEN v_cutoff := v_now - interval '30 days';
    ELSIF p_period = 'year' THEN v_cutoff := v_now - interval '365 days';
    ELSE v_cutoff := '1970-01-01'::timestamp with time zone;
    END IF;

    -- Build Stats
    SELECT jsonb_build_object(
        'kpis', (
            SELECT jsonb_build_object(
                'totalUsers', (SELECT count(*) FROM public.profiles WHERE created_at >= v_cutoff),
                'publicUsers', (SELECT count(*) FROM public.profiles p WHERE created_at >= v_cutoff AND NOT EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = p.user_id AND role IN ('admin', 'master'))),
                'promoters', (SELECT count(*) FROM public.profiles WHERE created_at >= v_cutoff AND role = 'promoter'),
                'admins', (SELECT count(*) FROM public.user_roles WHERE role IN ('admin', 'master')),
                'totalEvents', (SELECT count(*) FROM public.submissions WHERE created_at >= v_cutoff AND (p_neighborhood = 'all' OR address_neighborhood = p_neighborhood) AND (p_category = 'all' OR category = p_category)),
                'pendingEvents', (SELECT count(*) FROM public.submissions WHERE created_at >= v_cutoff AND status IN ('pendente', 'em_revisao') AND (p_neighborhood = 'all' OR address_neighborhood = p_neighborhood) AND (p_category = 'all' OR category = p_category)),
                'approvedEvents', (SELECT count(*) FROM public.submissions WHERE created_at >= v_cutoff AND status IN ('aprovado', 'publicado', 'divulgado') AND (p_neighborhood = 'all' OR address_neighborhood = p_neighborhood) AND (p_category = 'all' OR category = p_category)),
                'cancelledEvents', (SELECT count(*) FROM public.submissions WHERE created_at >= v_cutoff AND status IN ('cancelado', 'blocked') AND (p_neighborhood = 'all' OR address_neighborhood = p_neighborhood) AND (p_category = 'all' OR category = p_category)),
                'totalFavorites', (SELECT count(*) FROM public.user_favorites f JOIN public.submissions s ON f.event_id = s.id WHERE f.created_at >= v_cutoff AND (p_neighborhood = 'all' OR s.address_neighborhood = p_neighborhood) AND (p_category = 'all' OR s.category = p_category)),
                'totalArtists', (SELECT count(*) FROM public.artist_profiles),
                'totalPlaces', (SELECT count(*) FROM public.places),
                'neighborhoodsWithEvents', (SELECT count(DISTINCT address_neighborhood) FROM public.submissions WHERE status IN ('aprovado', 'publicado', 'divulgado'))
            )
        ),
        'charts', (
            SELECT jsonb_build_object(
                'eventsByNeighborhood', (
                    SELECT jsonb_agg(d) FROM (
                        SELECT address_neighborhood as name, count(*) as value 
                        FROM public.submissions 
                        WHERE created_at >= v_cutoff AND address_neighborhood IS NOT NULL AND (p_category = 'all' OR category = p_category)
                        GROUP BY address_neighborhood 
                        ORDER BY value DESC 
                        LIMIT 10
                    ) d
                ),
                'eventsByCategory', (
                    SELECT jsonb_agg(d) FROM (
                        SELECT category as name, count(*) as value 
                        FROM public.submissions 
                        WHERE created_at >= v_cutoff AND category IS NOT NULL AND (p_neighborhood = 'all' OR address_neighborhood = p_neighborhood)
                        GROUP BY category 
                        ORDER BY value DESC
                    ) d
                )
            )
        ),
        'rankings', (
            SELECT jsonb_build_object(
                'topEvents', (
                    SELECT jsonb_agg(d) FROM (
                        SELECT s.event_title as name, count(f.id) as count
                        FROM public.submissions s
                        JOIN public.user_favorites f ON s.id = f.event_id
                        WHERE f.created_at >= v_cutoff AND (p_neighborhood = 'all' OR s.address_neighborhood = p_neighborhood) AND (p_category = 'all' OR s.category = p_category)
                        GROUP BY s.id, s.event_title
                        ORDER BY count DESC
                        LIMIT 10
                    ) d
                ),
                'topPromoters', (
                    SELECT jsonb_agg(d) FROM (
                        SELECT COALESCE(p.responsible_name, p.company_name, 'Divulgador') as name, count(s.id) as count
                        FROM public.profiles p
                        JOIN public.submissions s ON p.user_id = s.user_id
                        WHERE s.created_at >= v_cutoff AND s.status IN ('aprovado', 'publicado', 'divulgado')
                        GROUP BY p.user_id, p.responsible_name, p.company_name
                        ORDER BY count DESC
                        LIMIT 5
                    ) d
                )
            )
        )
    ) INTO v_stats;

    RETURN v_stats;
END;
$$;

-- Function to check if a user is an admin or master in either System A or System B
CREATE OR REPLACE FUNCTION public.is_admin_or_master(p_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN EXISTS (
        -- System A (legacy user_roles)
        SELECT 1 FROM public.user_roles WHERE user_id = p_user_id AND role IN ('admin', 'master')
        UNION
        -- System B (app_user_roles)
        SELECT 1 FROM public.app_user_roles ur 
        JOIN public.app_roles r ON ur.role_id = r.id 
        WHERE ur.user_id = p_user_id AND r.name IN ('admin', 'master_admin')
    );
END;
$$;

-- Secure KPI retrieval function
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
                        WHERE created_at >= v_cutoff AND address_neighborhood IS NOT NULL
                        GROUP BY address_neighborhood 
                        ORDER BY value DESC 
                        LIMIT 10
                    ) d
                ),
                'eventsByCategory', (
                    SELECT jsonb_agg(d) FROM (
                        SELECT category as name, count(*) as value 
                        FROM public.submissions 
                        WHERE created_at >= v_cutoff AND category IS NOT NULL
                        GROUP BY category 
                        ORDER BY value DESC
                    ) d
                )
            )
        )
    ) INTO v_stats;

    RETURN v_stats;
END;
$$;

-- Grant access to the functions
GRANT EXECUTE ON FUNCTION public.is_admin_or_master(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_admin_dashboard_stats(text, text, text) TO authenticated;

-- Ensure Master Admins can see everything in RLS
DO $$
BEGIN
    -- Submissions
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'submissions' AND policyname = 'Master admins can view all submissions') THEN
        CREATE POLICY "Master admins can view all submissions" ON public.submissions FOR SELECT USING (public.is_admin_or_master(auth.uid()));
    END IF;

    -- Profiles
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'profiles' AND policyname = 'Master admins can view all profiles') THEN
        CREATE POLICY "Master admins can view all profiles" ON public.profiles FOR SELECT USING (public.is_admin_or_master(auth.uid()));
    END IF;
    
    -- User Favorites (for analytics)
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_favorites' AND policyname = 'Admins can view all favorites for analytics') THEN
        CREATE POLICY "Admins can view all favorites for analytics" ON public.user_favorites FOR SELECT USING (public.is_admin_or_master(auth.uid()));
    END IF;
END $$;

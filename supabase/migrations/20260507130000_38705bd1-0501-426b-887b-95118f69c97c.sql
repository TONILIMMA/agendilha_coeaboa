-- Function to increment views
CREATE OR REPLACE FUNCTION public.increment_views(event_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.submissions
  SET views_count = COALESCE(views_count, 0) + 1
  WHERE id = event_id;
END;
$$;

-- Function to increment shares
CREATE OR REPLACE FUNCTION public.increment_shares(event_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.submissions
  SET shares_count = COALESCE(shares_count, 0) + 1
  WHERE id = event_id;
END;
$$;

-- Grant execute to anon and authenticated
GRANT EXECUTE ON FUNCTION public.increment_views(UUID) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.increment_shares(UUID) TO anon, authenticated;

-- Create a view to calculate average ratings per event
CREATE OR REPLACE VIEW public.event_ratings_summary AS
SELECT 
    event_id,
    ROUND(AVG(rating), 1) as average_rating,
    COUNT(*) as total_reviews
FROM 
    public.event_reviews
GROUP BY 
    event_id;

-- Ensure RLS or permissions allow reading from this view
-- Views in Supabase usually inherit permissions or are accessible if the underlying tables are.
-- Let's make sure everyone can read it.
GRANT SELECT ON public.event_ratings_summary TO anon, authenticated;

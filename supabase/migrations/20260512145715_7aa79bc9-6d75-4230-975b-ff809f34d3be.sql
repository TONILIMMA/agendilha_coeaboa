-- Add moderation columns
ALTER TABLE public.event_reviews 
ADD COLUMN is_flagged BOOLEAN DEFAULT false,
ADD COLUMN status TEXT DEFAULT 'approved' CHECK (status IN ('approved', 'pending', 'rejected'));

-- Update the summary view to only include approved reviews
CREATE OR REPLACE VIEW public.event_ratings_summary AS
SELECT 
    event_id,
    ROUND(AVG(rating), 1) as average_rating,
    COUNT(*) as total_reviews
FROM 
    public.event_reviews
WHERE
    status = 'approved'
GROUP BY 
    event_id;

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_event_reviews_event_id_created ON public.event_reviews (event_id, created_at DESC);

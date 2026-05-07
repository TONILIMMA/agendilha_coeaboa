-- Add is_highlight column to submissions
ALTER TABLE public.submissions ADD COLUMN IF NOT EXISTS is_highlight BOOLEAN DEFAULT false;

-- Add views and shares columns if they don't exist
ALTER TABLE public.submissions ADD COLUMN IF NOT EXISTS views_count INTEGER DEFAULT 0;
ALTER TABLE public.submissions ADD COLUMN IF NOT EXISTS shares_count INTEGER DEFAULT 0;

-- Function to increment views
CREATE OR REPLACE FUNCTION public.increment_views(event_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE public.submissions
  SET views_count = COALESCE(views_count, 0) + 1
  WHERE id = event_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to increment shares
CREATE OR REPLACE FUNCTION public.increment_shares(event_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE public.submissions
  SET shares_count = COALESCE(shares_count, 0) + 1
  WHERE id = event_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
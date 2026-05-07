-- Add columns for highlights and metrics
ALTER TABLE public.submissions 
ADD COLUMN IF NOT EXISTS is_highlight BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS views_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS shares_count INTEGER DEFAULT 0;

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_submissions_is_highlight ON public.submissions(is_highlight) WHERE is_highlight = true;

-- Update RLS if needed (already seems to have standard policies)
-- Assuming existing policies allow update for admins.

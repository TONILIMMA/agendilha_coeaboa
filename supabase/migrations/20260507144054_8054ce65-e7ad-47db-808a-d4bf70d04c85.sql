-- First, drop the old constraint
ALTER TABLE public.submissions DROP CONSTRAINT IF EXISTS submissions_status_check;

-- Add the new constraint with all required statuses
ALTER TABLE public.submissions ADD CONSTRAINT submissions_status_check 
CHECK (status = ANY (ARRAY['draft'::text, 'pending'::text, 'analysis'::text, 'approved'::text, 'rejected'::text, 'published'::text]));

-- Migration to make event_title nullable in submissions table
ALTER TABLE public.submissions ALTER COLUMN event_title DROP NOT NULL;
ALTER TABLE public.submissions ALTER COLUMN event_title SET DEFAULT NULL;

-- Ensure public_submissions view (if it exists) reflects this, though views usually follow base table nullability
-- If there are other tables/views that depend on event_title being non-null, they should be adjusted.

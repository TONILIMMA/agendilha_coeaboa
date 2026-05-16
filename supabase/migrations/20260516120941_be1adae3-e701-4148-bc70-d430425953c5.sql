-- Update follows table
ALTER TABLE public.follows 
RENAME COLUMN follower_id TO user_id;

ALTER TABLE public.follows 
ALTER COLUMN artist_id DROP NOT NULL;

ALTER TABLE public.follows 
ADD COLUMN IF NOT EXISTS target_id TEXT,
ADD COLUMN IF NOT EXISTS target_type TEXT CHECK (target_type IN ('artist', 'neighborhood', 'style'));

-- Migrate existing data if any
UPDATE public.follows 
SET target_id = artist_id::text, target_type = 'artist' 
WHERE artist_id IS NOT NULL AND target_id IS NULL;

-- Make columns not null after migration
-- First, handle cases where they might be null
DELETE FROM public.follows WHERE user_id IS NULL; -- Should not happen

ALTER TABLE public.follows 
ALTER COLUMN target_id SET NOT NULL,
ALTER COLUMN target_type SET NOT NULL;

-- Cleanup artist_id if we don't need it anymore
ALTER TABLE public.follows DROP COLUMN artist_id;

-- Ensure RLS
ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;

-- Policies
DROP POLICY IF EXISTS "Users can view their own follows" ON public.follows;
CREATE POLICY "Users can view their own follows" 
ON public.follows FOR SELECT 
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can manage their own follows" ON public.follows;
CREATE POLICY "Users can manage their own follows" 
ON public.follows FOR ALL 
USING (auth.uid() = user_id);

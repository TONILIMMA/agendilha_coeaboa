-- Update artist_media
ALTER TABLE public.artist_media 
ADD COLUMN IF NOT EXISTS thumbnail_url TEXT,
ADD COLUMN IF NOT EXISTS is_approved BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS ai_score FLOAT,
ADD COLUMN IF NOT EXISTS moderation_status TEXT DEFAULT 'pending' CHECK (moderation_status IN ('pending', 'approved', 'rejected'));

-- Update artist_profiles
ALTER TABLE public.artist_profiles
ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT FALSE;

-- Create moderation_logs
CREATE TABLE IF NOT EXISTS public.moderation_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    moderator_id UUID REFERENCES auth.users(id),
    target_type TEXT NOT NULL, -- 'submission', 'artist_profile', 'artist_media'
    target_id UUID NOT NULL,
    action TEXT NOT NULL, -- 'approved', 'rejected', 'flagged'
    reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on moderation_logs
ALTER TABLE public.moderation_logs ENABLE ROW LEVEL SECURITY;

-- Policies for moderation_logs
CREATE POLICY "Admins can view moderation logs" 
ON public.moderation_logs 
FOR SELECT 
USING (EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role = 'admin'));

-- Update submissions AI fields
ALTER TABLE public.submissions
ADD COLUMN IF NOT EXISTS ai_moderation_score FLOAT,
ADD COLUMN IF NOT EXISTS ai_moderation_labels TEXT[];

-- Simple function to mock AI moderation (can be replaced by an Edge Function call later)
CREATE OR REPLACE FUNCTION public.auto_moderate_content()
RETURNS TRIGGER AS $$
BEGIN
  -- Simple rule-based mock for AI moderation
  -- In a real scenario, this would trigger an Edge Function via pg_net or similar
  NEW.moderation_status := 'pending_review';
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

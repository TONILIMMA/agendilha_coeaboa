-- Expand profiles for public users
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS city TEXT DEFAULT 'Rio de Janeiro',
ADD COLUMN IF NOT EXISTS musical_preferences TEXT[],
ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT FALSE;

-- Track user interactions for the recommendation engine
CREATE TABLE IF NOT EXISTS public.user_activity_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    activity_type TEXT NOT NULL, -- 'view_event', 'favorite_event', 'search', 'category_click'
    entity_id TEXT, -- event_id or category_name
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_activity_logs ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can insert their own activity" ON public.user_activity_logs
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all activity" ON public.user_activity_logs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.user_roles
            WHERE user_id = auth.uid() AND (role = 'admin' OR role = 'master')
        )
    );

-- Index for analytics performance
CREATE INDEX IF NOT EXISTS idx_activity_logs_type ON public.user_activity_logs(activity_type);
CREATE INDEX IF NOT EXISTS idx_activity_logs_user ON public.user_activity_logs(user_id);

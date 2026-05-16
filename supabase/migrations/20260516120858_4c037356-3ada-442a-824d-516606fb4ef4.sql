-- Add notification settings to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS push_notifications_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS email_notifications_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS notification_frequency TEXT DEFAULT 'weekly',
ADD COLUMN IF NOT EXISTS followed_neighborhoods TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS followed_styles TEXT[] DEFAULT '{}';

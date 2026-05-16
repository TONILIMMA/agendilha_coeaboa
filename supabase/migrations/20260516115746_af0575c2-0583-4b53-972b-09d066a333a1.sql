-- Add role to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'public';

-- Create artist_profiles table
CREATE TABLE IF NOT EXISTS public.artist_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    bio TEXT,
    genre TEXT,
    city TEXT,
    neighborhood TEXT,
    member_count INTEGER DEFAULT 1,
    artist_type TEXT CHECK (artist_type IN ('cover', 'autoral', 'both')),
    instagram TEXT,
    whatsapp TEXT,
    spotify TEXT,
    youtube TEXT,
    cover_url TEXT,
    avatar_url TEXT,
    is_approved BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id)
);

-- Create artist_media table
CREATE TABLE IF NOT EXISTS public.artist_media (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    artist_id UUID REFERENCES public.artist_profiles(id) ON DELETE CASCADE NOT NULL,
    media_type TEXT CHECK (media_type IN ('image', 'video')),
    url TEXT NOT NULL,
    thumbnail_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create follows table
CREATE TABLE IF NOT EXISTS public.follows (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    follower_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    artist_id UUID REFERENCES public.artist_profiles(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(follower_id, artist_id)
);

-- Enable RLS
ALTER TABLE public.artist_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.artist_media ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;

-- Policies for artist_profiles
CREATE POLICY "Public profiles are viewable by everyone" ON public.artist_profiles
    FOR SELECT USING (is_approved = TRUE OR auth.uid() = user_id);

CREATE POLICY "Artists can insert their own profile" ON public.artist_profiles
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Artists can update their own profile" ON public.artist_profiles
    FOR UPDATE USING (auth.uid() = user_id);

-- Policies for artist_media
CREATE POLICY "Artist media is viewable by everyone" ON public.artist_media
    FOR SELECT USING (TRUE);

CREATE POLICY "Artists can manage their own media" ON public.artist_media
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.artist_profiles
            WHERE id = artist_media.artist_id AND user_id = auth.uid()
        )
    );

-- Policies for follows
CREATE POLICY "Follows are viewable by everyone" ON public.follows
    FOR SELECT USING (TRUE);

CREATE POLICY "Users can manage their own follows" ON public.follows
    FOR ALL USING (auth.uid() = follower_id);

-- Link submissions to artists (optional but recommended)
ALTER TABLE public.submissions ADD COLUMN IF NOT EXISTS artist_id UUID REFERENCES public.artist_profiles(id) ON DELETE SET NULL;

-- Trigger for updated_at on artist_profiles
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_artist_profile_updated_at
    BEFORE UPDATE ON public.artist_profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

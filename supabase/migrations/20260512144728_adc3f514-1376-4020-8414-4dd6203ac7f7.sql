CREATE TABLE public.event_reviews (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID NOT NULL REFERENCES public.submissions(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  user_name TEXT DEFAULT 'Anônimo',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.event_reviews ENABLE ROW LEVEL SECURITY;

-- Allow public read access
CREATE POLICY "Reviews are viewable by everyone" 
ON public.event_reviews 
FOR SELECT 
USING (true);

-- Allow public insert access (for anonymous reviews)
CREATE POLICY "Anyone can leave a review" 
ON public.event_reviews 
FOR INSERT 
WITH CHECK (true);

-- Create an index for performance
CREATE INDEX idx_event_reviews_event_id ON public.event_reviews(event_id);

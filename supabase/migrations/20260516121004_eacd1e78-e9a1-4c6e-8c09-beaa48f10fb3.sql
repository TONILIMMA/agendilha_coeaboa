-- Update RLS for submissions (events)
-- First drop existing insert policy if it's too permissive
DROP POLICY IF EXISTS "Anyone can submit" ON public.submissions;
DROP POLICY IF EXISTS "Public can insert" ON public.submissions;
DROP POLICY IF EXISTS "Authenticated users can insert" ON public.submissions;
DROP POLICY IF EXISTS "Users can create their own submissions" ON public.submissions;

-- Create new policy for submissions: only admins and promoters (collaborators)
CREATE POLICY "Admins and promoters can insert submissions" 
ON public.submissions FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'promoter')
  ) 
  OR 
  EXISTS (
    SELECT 1 FROM public.collaborators 
    WHERE user_id = auth.uid() 
    AND is_active = true
  )
);

-- Similarly for update/delete
CREATE POLICY "Admins and promoters can update submissions" 
ON public.submissions FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'promoter')
  )
  OR
  EXISTS (
    SELECT 1 FROM public.collaborators 
    WHERE user_id = auth.uid() 
    AND can_edit = true 
    AND is_active = true
  )
);

CREATE POLICY "Admins and promoters can delete submissions" 
ON public.submissions FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'promoter')
  )
  OR
  EXISTS (
    SELECT 1 FROM public.collaborators 
    WHERE user_id = auth.uid() 
    AND can_delete = true 
    AND is_active = true
  )
);

-- Ensure public can still select published submissions
DROP POLICY IF EXISTS "Anyone can view published submissions" ON public.submissions;
CREATE POLICY "Anyone can view published submissions" 
ON public.submissions FOR SELECT 
USING (status = 'published' OR (auth.uid() = user_id));

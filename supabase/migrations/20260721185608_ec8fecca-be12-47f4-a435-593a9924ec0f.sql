
-- Remove PII exposure via base submissions table.
-- Public reads must go through the public_submissions view (which excludes email/phone/responsible_name).

-- 1) Drop the SELECT policy that exposes all columns of published/approved rows to any authenticated user.
DROP POLICY IF EXISTS "Authenticated users can view published submissions" ON public.submissions;

-- 2) Make the public view safe by running with owner privileges (bypasses base RLS)
--    while continuing to only expose the non-PII columns already selected in its definition.
ALTER VIEW public.public_submissions SET (security_invoker = off);

-- 3) Grant SELECT on the safe view to anon and authenticated so public pages can read it.
GRANT SELECT ON public.public_submissions TO anon, authenticated;

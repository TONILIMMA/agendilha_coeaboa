
-- Add is_active to collaborators
ALTER TABLE public.collaborators ADD COLUMN is_active boolean NOT NULL DEFAULT true;

-- Create event audit log table
CREATE TABLE public.event_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL,
  user_id uuid NOT NULL,
  action text NOT NULL,
  notes text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.event_audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can insert audit logs"
ON public.event_audit_log
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all audit logs"
ON public.event_audit_log
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin') OR has_permission(auth.uid(), 'approve') OR has_permission(auth.uid(), 'edit'));

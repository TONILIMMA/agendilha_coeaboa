
-- Create the update_updated_at_column function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create collaborators table
CREATE TABLE public.collaborators (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  name text NOT NULL,
  email text,
  role_title text NOT NULL DEFAULT 'Colaborador',
  can_submit boolean NOT NULL DEFAULT true,
  can_approve boolean NOT NULL DEFAULT false,
  can_edit boolean NOT NULL DEFAULT false,
  can_delete boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

ALTER TABLE public.collaborators ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view all collaborators"
  ON public.collaborators FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert collaborators"
  ON public.collaborators FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update collaborators"
  ON public.collaborators FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete collaborators"
  ON public.collaborators FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can view own collaborator record"
  ON public.collaborators FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- Function to check collaborator permissions
CREATE OR REPLACE FUNCTION public.has_permission(_user_id uuid, _permission text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.collaborators
    WHERE user_id = _user_id
    AND (
      (_permission = 'submit' AND can_submit = true) OR
      (_permission = 'approve' AND can_approve = true) OR
      (_permission = 'edit' AND can_edit = true) OR
      (_permission = 'delete' AND can_delete = true)
    )
  ) OR public.has_role(_user_id, 'admin')
$$;

-- Trigger for updated_at
CREATE TRIGGER update_collaborators_updated_at
  BEFORE UPDATE ON public.collaborators
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

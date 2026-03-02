
-- Enable RLS on client_invitations
ALTER TABLE public.client_invitations ENABLE ROW LEVEL SECURITY;

-- Users can view their own invitations
CREATE POLICY "Users can view own invitations"
ON public.client_invitations
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Admins can manage all invitations
CREATE POLICY "Admins can manage all invitations"
ON public.client_invitations
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

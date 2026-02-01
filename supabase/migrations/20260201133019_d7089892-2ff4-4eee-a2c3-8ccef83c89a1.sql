-- Create table to store client invitation tokens with 24-hour expiry
CREATE TABLE public.client_invitations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  email TEXT NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + interval '24 hours'),
  used_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.client_invitations ENABLE ROW LEVEL SECURITY;

-- Allow the edge function (service role) to manage tokens
-- No user-facing policies needed since this is only accessed via edge functions

-- Create index for fast token lookups
CREATE INDEX idx_client_invitations_token ON public.client_invitations(token);
CREATE INDEX idx_client_invitations_user_id ON public.client_invitations(user_id);
-- Drop existing SELECT policies on profiles
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;

-- Create new PERMISSIVE policies that explicitly require authentication
-- Admins can view all profiles (including emails)
CREATE POLICY "Admins can view all profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- Users can view their own profile only
CREATE POLICY "Users can view own profile"
ON public.profiles
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Explicitly deny anonymous access (belt and suspenders)
-- The 'TO authenticated' above already handles this, but this makes it explicit
CREATE POLICY "Block anonymous access"
ON public.profiles
FOR SELECT
TO anon
USING (false);
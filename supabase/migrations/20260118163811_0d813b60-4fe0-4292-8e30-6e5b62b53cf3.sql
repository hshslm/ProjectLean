-- Fix PUBLIC_USER_DATA: profiles table allows anonymous access
-- Add a RESTRICTIVE policy that requires authentication for all SELECT operations
CREATE POLICY "Require authentication for profiles"
ON public.profiles
AS RESTRICTIVE
FOR SELECT
USING (auth.uid() IS NOT NULL);

-- Fix EXPOSED_SENSITIVE_DATA: notification_settings table allows anonymous access  
-- Add a RESTRICTIVE policy that requires authentication for all SELECT operations
CREATE POLICY "Require authentication for notification_settings"
ON public.notification_settings
AS RESTRICTIVE
FOR SELECT
USING (auth.uid() IS NOT NULL);
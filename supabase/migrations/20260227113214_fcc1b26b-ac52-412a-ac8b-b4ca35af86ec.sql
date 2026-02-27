
-- Drop restrictive policies and recreate as permissive
DROP POLICY IF EXISTS "Users can view own coaching responses" ON public.coaching_responses;
DROP POLICY IF EXISTS "Users can insert own coaching responses" ON public.coaching_responses;
DROP POLICY IF EXISTS "Admins can view all coaching responses" ON public.coaching_responses;

CREATE POLICY "Users can view own coaching responses" ON public.coaching_responses FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own coaching responses" ON public.coaching_responses FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can view all coaching responses" ON public.coaching_responses FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));

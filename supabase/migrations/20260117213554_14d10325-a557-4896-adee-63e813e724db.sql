-- Fix meal_logs table - recreate policies as PERMISSIVE
DROP POLICY IF EXISTS "Users can view own meal logs" ON public.meal_logs;
DROP POLICY IF EXISTS "Users can insert own meal logs" ON public.meal_logs;
DROP POLICY IF EXISTS "Users can update own meal logs" ON public.meal_logs;
DROP POLICY IF EXISTS "Users can delete own meal logs" ON public.meal_logs;
DROP POLICY IF EXISTS "Admins can view all meal logs" ON public.meal_logs;
DROP POLICY IF EXISTS "Admins can manage all meal logs" ON public.meal_logs;

CREATE POLICY "Users can view own meal logs" ON public.meal_logs
FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own meal logs" ON public.meal_logs
FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own meal logs" ON public.meal_logs
FOR UPDATE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own meal logs" ON public.meal_logs
FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all meal logs" ON public.meal_logs
FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage all meal logs" ON public.meal_logs
FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Fix meal_templates table
DROP POLICY IF EXISTS "Users can view own templates" ON public.meal_templates;
DROP POLICY IF EXISTS "Users can insert own templates" ON public.meal_templates;
DROP POLICY IF EXISTS "Users can update own templates" ON public.meal_templates;
DROP POLICY IF EXISTS "Users can delete own templates" ON public.meal_templates;

CREATE POLICY "Users can view own templates" ON public.meal_templates
FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own templates" ON public.meal_templates
FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own templates" ON public.meal_templates
FOR UPDATE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own templates" ON public.meal_templates
FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Fix user_goals table
DROP POLICY IF EXISTS "Users can view own goals" ON public.user_goals;
DROP POLICY IF EXISTS "Users can insert own goals" ON public.user_goals;
DROP POLICY IF EXISTS "Users can update own goals" ON public.user_goals;
DROP POLICY IF EXISTS "Users can delete own goals" ON public.user_goals;

CREATE POLICY "Users can view own goals" ON public.user_goals
FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own goals" ON public.user_goals
FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own goals" ON public.user_goals
FOR UPDATE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own goals" ON public.user_goals
FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Fix notification_settings table
DROP POLICY IF EXISTS "Users can view own notifications" ON public.notification_settings;
DROP POLICY IF EXISTS "Users can insert own notifications" ON public.notification_settings;
DROP POLICY IF EXISTS "Users can update own notifications" ON public.notification_settings;
DROP POLICY IF EXISTS "Users can delete own notifications" ON public.notification_settings;

CREATE POLICY "Users can view own notifications" ON public.notification_settings
FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own notifications" ON public.notification_settings
FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications" ON public.notification_settings
FOR UPDATE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own notifications" ON public.notification_settings
FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Fix user_roles table - only admins should see roles
DROP POLICY IF EXISTS "Users can view own role" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can view all roles" ON public.user_roles;

CREATE POLICY "Users can view own role" ON public.user_roles
FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all roles" ON public.user_roles
FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
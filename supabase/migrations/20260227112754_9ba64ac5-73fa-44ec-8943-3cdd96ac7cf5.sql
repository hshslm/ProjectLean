
CREATE TABLE public.coaching_responses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  checkin_id UUID NOT NULL,
  checkin_date DATE NOT NULL,
  response_text TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.coaching_responses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own coaching responses" ON public.coaching_responses
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own coaching responses" ON public.coaching_responses
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all coaching responses" ON public.coaching_responses
  FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));

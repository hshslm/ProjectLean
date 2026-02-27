
-- Daily check-ins table for habit tracking + cognitive patterns
CREATE TABLE public.daily_checkins (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  checkin_date DATE NOT NULL DEFAULT CURRENT_DATE,
  -- Habit tracking
  protein_hit BOOLEAN NOT NULL DEFAULT false,
  steps_hit BOOLEAN NOT NULL DEFAULT false,
  training_hit BOOLEAN NOT NULL DEFAULT false,
  sleep_hit BOOLEAN NOT NULL DEFAULT false,
  aligned_eating_hit BOOLEAN NOT NULL DEFAULT false,
  -- Cognitive patterns (multi-select, max 2)
  cognitive_patterns TEXT[] NOT NULL DEFAULT '{}',
  -- Mood/stress for AI analysis
  mood_score INTEGER,
  stress_score INTEGER,
  -- Reset protocol
  reset_protocol_used BOOLEAN NOT NULL DEFAULT false,
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  -- One check-in per user per day
  UNIQUE(user_id, checkin_date)
);

-- RLS
ALTER TABLE public.daily_checkins ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own checkins" ON public.daily_checkins
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own checkins" ON public.daily_checkins
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own checkins" ON public.daily_checkins
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own checkins" ON public.daily_checkins
  FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all checkins" ON public.daily_checkins
  FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));

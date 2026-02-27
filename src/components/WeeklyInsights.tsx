import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { format, subDays } from 'date-fns';
import { Flame, Brain, TrendingUp, SmilePlus, Zap } from 'lucide-react';

interface CheckInDay {
  checkin_date: string;
  protein_hit: boolean;
  steps_hit: boolean;
  training_hit: boolean;
  sleep_hit: boolean;
  aligned_eating_hit: boolean;
  cognitive_patterns: string[];
  mood_score: number | null;
  stress_score: number | null;
  reset_protocol_used: boolean;
}

const HABIT_LABELS: Record<string, string> = {
  protein_hit: 'Protein',
  steps_hit: 'Steps',
  training_hit: 'Training',
  sleep_hit: 'Sleep',
  aligned_eating_hit: 'Aligned Eating',
};

const PATTERN_LABELS: Record<string, string> = {
  'all-or-nothing': 'All-or-nothing',
  'ruined-day': '"Ruined the day"',
  'start-tomorrow': '"Start tomorrow"',
  'emotional-eating': 'Emotional eating',
  'social-pressure': 'Social pressure',
  'perfectionism': 'Perfectionism',
  'scale-anxiety': 'Scale anxiety',
  'over-restricting': 'Over-restricting',
};

const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

interface WeeklyInsightsProps {
  userId: string;
}

export const WeeklyInsights: React.FC<WeeklyInsightsProps> = ({ userId }) => {
  const [data, setData] = useState<CheckInDay[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchWeeklyData();
  }, [userId]);

  const fetchWeeklyData = async () => {
    setIsLoading(true);
    const startDate = format(subDays(new Date(), 6), 'yyyy-MM-dd');
    const endDate = format(new Date(), 'yyyy-MM-dd');

    const { data: checkins } = await (supabase
      .from('daily_checkins' as any)
      .select('*')
      .eq('user_id', userId)
      .gte('checkin_date', startDate)
      .lte('checkin_date', endDate)
      .order('checkin_date', { ascending: true }) as any);

    setData(checkins || []);
    setIsLoading(false);
  };

  if (isLoading) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">Loading insights...</p>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="text-center py-12">
        <TrendingUp className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
        <p className="text-muted-foreground text-sm">No check-in data yet this week.</p>
        <p className="text-muted-foreground text-xs mt-1">Complete daily check-ins to see your trends.</p>
      </div>
    );
  }

  // --- Calculations ---
  const daysTracked = data.length;

  // Habit completion rates
  const habitKeys = ['protein_hit', 'steps_hit', 'training_hit', 'sleep_hit', 'aligned_eating_hit'] as const;
  const habitRates = habitKeys.map(key => ({
    key,
    label: HABIT_LABELS[key],
    count: data.filter(d => d[key]).length,
    rate: Math.round((data.filter(d => d[key]).length / daysTracked) * 100),
  }));

  // Current streak (consecutive days with 3+ habits)
  let currentStreak = 0;
  for (let i = data.length - 1; i >= 0; i--) {
    const day = data[i];
    const habitsHit = habitKeys.filter(k => day[k]).length;
    if (habitsHit >= 3) {
      currentStreak++;
    } else {
      break;
    }
  }

  // Average habits per day
  const avgHabits = data.reduce((sum, day) => {
    return sum + habitKeys.filter(k => day[k]).length;
  }, 0) / daysTracked;

  // Pattern frequency
  const patternCounts: Record<string, number> = {};
  data.forEach(day => {
    (day.cognitive_patterns || []).forEach(p => {
      if (p !== 'none') {
        patternCounts[p] = (patternCounts[p] || 0) + 1;
      }
    });
  });
  const sortedPatterns = Object.entries(patternCounts)
    .sort(([, a], [, b]) => b - a);
  const cleanDays = data.filter(d =>
    d.cognitive_patterns?.length === 1 && d.cognitive_patterns[0] === 'none'
  ).length;

  // Mood & Stress averages
  const moodDays = data.filter(d => d.mood_score !== null);
  const stressDays = data.filter(d => d.stress_score !== null);
  const avgMood = moodDays.length > 0
    ? (moodDays.reduce((s, d) => s + (d.mood_score || 0), 0) / moodDays.length)
    : null;
  const avgStress = stressDays.length > 0
    ? (stressDays.reduce((s, d) => s + (d.stress_score || 0), 0) / stressDays.length)
    : null;

  // Reset protocol usage
  const resetCount = data.filter(d => d.reset_protocol_used).length;

  // Build 7-day grid data
  const today = new Date();
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const date = subDays(today, 6 - i);
    const dateStr = format(date, 'yyyy-MM-dd');
    const dayData = data.find(d => d.checkin_date === dateStr);
    return {
      label: format(date, 'EEE'),
      date: dateStr,
      data: dayData,
      habitsHit: dayData ? habitKeys.filter(k => dayData[k]).length : 0,
    };
  });

  return (
    <div className="space-y-4">
      {/* Overview Stats */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="text-center">
          <CardContent className="pt-4 pb-3 px-2">
            <Flame className="w-5 h-5 text-primary mx-auto mb-1" />
            <p className="text-2xl font-bold text-foreground">{currentStreak}</p>
            <p className="text-[10px] text-muted-foreground">Day Streak</p>
          </CardContent>
        </Card>
        <Card className="text-center">
          <CardContent className="pt-4 pb-3 px-2">
            <Zap className="w-5 h-5 text-primary mx-auto mb-1" />
            <p className="text-2xl font-bold text-foreground">{avgHabits.toFixed(1)}</p>
            <p className="text-[10px] text-muted-foreground">Avg Habits/Day</p>
          </CardContent>
        </Card>
        <Card className="text-center">
          <CardContent className="pt-4 pb-3 px-2">
            <TrendingUp className="w-5 h-5 text-primary mx-auto mb-1" />
            <p className="text-2xl font-bold text-foreground">{daysTracked}/7</p>
            <p className="text-[10px] text-muted-foreground">Days Tracked</p>
          </CardContent>
        </Card>
      </div>

      {/* 7-Day Habit Grid */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold">7-Day Habit Map</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-7 gap-1.5 mb-3">
            {weekDays.map(day => (
              <div key={day.date} className="text-center">
                <p className="text-[10px] text-muted-foreground mb-1">{day.label}</p>
                <div
                  className={`w-full aspect-square rounded-lg flex items-center justify-center text-xs font-bold transition-colors ${
                    !day.data
                      ? 'bg-muted text-muted-foreground'
                      : day.habitsHit >= 4
                        ? 'bg-primary text-primary-foreground'
                        : day.habitsHit >= 2
                          ? 'bg-primary/30 text-foreground'
                          : 'bg-destructive/20 text-destructive'
                  }`}
                >
                  {day.data ? `${day.habitsHit}` : '—'}
                </div>
              </div>
            ))}
          </div>
          <div className="flex items-center justify-center gap-4 text-[10px] text-muted-foreground">
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded bg-primary inline-block" /> 4-5
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded bg-primary/30 inline-block" /> 2-3
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded bg-destructive/20 inline-block" /> 0-1
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Individual Habit Rates */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold">Habit Completion</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {habitRates.map(habit => (
            <div key={habit.key}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm text-foreground">{habit.label}</span>
                <span className="text-xs text-muted-foreground">{habit.count}/{daysTracked} days ({habit.rate}%)</span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full transition-all duration-500"
                  style={{ width: `${habit.rate}%` }}
                />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Mood & Stress Trends */}
      {(avgMood !== null || avgStress !== null) && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <SmilePlus className="w-4 h-4 text-primary" />
              <CardTitle className="text-base font-semibold">Mood & Stress</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            {/* Mini bar chart for mood/stress per day */}
            <div className="space-y-4">
              {/* Mood trend */}
              {avgMood !== null && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-foreground">Mood</span>
                    <span className="text-xs text-muted-foreground">Avg: {avgMood.toFixed(1)}/10</span>
                  </div>
                  <div className="grid grid-cols-7 gap-1.5 items-end h-16">
                    {weekDays.map(day => {
                      const score = day.data?.mood_score;
                      const height = score ? (score / 10) * 100 : 0;
                      return (
                        <div key={day.date} className="flex flex-col items-center h-full justify-end">
                          {score ? (
                            <div
                              className="w-full rounded-t bg-primary/60 transition-all duration-300"
                              style={{ height: `${height}%` }}
                            />
                          ) : (
                            <div className="w-full h-1 rounded bg-muted" />
                          )}
                          <span className="text-[9px] text-muted-foreground mt-1">{score || '—'}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Stress trend */}
              {avgStress !== null && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-foreground">Stress</span>
                    <span className="text-xs text-muted-foreground">Avg: {avgStress.toFixed(1)}/10</span>
                  </div>
                  <div className="grid grid-cols-7 gap-1.5 items-end h-16">
                    {weekDays.map(day => {
                      const score = day.data?.stress_score;
                      const height = score ? (score / 10) * 100 : 0;
                      return (
                        <div key={day.date} className="flex flex-col items-center h-full justify-end">
                          {score ? (
                            <div
                              className="w-full rounded-t bg-destructive/50 transition-all duration-300"
                              style={{ height: `${height}%` }}
                            />
                          ) : (
                            <div className="w-full h-1 rounded bg-muted" />
                          )}
                          <span className="text-[9px] text-muted-foreground mt-1">{score || '—'}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Cognitive Patterns */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Brain className="w-4 h-4 text-primary" />
            <CardTitle className="text-base font-semibold">Pattern Frequency</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          {sortedPatterns.length > 0 ? (
            <div className="space-y-2">
              {sortedPatterns.map(([pattern, count]) => (
                <div key={pattern} className="flex items-center justify-between">
                  <span className="text-sm text-foreground">
                    {PATTERN_LABELS[pattern] || pattern}
                  </span>
                  <Badge variant="secondary" className="text-xs">
                    {count}x
                  </Badge>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No negative patterns this week.</p>
          )}
          {cleanDays > 0 && (
            <p className="text-xs text-primary mt-3 font-medium">
              {cleanDays} clean day{cleanDays > 1 ? 's' : ''} with no negative patterns
            </p>
          )}
          {resetCount > 0 && (
            <p className="text-xs text-muted-foreground mt-1">
              Reset Protocol used {resetCount}x this week
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

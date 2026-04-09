import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { format, subDays } from 'date-fns';
import { Flame, Brain, TrendingUp, SmilePlus, Zap, HeartPulse, Trophy, Shield, AlertTriangle, Target, Sparkles, MessageSquareText, Loader2, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { invokeEdgeFunction } from '@/lib/edge-functions';
import ReactMarkdown from 'react-markdown';
import SkeletonCard from '@/components/SkeletonCard';

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
  const [aiSummary, setAiSummary] = useState<string | null>(null);
  const [isSummaryLoading, setIsSummaryLoading] = useState(false);

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
      <div className="space-y-3">
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
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

  // --- Recovery Score ---
  // A "bad day" = 0-1 habits OR has negative patterns (not 'none')
  // Recovery = bouncing back the next day to 3+ habits
  const NEGATIVE_PATTERNS = ['all-or-nothing', 'ruined-day', 'emotional-eating', 'start-tomorrow', 'over-restricting'];
  
  let recoveryOpportunities = 0;
  let recoveries = 0;
  let resetBonus = 0;

  for (let i = 0; i < data.length - 1; i++) {
    const day = data[i];
    const nextDay = data[i + 1];
    const dayHabits = habitKeys.filter(k => day[k]).length;
    const hasNegativePattern = (day.cognitive_patterns || []).some(p => NEGATIVE_PATTERNS.includes(p));
    const isBadDay = dayHabits <= 1 || hasNegativePattern;

    if (isBadDay) {
      recoveryOpportunities++;
      const nextDayHabits = habitKeys.filter(k => nextDay[k]).length;
      if (nextDayHabits >= 3) {
        recoveries++;
      }
      if (day.reset_protocol_used) {
        resetBonus++;
      }
    }
  }

  // Also check if the last day itself had a reset protocol (bonus even without next-day data)
  const lastDay = data[data.length - 1];
  if (lastDay?.reset_protocol_used) {
    const lastDayHabits = habitKeys.filter(k => lastDay[k]).length;
    const hasNeg = (lastDay.cognitive_patterns || []).some(p => NEGATIVE_PATTERNS.includes(p));
    if ((lastDayHabits <= 1 || hasNeg) && recoveryOpportunities === 0) {
      // Edge case: only one bad day, no next day yet
    }
  }

  let recoveryScore: number | null = null;
  let recoveryLabel = '';
  let recoveryColor = '';

  if (recoveryOpportunities > 0) {
    // Base: % of successful recoveries. Reset bonus adds up to 15 points.
    const baseScore = (recoveries / recoveryOpportunities) * 85;
    const bonusScore = Math.min((resetBonus / recoveryOpportunities) * 15, 15);
    recoveryScore = Math.round(baseScore + bonusScore);
  } else if (daysTracked >= 2) {
    // No bad days = perfect recovery
    recoveryScore = 100;
  }

  if (recoveryScore !== null) {
    if (recoveryScore >= 80) { recoveryLabel = 'Elite'; recoveryColor = 'text-primary'; }
    else if (recoveryScore >= 60) { recoveryLabel = 'Strong'; recoveryColor = 'text-primary'; }
    else if (recoveryScore >= 40) { recoveryLabel = 'Building'; recoveryColor = 'text-amber-600'; }
    else { recoveryLabel = 'Developing'; recoveryColor = 'text-destructive'; }
  }

  // --- Weekly Behavior Theme ---
  type WeeklyTheme = {
    label: string;
    description: string;
    icon: React.ReactNode;
    colorClass: string;
    bgClass: string;
  };

  const detectWeeklyTheme = (): WeeklyTheme => {
    const avgHabitsPerDay = avgHabits;
    const hasHighConsistency = avgHabitsPerDay >= 3.5 && daysTracked >= 5;
    const hasRecovery = recoveryScore !== null && recoveryScore >= 60 && recoveryOpportunities >= 2;
    const hasHighStress = avgStress !== null && avgStress >= 6;
    const hasLowMood = avgMood !== null && avgMood <= 4;
    const hasManyPatterns = sortedPatterns.length >= 3 || Object.values(patternCounts).reduce((a, b) => a + b, 0) >= 5;
    const perfectWeek = avgHabitsPerDay >= 4.5 && daysTracked >= 6 && sortedPatterns.length === 0;
    const buildingWeek = avgHabitsPerDay >= 2 && avgHabitsPerDay < 3.5 && daysTracked >= 4;

    if (perfectWeek) {
      return { label: 'Perfect Week', description: 'Crushed every habit — elite consistency.', icon: <Trophy className="w-5 h-5" />, colorClass: 'text-primary', bgClass: 'bg-primary/10 border-primary/20' };
    }
    if (hasHighConsistency) {
      return { label: 'Consistency Week', description: 'Strong habits across the board — keep it rolling.', icon: <Target className="w-5 h-5" />, colorClass: 'text-primary', bgClass: 'bg-primary/10 border-primary/20' };
    }
    if (hasRecovery) {
      return { label: 'Recovery Week', description: 'Bounced back after setbacks — resilience on display.', icon: <Shield className="w-5 h-5" />, colorClass: 'text-primary', bgClass: 'bg-primary/10 border-primary/20' };
    }
    if (hasHighStress || hasLowMood) {
      return { label: 'Stress Week', description: 'Tough week mentally — focus on basics and self-care.', icon: <AlertTriangle className="w-5 h-5" />, colorClass: 'text-amber-600', bgClass: 'bg-amber-500/10 border-amber-500/20' };
    }
    if (hasManyPatterns) {
      return { label: 'Pattern Week', description: 'Multiple cognitive patterns surfaced — awareness is step one.', icon: <Brain className="w-5 h-5" />, colorClass: 'text-amber-600', bgClass: 'bg-amber-500/10 border-amber-500/20' };
    }
    if (buildingWeek) {
      return { label: 'Building Week', description: 'Making progress — small gains add up.', icon: <Sparkles className="w-5 h-5" />, colorClass: 'text-primary', bgClass: 'bg-primary/10 border-primary/20' };
    }
    return { label: 'Getting Started', description: 'Keep checking in to unlock your weekly theme.', icon: <Zap className="w-5 h-5" />, colorClass: 'text-muted-foreground', bgClass: 'bg-muted border-border' };
  };

  const weeklyTheme = detectWeeklyTheme();

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

  const generateSummary = async () => {
    setIsSummaryLoading(true);
    try {
      const { data: fnData, status, error } = await invokeEdgeFunction('weekly-summary', {
        weekData: data,
        weeklyTheme: weeklyTheme.label,
        recoveryScore,
        recoveryOpportunities,
        recoveries,
      });
      if (error) {
        console.error('Summary error:', status, error);
        toast.error(error);
        return;
      }
      setAiSummary(fnData.summary);
    } catch (e: any) {
      console.error('Summary error:', e);
      if (!navigator.onLine) {
        toast.error('You\'re offline. Please check your connection.');
      } else {
        toast.error('Connection error. Could not generate summary.');
      }
    } finally {
      setIsSummaryLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Weekly Behavior Theme Banner */}
      <Card className={`border ${weeklyTheme.bgClass}`}>
        <CardContent className="py-4 px-4 flex items-center gap-3">
          <div className={weeklyTheme.colorClass}>{weeklyTheme.icon}</div>
          <div className="min-w-0">
            <p className={`text-sm font-bold ${weeklyTheme.colorClass}`}>{weeklyTheme.label}</p>
            <p className="text-xs text-muted-foreground">{weeklyTheme.description}</p>
          </div>
        </CardContent>
      </Card>

      {/* AI Coaching Summary */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageSquareText className="w-4 h-4 text-primary" />
              <CardTitle className="text-base font-semibold">Coach's Weekly Summary</CardTitle>
            </div>
            {aiSummary && (
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={generateSummary} disabled={isSummaryLoading}>
                <RefreshCw className={`w-3.5 h-3.5 ${isSummaryLoading ? 'animate-spin' : ''}`} />
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {aiSummary ? (
            <div className="prose prose-sm max-w-none text-foreground [&>p]:mb-3 [&>p:last-child]:mb-0 [&_strong]:text-foreground">
              <ReactMarkdown>{aiSummary}</ReactMarkdown>
            </div>
          ) : (
            <div className="text-center py-2">
              <Button
                onClick={generateSummary}
                disabled={isSummaryLoading}
                variant="outline"
                size="sm"
                className="gap-2"
              >
                {isSummaryLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    Generate AI Summary
                  </>
                )}
              </Button>
              <p className="text-[10px] text-muted-foreground mt-2">Personalized coaching insight powered by AI</p>
            </div>
          )}
        </CardContent>
      </Card>
      <div className="grid grid-cols-2 gap-3">
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
        <Card className="text-center">
          <CardContent className="pt-4 pb-3 px-2">
            <HeartPulse className="w-5 h-5 text-primary mx-auto mb-1" />
            {recoveryScore !== null ? (
              <>
                <p className={`text-2xl font-bold ${recoveryColor}`}>{recoveryScore}</p>
                <p className="text-[10px] text-muted-foreground">Recovery Score</p>
              </>
            ) : (
              <>
                <p className="text-2xl font-bold text-muted-foreground">—</p>
                <p className="text-[10px] text-muted-foreground">Recovery Score</p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recovery Score Detail */}
      {recoveryScore !== null && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <HeartPulse className="w-4 h-4 text-primary" />
                <CardTitle className="text-base font-semibold">Recovery Score</CardTitle>
              </div>
              <Badge variant="secondary" className={`text-xs ${recoveryColor}`}>
                {recoveryLabel}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            {/* Score bar */}
            <div className="h-3 bg-muted rounded-full overflow-hidden mb-3">
              <div
                className={`h-full rounded-full transition-all duration-700 ${
                  recoveryScore >= 60 ? 'bg-primary' : recoveryScore >= 40 ? 'bg-amber-500' : 'bg-destructive'
                }`}
                style={{ width: `${recoveryScore}%` }}
              />
            </div>
            <div className="space-y-1.5 text-xs text-muted-foreground">
              {recoveryOpportunities > 0 ? (
                <>
                  <p>Bounced back {recoveries} out of {recoveryOpportunities} tough day{recoveryOpportunities > 1 ? 's' : ''}</p>
                  {resetBonus > 0 && (
                    <p className="text-primary">+{resetBonus} Reset Protocol bonus{resetBonus > 1 ? 'es' : ''}</p>
                  )}
                </>
              ) : (
                <p>No tough days this week — perfect consistency.</p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

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

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { Check, Dumbbell, Footprints, Moon, Utensils, Beef, ChevronLeft, ChevronRight, Brain, Loader2, MessageSquare, AlertTriangle, ClipboardCheck } from 'lucide-react';
import { ResetProtocol } from './ResetProtocol';
import SkeletonCard from '@/components/SkeletonCard';
import { PaywallModal } from '@/components/PaywallModal';
import { useSubscription } from '@/hooks/useSubscription';
import { format, isToday, addDays, subDays } from 'date-fns';

const COGNITIVE_PATTERNS = [
  { id: 'all-or-nothing', label: 'All-or-nothing thinking' },
  { id: 'ruined-day', label: '"I already ruined the day"' },
  { id: 'start-tomorrow', label: '"I\'ll start tomorrow / Monday"' },
  { id: 'emotional-eating', label: 'Emotional eating (stress)' },
  { id: 'social-pressure', label: 'Social pressure' },
  { id: 'perfectionism', label: 'Perfectionism' },
  { id: 'scale-anxiety', label: 'Scale anxiety' },
  { id: 'over-restricting', label: 'Over-restricting / compensating' },
  { id: 'none', label: 'No negative pattern today' },
] as const;

const HABITS = [
  { key: 'protein_hit' as const, label: 'Protein', icon: Beef },
  { key: 'steps_hit' as const, label: 'Steps', icon: Footprints },
  { key: 'training_hit' as const, label: 'Training', icon: Dumbbell },
  { key: 'sleep_hit' as const, label: 'Sleep', icon: Moon },
  { key: 'aligned_eating_hit' as const, label: 'Aligned Eating', icon: Utensils },
] as const;

type HabitKey = typeof HABITS[number]['key'];

interface CheckInData {
  id?: string;
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

interface DailyCheckInProps {
  userId: string;
}

export const DailyCheckIn: React.FC<DailyCheckInProps> = ({ userId }) => {
  const { canCheckIn, openPaymentLink, refetch: refetchSubscription } = useSubscription();
  const [showPaywall, setShowPaywall] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [checkin, setCheckin] = useState<CheckInData>({
    protein_hit: false,
    steps_hit: false,
    training_hit: false,
    sleep_hit: false,
    aligned_eating_hit: false,
    cognitive_patterns: [],
    mood_score: null,
    stress_score: null,
    reset_protocol_used: false,
  });
  const [existingId, setExistingId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  
  // AI Coaching state
  const [coachingResponse, setCoachingResponse] = useState<string | null>(null);
  const [isLoadingCoaching, setIsLoadingCoaching] = useState(false);
  const [stressStreak, setStressStreak] = useState(0);

  useEffect(() => {
    fetchCheckin();
  }, [selectedDate, userId]);

  const fetchCheckin = async () => {
    setIsLoading(true);
    const dateStr = format(selectedDate, 'yyyy-MM-dd');
    const threeDaysAgo = format(subDays(selectedDate, 3), 'yyyy-MM-dd');
    
    // Fetch check-in, coaching response, and recent stress history in parallel
    const [checkinResult, coachingResult, stressHistoryResult] = await Promise.all([
      (supabase
        .from('daily_checkins' as any)
        .select('*')
        .eq('user_id', userId)
        .eq('checkin_date', dateStr)
        .maybeSingle() as any),
      (supabase
        .from('coaching_responses' as any)
        .select('response_text')
        .eq('user_id', userId)
        .eq('checkin_date', dateStr)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle() as any),
      (supabase
        .from('daily_checkins' as any)
        .select('checkin_date, stress_score')
        .eq('user_id', userId)
        .gte('checkin_date', threeDaysAgo)
        .lt('checkin_date', dateStr)
        .order('checkin_date', { ascending: false }) as any),
    ]);

    const { data } = checkinResult;
    const { data: coachingData } = coachingResult;
    const recentStress = stressHistoryResult.data || [];

    // Calculate consecutive high-stress days leading up to selected date
    let streak = 0;
    for (const day of recentStress) {
      if (day.stress_score !== null && day.stress_score >= 7) {
        streak++;
      } else {
        break;
      }
    }
    setStressStreak(streak);

    if (data) {
      setCheckin({
        protein_hit: data.protein_hit,
        steps_hit: data.steps_hit,
        training_hit: data.training_hit,
        sleep_hit: data.sleep_hit,
        aligned_eating_hit: data.aligned_eating_hit,
        cognitive_patterns: data.cognitive_patterns || [],
        mood_score: data.mood_score,
        stress_score: data.stress_score,
        reset_protocol_used: data.reset_protocol_used,
      });
      setExistingId(data.id);
      setHasSubmitted(true);
    } else {
      setCheckin({
        protein_hit: false,
        steps_hit: false,
        training_hit: false,
        sleep_hit: false,
        aligned_eating_hit: false,
        cognitive_patterns: [],
        mood_score: null,
        stress_score: null,
        reset_protocol_used: false,
      });
      setExistingId(null);
      setHasSubmitted(false);
    }

    setCoachingResponse(coachingData?.response_text || null);
    setIsLoading(false);
  };

  const toggleHabit = (key: HabitKey) => {
    setCheckin(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const togglePattern = (patternId: string) => {
    setCheckin(prev => {
      const current = prev.cognitive_patterns;
      if (patternId === 'none') {
        return { ...prev, cognitive_patterns: current.includes('none') ? [] : ['none'] };
      }
      let updated = current.filter(p => p !== 'none');
      if (updated.includes(patternId)) {
        updated = updated.filter(p => p !== patternId);
      } else if (updated.length < 2) {
        updated = [...updated, patternId];
      } else {
        toast.error('Maximum 2 patterns allowed');
        return prev;
      }
      return { ...prev, cognitive_patterns: updated };
    });
  };

  const fetchCoachingResponse = async (checkinData: CheckInData, checkinId: string) => {
    setIsLoadingCoaching(true);
    
    try {
      // Fetch 7-day history for context (relative to selectedDate, not today)
      const sevenDaysAgo = format(subDays(selectedDate, 7), 'yyyy-MM-dd');
      const today = format(selectedDate, 'yyyy-MM-dd');
      
      const { data: history } = await (supabase
        .from('daily_checkins' as any)
        .select('*')
        .eq('user_id', userId)
        .gte('checkin_date', sevenDaysAgo)
        .lt('checkin_date', today)
        .order('checkin_date', { ascending: false }) as any);

      const { data, error } = await supabase.functions.invoke('karim-coach', {
        body: {
          checkin: checkinData,
          history: history || [],
        },
      });

      if (error) throw error;
      if (data.error) throw new Error(data.error);

      const responseText = data.response;
      setCoachingResponse(responseText);

      // Save coaching response to DB
      await (supabase
        .from('coaching_responses' as any)
        .insert({
          user_id: userId,
          checkin_id: checkinId,
          checkin_date: format(selectedDate, 'yyyy-MM-dd'),
          response_text: responseText,
        }) as any);

    } catch (error: any) {
      console.error('Coaching error:', error);
      if (error.message?.includes('Check-in limit') || error.message?.includes('limit reached')) {
        refetchSubscription();
        setShowPaywall(true);
      } else if (error.message?.includes('failed to send request') || error.message?.includes('FetchError')) {
        toast.error('Connection error. Please check your internet and try again.');
      } else if (error.message?.includes('Rate limited')) {
        toast.error('AI coaching is temporarily busy. Try again in a moment.');
      } else {
        toast.error('Could not generate coaching response');
      }
    } finally {
      setIsLoadingCoaching(false);
    }
  };

  const handleSubmit = async () => {
    // Free usage check — only for new check-ins, not updates
    if (!existingId && !canCheckIn) {
      setShowPaywall(true);
      return;
    }

    if (checkin.cognitive_patterns.length === 0) {
      toast.error('Select at least one thought pattern');
      return;
    }

    setIsSaving(true);
    const dateStr = format(selectedDate, 'yyyy-MM-dd');

    const payload = {
      user_id: userId,
      checkin_date: dateStr,
      protein_hit: checkin.protein_hit,
      steps_hit: checkin.steps_hit,
      training_hit: checkin.training_hit,
      sleep_hit: checkin.sleep_hit,
      aligned_eating_hit: checkin.aligned_eating_hit,
      cognitive_patterns: checkin.cognitive_patterns,
      mood_score: checkin.mood_score,
      stress_score: checkin.stress_score,
      reset_protocol_used: checkin.reset_protocol_used,
      updated_at: new Date().toISOString(),
    };

    let error;
    let savedId = existingId;
    
    if (existingId) {
      ({ error } = await (supabase
        .from('daily_checkins' as any)
        .update(payload)
        .eq('id', existingId) as any));
    } else {
      const result = await (supabase
        .from('daily_checkins' as any)
        .insert(payload)
        .select('id')
        .single() as any);
      error = result.error;
      savedId = result.data?.id || null;
    }

    if (error) {
      toast.error('Could not save check-in. Please try again.');
      console.error(error);
      setIsSaving(false);
      return;
    }

    const isNewCheckin = !existingId;

    toast.success(isNewCheckin ? 'Check-in saved' : 'Check-in updated');
    setHasSubmitted(true);
    setExistingId(savedId);
    setIsSaving(false);

    // Trigger AI coaching response BEFORE incrementing counter
    // so the server-side check allows this first free check-in's coaching
    if (savedId) {
      fetchCoachingResponse(checkin, savedId);
    }

    // Increment checkin_count for new check-ins (not updates)
    // Done after coaching fires so the server doesn't block the first free coaching response
    if (isNewCheckin) {
      await supabase.rpc('increment_checkin_count', { uid: userId });
      refetchSubscription();
    }
  };

  const habitsCompleted = HABITS.filter(h => checkin[h.key]).length;
  const TRIGGER_PATTERNS = ['all-or-nothing', 'ruined-day', 'emotional-eating'];
  const hasPatternTrigger = checkin.cognitive_patterns.some(p => TRIGGER_PATTERNS.includes(p));
  // Also trigger Reset Protocol if stress ≥ 8 today AND there's been at least 1 prior high-stress day
  const hasStressTrigger = (checkin.stress_score !== null && checkin.stress_score >= 8 && stressStreak >= 1);
  const showResetProtocol = hasPatternTrigger || hasStressTrigger;

  return (
    <div className="space-y-4">
      {/* Date Navigation */}
      <div className="flex items-center justify-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => setSelectedDate(prev => subDays(prev, 1))}>
          <ChevronLeft className="w-5 h-5" />
        </Button>
        <div className="text-center min-w-[160px]">
          <p className="font-medium text-foreground">
            {isToday(selectedDate) ? 'Today' : format(selectedDate, 'EEEE')}
          </p>
          <p className="text-sm text-muted-foreground">
            {format(selectedDate, 'MMM d, yyyy')}
          </p>
        </div>
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={() => setSelectedDate(prev => addDays(prev, 1))}
          disabled={isToday(selectedDate)}
        >
          <ChevronRight className="w-5 h-5" />
        </Button>
      </div>

      {/* Past date hint */}
      {!isToday(selectedDate) && !isLoading && !hasSubmitted && (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-accent/10 border border-accent/20 text-sm">
          <ClipboardCheck className="w-4 h-4 text-accent flex-shrink-0" />
          <p className="text-foreground">
            Missed this day? You can still log your check-in for <span className="font-medium">{format(selectedDate, 'EEEE, MMM d')}</span>.
          </p>
        </div>
      )}

      {isLoading ? (
        <div className="space-y-3">
          <SkeletonCard />
          <SkeletonCard />
        </div>
      ) : (
        <>
          {/* Karim AI Coaching Response */}
          {(coachingResponse || isLoadingCoaching) && (
            <Card className="border-primary/20 bg-primary/5">
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-primary" />
                  <CardTitle className="text-sm font-semibold text-primary">Karim</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                {isLoadingCoaching ? (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span className="text-sm">Analyzing your check-in...</span>
                  </div>
                ) : (
                  <p className="text-sm text-foreground leading-relaxed">
                    {coachingResponse}
                  </p>
                )}
              </CardContent>
            </Card>
          )}

          {/* Habit Tracking */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold">Daily Habits</CardTitle>
                <Badge variant="secondary" className="text-xs">
                  {habitsCompleted}/5
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-1">
              {HABITS.map(({ key, label, icon: Icon }) => (
                <button
                  key={key}
                  onClick={() => toggleHabit(key)}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all duration-200 ${
                    checkin[key]
                      ? 'bg-primary/10 border border-primary/20'
                      : 'bg-muted/50 border border-transparent hover:bg-muted'
                  }`}
                >
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
                    checkin[key] ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                  }`}>
                    {checkin[key] ? <Check className="w-4 h-4" /> : <Icon className="w-4 h-4" />}
                  </div>
                  <span className={`text-sm font-medium ${
                    checkin[key] ? 'text-foreground' : 'text-muted-foreground'
                  }`}>
                    {label}
                  </span>
                </button>
              ))}
            </CardContent>
          </Card>

          {/* Mood & Stress */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold">How are you feeling?</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-sm text-muted-foreground mb-2 block">Mood (1-10)</Label>
                <div className="flex gap-1">
                  {Array.from({ length: 10 }, (_, i) => i + 1).map(n => (
                    <button
                      key={n}
                      onClick={() => setCheckin(prev => ({ ...prev, mood_score: prev.mood_score === n ? null : n }))}
                      className={`flex-1 h-9 rounded-lg text-xs font-medium transition-all ${
                        checkin.mood_score === n
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted text-muted-foreground hover:bg-muted/80'
                      }`}
                    >
                      {n}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <Label className="text-sm text-muted-foreground mb-2 block">Stress (1-10)</Label>
                <div className="flex gap-1">
                  {Array.from({ length: 10 }, (_, i) => i + 1).map(n => (
                    <button
                      key={n}
                      onClick={() => setCheckin(prev => ({ ...prev, stress_score: prev.stress_score === n ? null : n }))}
                      className={`flex-1 h-9 rounded-lg text-xs font-medium transition-all ${
                        checkin.stress_score === n
                          ? 'bg-destructive text-destructive-foreground'
                          : 'bg-muted text-muted-foreground hover:bg-muted/80'
                      }`}
                    >
                      {n}
                    </button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Cognitive Patterns */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <Brain className="w-4 h-4 text-primary" />
                <CardTitle className="text-base font-semibold">
                  Which thought pattern showed up today?
                </CardTitle>
              </div>
              <p className="text-xs text-muted-foreground">Select up to 2</p>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-1.5">
                {COGNITIVE_PATTERNS.map(pattern => {
                  const isSelected = checkin.cognitive_patterns.includes(pattern.id);
                  const isNone = pattern.id === 'none';
                  return (
                    <button
                      key={pattern.id}
                      onClick={() => togglePattern(pattern.id)}
                      className={`text-left px-3 py-2.5 rounded-xl text-sm transition-all duration-200 border ${
                        isSelected
                          ? isNone
                            ? 'bg-primary/10 border-primary/30 text-foreground font-medium'
                            : 'bg-destructive/10 border-destructive/30 text-foreground font-medium'
                          : 'bg-muted/50 border-transparent text-muted-foreground hover:bg-muted'
                      }`}
                    >
                      {pattern.label}
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Reset Protocol - Enhanced Visibility */}
          {showResetProtocol && (
            <div className="space-y-2">
              {/* Prominent alert banner */}
              {!checkin.reset_protocol_used && (
                <div className="flex items-start gap-3 p-3 rounded-xl bg-destructive/10 border border-destructive/20 animate-in fade-in slide-in-from-top-2 duration-300">
                  <AlertTriangle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-destructive">
                      {hasStressTrigger && !hasPatternTrigger
                        ? `High stress — ${stressStreak + 1} days in a row`
                        : 'Negative pattern detected'}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {hasStressTrigger && !hasPatternTrigger
                        ? 'Sustained stress compounds. Use the Reset Protocol to decompress before it affects your habits.'
                        : 'Use the Reset Protocol below to break the cycle before it spirals.'}
                    </p>
                  </div>
                </div>
              )}
              <ResetProtocol
                onComplete={() => setCheckin(prev => ({ ...prev, reset_protocol_used: true }))}
                isCompleted={checkin.reset_protocol_used}
                defaultExpanded={true}
              />
            </div>
          )}

          {/* Submit */}
          <Button
            variant="coral"
            size="lg"
            className="w-full"
            onClick={handleSubmit}
            disabled={isSaving || isLoadingCoaching}
          >
            {isSaving ? 'Saving...' : isLoadingCoaching ? 'Getting coaching...' : hasSubmitted ? 'Update Check-In' : 'Complete Check-In'}
          </Button>
        </>
      )}
      <PaywallModal
        open={showPaywall}
        onOpenChange={setShowPaywall}
        onSubscribe={() => { openPaymentLink(); setShowPaywall(false); }}
      />
    </div>
  );
};

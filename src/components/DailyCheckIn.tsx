import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { Check, Dumbbell, Footprints, Moon, Utensils, Beef, ChevronLeft, ChevronRight, Brain } from 'lucide-react';
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

  useEffect(() => {
    fetchCheckin();
  }, [selectedDate, userId]);

  const fetchCheckin = async () => {
    setIsLoading(true);
    const dateStr = format(selectedDate, 'yyyy-MM-dd');
    
    const { data, error } = await (supabase
      .from('daily_checkins' as any)
      .select('*')
      .eq('user_id', userId)
      .eq('checkin_date', dateStr)
      .maybeSingle() as any);

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
    setIsLoading(false);
  };

  const toggleHabit = (key: HabitKey) => {
    setCheckin(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const togglePattern = (patternId: string) => {
    setCheckin(prev => {
      const current = prev.cognitive_patterns;
      
      // If "none" is selected, clear everything else
      if (patternId === 'none') {
        return { ...prev, cognitive_patterns: current.includes('none') ? [] : ['none'] };
      }
      
      // If selecting a pattern while "none" is active, remove "none"
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

  const handleSubmit = async () => {
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
    if (existingId) {
      ({ error } = await (supabase
        .from('daily_checkins' as any)
        .update(payload)
        .eq('id', existingId) as any));
    } else {
      ({ error } = await (supabase
        .from('daily_checkins' as any)
        .insert(payload) as any));
    }

    if (error) {
      toast.error('Failed to save check-in');
      console.error(error);
    } else {
      toast.success(existingId ? 'Check-in updated' : 'Check-in saved');
      setHasSubmitted(true);
      fetchCheckin();
    }
    setIsSaving(false);
  };

  const habitsCompleted = HABITS.filter(h => checkin[h.key]).length;

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

      {isLoading ? (
        <div className="text-center py-8">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      ) : (
        <>
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
                <Label className="text-sm text-muted-foreground mb-2 block">
                  Mood (1-10)
                </Label>
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
                <Label className="text-sm text-muted-foreground mb-2 block">
                  Stress (1-10)
                </Label>
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

          {/* Submit */}
          <Button
            variant="coral"
            size="lg"
            className="w-full"
            onClick={handleSubmit}
            disabled={isSaving}
          >
            {isSaving ? 'Saving...' : hasSubmitted ? 'Update Check-In' : 'Complete Check-In'}
          </Button>
        </>
      )}
    </div>
  );
};

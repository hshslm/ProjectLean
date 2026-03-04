import React, { useState, useEffect, useMemo } from 'react';
import { Camera, ClipboardCheck, BarChart3, MessageSquare, LifeBuoy, Target, ArrowRight, X, Calculator, Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import projectLeanLogo from '@/assets/project-lean-logo.png';

const ONBOARDING_KEY = 'project-lean-onboarding-completed';

// --- Goal calculation logic (same as GoalSettings) ---
type Sex = 'male' | 'female';
type ActivityLevel = 'sedentary' | 'light' | 'moderate' | 'very_active';
type GoalType = 'fat_loss' | 'maintenance' | 'lean_gain';

const ACTIVITY_LABELS: Record<ActivityLevel, string> = {
  sedentary: 'Sedentary (desk job)',
  light: 'Lightly active (1-3x/week)',
  moderate: 'Moderately active (3-5x/week)',
  very_active: 'Very active (6-7x/week)',
};
const ACTIVITY_MULTIPLIERS: Record<ActivityLevel, number> = {
  sedentary: 1.2, light: 1.375, moderate: 1.55, very_active: 1.725,
};
const GOAL_LABELS: Record<GoalType, string> = {
  fat_loss: 'Fat loss', maintenance: 'Maintenance', lean_gain: 'Lean gain',
};
const GOAL_ADJUSTMENTS: Record<GoalType, number> = {
  fat_loss: -500, maintenance: 0, lean_gain: 250,
};

function calculateCalories(w: number, h: number, a: number, s: Sex, al: ActivityLevel, gt: GoalType) {
  const bmr = s === 'male' ? 10*w + 6.25*h - 5*a + 5 : 10*w + 6.25*h - 5*a - 161;
  return Math.round(bmr * ACTIVITY_MULTIPLIERS[al] + GOAL_ADJUSTMENTS[gt]);
}
function calculateProtein(w: number, gt: GoalType) {
  const m = gt === 'fat_loss' ? 2.0 : gt === 'lean_gain' ? 1.8 : 1.6;
  return Math.round(w * m);
}

// --- Info steps ---
interface InfoStep { icon: React.ReactNode; title: string; description: string; }

const INFO_STEPS: InfoStep[] = [
  // Step 0 = interactive goal setup (handled separately)
  {
    icon: <Camera className="w-8 h-8 text-accent" />,
    title: 'Scan Your Meals',
    description: 'Snap a photo of any meal and get an instant macro estimate. Add notes, adjust portions, or type a description — your call.',
  },
  {
    icon: <ClipboardCheck className="w-8 h-8 text-accent" />,
    title: 'Daily Check-In',
    description: 'Track 5 daily habits (protein, steps, training, sleep, aligned eating), log your mood & stress, and identify any negative thought patterns.',
  },
  {
    icon: <BarChart3 className="w-8 h-8 text-accent" />,
    title: 'Weekly Insights',
    description: 'See your patterns over time — habit streaks, recurring cognitive traps, and trend data that shows what\'s actually working.',
  },
  {
    icon: <MessageSquare className="w-8 h-8 text-accent" />,
    title: 'Lean Brain Chat',
    description: 'Ask Karim\'s coaching logic anything — about your habits, nutrition, or what to do when the plan breaks. Direct answers, no fluff.',
  },
  {
    icon: <LifeBuoy className="w-8 h-8 text-accent" />,
    title: 'Reset Protocol',
    description: 'The red button in the bottom-right corner. Use it when you\'re spiraling — it walks you through 5 steps to get back on track.',
  },
];

const TOTAL_STEPS = INFO_STEPS.length + 1; // +1 for the interactive goal step
const GOAL_STEP_INDEX = 0; // Goal setup is now step 1 (index 0)

interface OnboardingWalkthroughProps {
  userId: string;
  onGoalsUpdated?: () => void;
  forceShow?: boolean;
  onForceShowDone?: () => void;
}

export const OnboardingWalkthrough: React.FC<OnboardingWalkthroughProps> = ({ userId, onGoalsUpdated, forceShow, onForceShowDone }) => {
  const [show, setShow] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  // Goal form state
  const [weightKg, setWeightKg] = useState('');
  const [heightCm, setHeightCm] = useState('');
  const [age, setAge] = useState('');
  const [sex, setSex] = useState<Sex | ''>('');
  const [activityLevel, setActivityLevel] = useState<ActivityLevel | ''>('');
  const [goalType, setGoalType] = useState<GoalType | ''>('');
  const [manualOverride, setManualOverride] = useState(false);
  const [calorieGoal, setCalorieGoal] = useState('');
  const [proteinGoal, setProteinGoal] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const key = `${ONBOARDING_KEY}-${userId}`;
    if (!localStorage.getItem(key)) setShow(true);
  }, [userId]);

  useEffect(() => {
    if (forceShow) {
      setCurrentStep(0);
      setShow(true);
    }
  }, [forceShow]);

  const canCalculate = weightKg && heightCm && age && sex && activityLevel && goalType;

  const calculated = useMemo(() => {
    if (!canCalculate) return null;
    return {
      calories: calculateCalories(parseFloat(weightKg), parseFloat(heightCm), parseInt(age), sex as Sex, activityLevel as ActivityLevel, goalType as GoalType),
      protein: calculateProtein(parseFloat(weightKg), goalType as GoalType),
    };
  }, [weightKg, heightCm, age, sex, activityLevel, goalType, canCalculate]);

  useEffect(() => {
    if (calculated && !manualOverride) {
      setCalorieGoal(calculated.calories.toString());
      setProteinGoal(calculated.protein.toString());
    }
  }, [calculated, manualOverride]);

  const handleComplete = () => {
    localStorage.setItem(`${ONBOARDING_KEY}-${userId}`, 'true');
    setShow(false);
    onForceShowDone?.();
  };

  const saveGoals = async () => {
    if (!calorieGoal && !proteinGoal) {
      // Skip saving if nothing entered
      return true;
    }
    setIsSaving(true);
    try {
      const goals = {
        user_id: userId,
        daily_calories: calorieGoal ? parseInt(calorieGoal) : null,
        daily_protein: proteinGoal ? parseInt(proteinGoal) : null,
        weight_kg: weightKg ? parseFloat(weightKg) : null,
        height_cm: heightCm ? parseFloat(heightCm) : null,
        age: age ? parseInt(age) : null,
        sex: sex || null,
        activity_level: activityLevel || null,
        goal_type: goalType || null,
        updated_at: new Date().toISOString(),
      };
      const { error } = await (supabase.from('user_goals') as any).upsert(goals, { onConflict: 'user_id' });
      if (error) throw error;
      toast.success('Goals saved!');
      onGoalsUpdated?.();
      return true;
    } catch (e: any) {
      toast.error(e.message || 'Failed to save goals');
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  const handleNext = async () => {
    if (currentStep === GOAL_STEP_INDEX) {
      const ok = await saveGoals();
      if (!ok) return;
    }
    if (currentStep < TOTAL_STEPS - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      handleComplete();
    }
  };

  const handleSkip = () => handleComplete();

  if (!show) return null;

  const isGoalStep = currentStep === GOAL_STEP_INDEX;
  const isLast = currentStep === TOTAL_STEPS - 1;

  // Map step index to info step (skip goal step)
  const getInfoStep = () => {
    if (currentStep < GOAL_STEP_INDEX) return INFO_STEPS[currentStep];
    if (currentStep > GOAL_STEP_INDEX) return INFO_STEPS[currentStep - 1];
    return null;
  };
  const infoStep = getInfoStep();

  return (
    <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-300">
      <div className="w-full max-w-sm bg-card rounded-3xl shadow-elevated border border-border/50 overflow-hidden animate-in zoom-in-95 duration-300 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 pb-0">
          <div className="flex items-center gap-2">
            <img src={projectLeanLogo} alt="" className="h-6" />
            <span className="text-xs font-medium text-muted-foreground">
              {currentStep + 1} of {TOTAL_STEPS}
            </span>
          </div>
          <button onClick={handleSkip} className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors" aria-label="Skip tutorial">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Progress */}
        <div className="flex gap-1.5 px-4 pt-3">
          {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
            <div key={i} className={`h-1 rounded-full flex-1 transition-all duration-300 ${i <= currentStep ? 'bg-accent' : 'bg-muted'}`} />
          ))}
        </div>

        {/* Content */}
        {isGoalStep ? (
          <div className="p-5 pt-4 space-y-4">
            <div className="text-center">
              <div className="w-14 h-14 rounded-2xl bg-accent/10 flex items-center justify-center mx-auto mb-3">
                <Target className="w-7 h-7 text-accent" />
              </div>
              <h2 className="font-display text-xl font-bold text-foreground mb-1">Set Your Goals</h2>
              <p className="text-xs text-muted-foreground">Enter your stats to auto-calculate targets</p>
            </div>

            {/* Body stats */}
            <div className="grid grid-cols-2 gap-2.5">
              <div className="space-y-1">
                <Label className="text-xs">Weight (kg)</Label>
                <Input type="number" placeholder="80" value={weightKg} onChange={e => setWeightKg(e.target.value)} className="rounded-xl h-9 text-sm" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Height (cm)</Label>
                <Input type="number" placeholder="175" value={heightCm} onChange={e => setHeightCm(e.target.value)} className="rounded-xl h-9 text-sm" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Age</Label>
                <Input type="number" placeholder="30" value={age} onChange={e => setAge(e.target.value)} className="rounded-xl h-9 text-sm" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Gender</Label>
                <Select value={sex} onValueChange={v => setSex(v as Sex)}>
                  <SelectTrigger className="rounded-xl h-9 text-sm"><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-xs">Activity Level</Label>
              <Select value={activityLevel} onValueChange={v => setActivityLevel(v as ActivityLevel)}>
                <SelectTrigger className="rounded-xl h-9 text-sm"><SelectValue placeholder="Select activity level" /></SelectTrigger>
                <SelectContent>
                  {(Object.entries(ACTIVITY_LABELS) as [ActivityLevel, string][]).map(([k, l]) => (
                    <SelectItem key={k} value={k}>{l}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label className="text-xs">Goal</Label>
              <Select value={goalType} onValueChange={v => setGoalType(v as GoalType)}>
                <SelectTrigger className="rounded-xl h-9 text-sm"><SelectValue placeholder="Select goal" /></SelectTrigger>
                <SelectContent>
                  {(Object.entries(GOAL_LABELS) as [GoalType, string][]).map(([k, l]) => (
                    <SelectItem key={k} value={k}>{l}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Calculated / Manual targets */}
            <div className="border-t border-border pt-3 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs font-medium text-foreground">
                  {manualOverride ? <><Pencil className="w-3 h-3" /> Manual</> : <><Calculator className="w-3 h-3" /> Calculated</>}
                </div>
                <button
                  onClick={() => setManualOverride(!manualOverride)}
                  className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  {manualOverride ? 'Use calculator' : 'Adjust manually'}
                </button>
              </div>
              <div className="grid grid-cols-2 gap-2.5">
                <div className="space-y-1">
                  <Label className="text-xs">Calories (kcal)</Label>
                  <Input
                    type="number" placeholder="2000" value={calorieGoal}
                    onChange={e => { setManualOverride(true); setCalorieGoal(e.target.value); }}
                    readOnly={!manualOverride && !!calculated}
                    className={`rounded-xl h-9 text-sm ${!manualOverride && calculated ? 'bg-muted' : ''}`}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Protein (g)</Label>
                  <Input
                    type="number" placeholder="150" value={proteinGoal}
                    onChange={e => { setManualOverride(true); setProteinGoal(e.target.value); }}
                    readOnly={!manualOverride && !!calculated}
                    className={`rounded-xl h-9 text-sm ${!manualOverride && calculated ? 'bg-muted' : ''}`}
                  />
                </div>
              </div>
              {!canCalculate && !calorieGoal && (
                <p className="text-xs text-muted-foreground">Fill in your stats to auto-calculate, or adjust manually.</p>
              )}
            </div>
          </div>
        ) : (
          <div className="p-6 pt-5 text-center">
            <div className="w-16 h-16 rounded-2xl bg-accent/10 flex items-center justify-center mx-auto mb-4">
              {infoStep!.icon}
            </div>
            <h2 className="font-display text-xl font-bold text-foreground mb-2">{infoStep!.title}</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">{infoStep!.description}</p>
          </div>
        )}

        {/* Actions */}
        <div className="p-4 pt-0 space-y-2">
          <Button variant="coral" size="lg" className="w-full" onClick={handleNext} disabled={isSaving}>
            {isSaving ? 'Saving...' : isGoalStep ? (calorieGoal ? 'Save & Continue' : 'Skip for now') : isLast ? "Let's go" : 'Next'}
            {!isSaving && <ArrowRight className="w-4 h-4 ml-1" />}
          </Button>
          {!isLast && (
            <button onClick={handleSkip} className="w-full text-sm text-muted-foreground hover:text-foreground transition-colors py-1">
              Skip tutorial
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

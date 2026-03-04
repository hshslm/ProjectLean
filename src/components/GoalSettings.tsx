import { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Settings, Calculator, Pencil } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface GoalSettingsProps {
  userId: string;
  currentCalorieGoal: number | null;
  currentProteinGoal: number | null;
  onGoalsUpdated: () => void;
  triggerLabel?: string;
  triggerVariant?: 'ghost' | 'coral' | 'outline' | 'default';
}

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
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  very_active: 1.725,
};

const GOAL_LABELS: Record<GoalType, string> = {
  fat_loss: 'Fat loss',
  maintenance: 'Maintenance',
  lean_gain: 'Lean gain',
};

const GOAL_ADJUSTMENTS: Record<GoalType, number> = {
  fat_loss: -500,
  maintenance: 0,
  lean_gain: 250,
};

function calculateCalories(
  weightKg: number,
  heightCm: number,
  age: number,
  sex: Sex,
  activityLevel: ActivityLevel,
  goalType: GoalType
): number {
  // Mifflin-St Jeor
  const bmr =
    sex === 'male'
      ? 10 * weightKg + 6.25 * heightCm - 5 * age + 5
      : 10 * weightKg + 6.25 * heightCm - 5 * age - 161;

  const tdee = bmr * ACTIVITY_MULTIPLIERS[activityLevel];
  return Math.round(tdee + GOAL_ADJUSTMENTS[goalType]);
}

function calculateProtein(weightKg: number, goalType: GoalType): number {
  // 1.6-2.2g/kg for fat loss, 1.4-1.6 maintenance, 1.6-2.0 lean gain
  const multiplier = goalType === 'fat_loss' ? 2.0 : goalType === 'lean_gain' ? 1.8 : 1.6;
  return Math.round(weightKg * multiplier);
}

export const GoalSettings = ({
  userId,
  currentCalorieGoal,
  currentProteinGoal,
  onGoalsUpdated,
  triggerLabel,
  triggerVariant = 'ghost',
}: GoalSettingsProps) => {
  const [open, setOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [manualOverride, setManualOverride] = useState(false);

  // Stats
  const [weightKg, setWeightKg] = useState('');
  const [heightCm, setHeightCm] = useState('');
  const [age, setAge] = useState('');
  const [sex, setSex] = useState<Sex | ''>('');
  const [activityLevel, setActivityLevel] = useState<ActivityLevel | ''>('');
  const [goalType, setGoalType] = useState<GoalType | ''>('');

  // Manual goals
  const [calorieGoal, setCalorieGoal] = useState('');
  const [proteinGoal, setProteinGoal] = useState('');

  // Load existing stats
  useEffect(() => {
    if (!open) return;
    const loadStats = async () => {
      const { data } = await (supabase.from('user_goals') as any)
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (data) {
        setWeightKg(data.weight_kg?.toString() || '');
        setHeightCm(data.height_cm?.toString() || '');
        setAge(data.age?.toString() || '');
        setSex((data.sex as Sex) || '');
        setActivityLevel((data.activity_level as ActivityLevel) || '');
        setGoalType((data.goal_type as GoalType) || '');
        setCalorieGoal(data.daily_calories?.toString() || '');
        setProteinGoal(data.daily_protein?.toString() || '');
      }
    };
    loadStats();
  }, [open, userId]);

  const canCalculate =
    weightKg && heightCm && age && sex && activityLevel && goalType;

  const calculated = useMemo(() => {
    if (!canCalculate) return null;
    const cal = calculateCalories(
      parseFloat(weightKg),
      parseFloat(heightCm),
      parseInt(age),
      sex as Sex,
      activityLevel as ActivityLevel,
      goalType as GoalType
    );
    const prot = calculateProtein(parseFloat(weightKg), goalType as GoalType);
    return { calories: cal, protein: prot };
  }, [weightKg, heightCm, age, sex, activityLevel, goalType, canCalculate]);

  // Auto-fill calculated values when not in manual override
  useEffect(() => {
    if (calculated && !manualOverride) {
      setCalorieGoal(calculated.calories.toString());
      setProteinGoal(calculated.protein.toString());
    }
  }, [calculated, manualOverride]);

  const handleSave = async () => {
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

      const { error } = await (supabase.from('user_goals') as any)
        .upsert(goals, { onConflict: 'user_id' });

      if (error) throw error;

      toast.success('Goals updated!');
      onGoalsUpdated();
      setOpen(false);
      setManualOverride(false);
    } catch (error: any) {
      toast.error(error.message || 'Failed to save goals');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {triggerLabel ? (
          <Button variant={triggerVariant} size="sm" className="rounded-xl">
            <Settings className="w-3.5 h-3.5 mr-1.5" />
            {triggerLabel}
          </Button>
        ) : (
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <Settings className="w-4 h-4" />
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[400px] max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Daily Goals</DialogTitle>
          <DialogDescription>
            Enter your stats to calculate targets, or set them manually.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Body Stats */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="weight" className="text-xs">Weight (kg)</Label>
              <Input
                id="weight"
                type="number"
                placeholder="80"
                value={weightKg}
                onChange={(e) => setWeightKg(e.target.value)}
                className="rounded-xl h-10"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="height" className="text-xs">Height (cm)</Label>
              <Input
                id="height"
                type="number"
                placeholder="175"
                value={heightCm}
                onChange={(e) => setHeightCm(e.target.value)}
                className="rounded-xl h-10"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="age" className="text-xs">Age</Label>
              <Input
                id="age"
                type="number"
                placeholder="30"
                value={age}
                onChange={(e) => setAge(e.target.value)}
                className="rounded-xl h-10"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Gender</Label>
              <Select value={sex} onValueChange={(v) => setSex(v as Sex)}>
                <SelectTrigger className="rounded-xl h-10">
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="male">Male</SelectItem>
                  <SelectItem value="female">Female</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Activity Level</Label>
            <Select value={activityLevel} onValueChange={(v) => setActivityLevel(v as ActivityLevel)}>
              <SelectTrigger className="rounded-xl h-10">
                <SelectValue placeholder="Select activity level" />
              </SelectTrigger>
              <SelectContent>
                {(Object.entries(ACTIVITY_LABELS) as [ActivityLevel, string][]).map(([key, label]) => (
                  <SelectItem key={key} value={key}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Goal</Label>
            <Select value={goalType} onValueChange={(v) => setGoalType(v as GoalType)}>
              <SelectTrigger className="rounded-xl h-10">
                <SelectValue placeholder="Select goal" />
              </SelectTrigger>
              <SelectContent>
                {(Object.entries(GOAL_LABELS) as [GoalType, string][]).map(([key, label]) => (
                  <SelectItem key={key} value={key}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Calculated / Manual Targets */}
          <div className="border-t border-border pt-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-sm font-medium text-foreground">
                {manualOverride ? (
                  <><Pencil className="w-3.5 h-3.5" /> Manual Targets</>
                ) : (
                  <><Calculator className="w-3.5 h-3.5" /> Calculated Targets</>
                )}
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="text-xs h-7 text-muted-foreground"
                onClick={() => setManualOverride(!manualOverride)}
              >
                {manualOverride ? 'Use calculator' : 'Adjust manually'}
              </Button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="calorieGoal" className="text-xs">Calories (kcal)</Label>
                <Input
                  id="calorieGoal"
                  type="number"
                  placeholder="2000"
                  value={calorieGoal}
                  onChange={(e) => {
                    setManualOverride(true);
                    setCalorieGoal(e.target.value);
                  }}
                  readOnly={!manualOverride && !!calculated}
                  className={`rounded-xl h-10 ${!manualOverride && calculated ? 'bg-muted' : ''}`}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="proteinGoal" className="text-xs">Protein (g)</Label>
                <Input
                  id="proteinGoal"
                  type="number"
                  placeholder="150"
                  value={proteinGoal}
                  onChange={(e) => {
                    setManualOverride(true);
                    setProteinGoal(e.target.value);
                  }}
                  readOnly={!manualOverride && !!calculated}
                  className={`rounded-xl h-10 ${!manualOverride && calculated ? 'bg-muted' : ''}`}
                />
              </div>
            </div>

            {!canCalculate && !calorieGoal && (
              <p className="text-xs text-muted-foreground">
                Fill in your stats above to auto-calculate, or adjust manually.
              </p>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button variant="coral" onClick={handleSave} disabled={isSaving}>
            {isSaving ? 'Saving...' : 'Save Goals'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

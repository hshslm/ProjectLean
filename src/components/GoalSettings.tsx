import { useState, useEffect } from 'react';
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
import { Settings } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface GoalSettingsProps {
  userId: string;
  currentCalorieGoal: number | null;
  currentProteinGoal: number | null;
  onGoalsUpdated: () => void;
}

export const GoalSettings = ({
  userId,
  currentCalorieGoal,
  currentProteinGoal,
  onGoalsUpdated,
}: GoalSettingsProps) => {
  const [open, setOpen] = useState(false);
  const [calorieGoal, setCalorieGoal] = useState(currentCalorieGoal?.toString() || '');
  const [proteinGoal, setProteinGoal] = useState(currentProteinGoal?.toString() || '');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setCalorieGoal(currentCalorieGoal?.toString() || '');
    setProteinGoal(currentProteinGoal?.toString() || '');
  }, [currentCalorieGoal, currentProteinGoal]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const goals = {
        user_id: userId,
        daily_calories: calorieGoal ? parseInt(calorieGoal) : null,
        daily_protein: proteinGoal ? parseInt(proteinGoal) : null,
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from('user_goals')
        .upsert(goals, { onConflict: 'user_id' });

      if (error) throw error;

      toast.success('Goals updated!');
      onGoalsUpdated();
      setOpen(false);
    } catch (error: any) {
      toast.error(error.message || 'Failed to save goals');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <Settings className="w-4 h-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[350px]">
        <DialogHeader>
          <DialogTitle>Daily Goals</DialogTitle>
          <DialogDescription>
            Set your daily calorie and protein targets. Leave blank to disable tracking.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="calorieGoal">Daily Calorie Goal</Label>
            <div className="flex items-center gap-2">
              <Input
                id="calorieGoal"
                type="number"
                placeholder="e.g., 2000"
                value={calorieGoal}
                onChange={(e) => setCalorieGoal(e.target.value)}
                className="rounded-xl"
              />
              <span className="text-sm text-muted-foreground">kcal</span>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="proteinGoal">Daily Protein Goal</Label>
            <div className="flex items-center gap-2">
              <Input
                id="proteinGoal"
                type="number"
                placeholder="e.g., 150"
                value={proteinGoal}
                onChange={(e) => setProteinGoal(e.target.value)}
                className="rounded-xl"
              />
              <span className="text-sm text-muted-foreground">g</span>
            </div>
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
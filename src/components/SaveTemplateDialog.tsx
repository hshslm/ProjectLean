import { useState } from 'react';
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
} from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface MealLog {
  food_identified: string;
  calories_low: number;
  calories_high: number;
  protein_low: number;
  protein_high: number;
  carbs_low: number;
  carbs_high: number;
  fat_low: number;
  fat_high: number;
  image_url: string | null;
}

interface SaveTemplateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mealLog: MealLog | null;
  userId: string;
}

export const SaveTemplateDialog = ({
  open,
  onOpenChange,
  mealLog,
  userId,
}: SaveTemplateDialogProps) => {
  const [name, setName] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (!mealLog || !name.trim()) {
      toast.error('Please enter a name for this favorite');
      return;
    }

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('meal_templates')
        .insert({
          user_id: userId,
          name: name.trim(),
          food_identified: mealLog.food_identified,
          calories_low: mealLog.calories_low,
          calories_high: mealLog.calories_high,
          protein_low: mealLog.protein_low,
          protein_high: mealLog.protein_high,
          carbs_low: mealLog.carbs_low,
          carbs_high: mealLog.carbs_high,
          fat_low: mealLog.fat_low,
          fat_high: mealLog.fat_high,
          image_url: mealLog.image_url,
        });

      if (error) throw error;

      toast.success('Saved to favorites!');
      setName('');
      onOpenChange(false);
    } catch (error: any) {
      toast.error('Could not save favorite. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[350px]">
        <DialogHeader>
          <DialogTitle>Save as Favorite</DialogTitle>
          <DialogDescription>
            Give this meal a name so you can quickly log it again.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <Label htmlFor="templateName">Name</Label>
          <Input
            id="templateName"
            placeholder="e.g., Morning Oatmeal"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="rounded-xl mt-2"
            autoFocus
          />
          {mealLog && (
            <p className="text-xs text-muted-foreground mt-2 line-clamp-2">
              {mealLog.food_identified}
            </p>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button variant="coral" onClick={handleSave} disabled={isSaving || !name.trim()}>
            {isSaving ? 'Saving...' : 'Save'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
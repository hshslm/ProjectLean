import React from 'react';
import { cn } from '@/lib/utils';
import { Target, Flame, Dumbbell, Scale } from 'lucide-react';

export type MealGoal = 'none' | 'fat_loss' | 'muscle_gain' | 'maintenance';

interface GoalSelectorProps {
  value: MealGoal;
  onChange: (goal: MealGoal) => void;
  disabled?: boolean;
}

const goals: { value: MealGoal; label: string; icon: React.ReactNode }[] = [
  { value: 'none', label: 'No goal', icon: <Target className="w-4 h-4" /> },
  { value: 'fat_loss', label: 'Fat loss', icon: <Flame className="w-4 h-4" /> },
  { value: 'muscle_gain', label: 'Muscle gain', icon: <Dumbbell className="w-4 h-4" /> },
  { value: 'maintenance', label: 'Maintenance', icon: <Scale className="w-4 h-4" /> },
];

export const GoalSelector: React.FC<GoalSelectorProps> = ({
  value,
  onChange,
  disabled = false,
}) => {
  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-foreground">
        What's the goal?
        <span className="text-muted-foreground font-normal ml-1">(optional)</span>
      </label>
      <div className="grid grid-cols-2 gap-2">
        {goals.map((goal) => (
          <button
            key={goal.value}
            type="button"
            onClick={() => onChange(goal.value)}
            disabled={disabled}
            className={cn(
              "flex items-center gap-2 p-3 rounded-xl border-2 transition-all duration-200",
              "focus:outline-none focus:ring-2 focus:ring-sage focus:ring-offset-2",
              value === goal.value
                ? "border-sage bg-sage-light text-sage-dark"
                : "border-border bg-card text-muted-foreground hover:border-sage/50",
              disabled && "opacity-50 cursor-not-allowed"
            )}
          >
            <span className={cn(
              "p-1.5 rounded-lg",
              value === goal.value ? "bg-sage/20" : "bg-secondary"
            )}>
              {goal.icon}
            </span>
            <span className="font-medium text-sm">{goal.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

import React from 'react';
import { Input } from '@/components/ui/input';
import { Target } from 'lucide-react';

interface CalorieBudgetProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

export const CalorieBudget: React.FC<CalorieBudgetProps> = ({
  value,
  onChange,
  disabled = false,
}) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    // Only allow numbers
    if (val === '' || /^\d+$/.test(val)) {
      onChange(val);
    }
  };

  return (
    <div className="space-y-2">
      <label htmlFor="calorie-budget" className="block text-sm font-medium text-foreground">
        Calorie budget for this meal
        <span className="text-muted-foreground font-normal ml-1">(optional)</span>
      </label>
      <div className="relative">
        <div className="absolute left-3 top-1/2 -translate-y-1/2 p-1.5 rounded-lg bg-coral-light">
          <Target className="w-4 h-4 text-coral" />
        </div>
        <Input
          id="calorie-budget"
          type="text"
          inputMode="numeric"
          placeholder="e.g. 700"
          value={value}
          onChange={handleChange}
          disabled={disabled}
          className="pl-12 pr-16 h-12 rounded-xl border-border bg-card focus:border-sage focus:ring-sage"
        />
        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
          kcal
        </span>
      </div>
    </div>
  );
};

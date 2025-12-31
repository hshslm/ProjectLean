import React from 'react';
import { Plus, Minus, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface QuickAdjustmentsProps {
  multiplier: number;
  onMultiplierChange: (multiplier: number) => void;
}

const adjustments = [
  { value: 0.5, label: '½', description: 'Ate half' },
  { value: 0.75, label: '¾', description: 'Three quarters' },
  { value: 1, label: '1×', description: 'Full portion' },
  { value: 1.25, label: '1¼', description: 'A bit more' },
  { value: 1.5, label: '1½', description: 'Extra large' },
];

export const QuickAdjustments: React.FC<QuickAdjustmentsProps> = ({
  multiplier,
  onMultiplierChange,
}) => {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-foreground">
          Adjust portion
        </label>
        {multiplier !== 1 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onMultiplierChange(1)}
            className="h-7 px-2 text-xs text-muted-foreground"
          >
            <RotateCcw className="w-3 h-3 mr-1" />
            Reset
          </Button>
        )}
      </div>
      
      <div className="flex gap-2">
        {adjustments.map((adj) => (
          <button
            key={adj.value}
            onClick={() => onMultiplierChange(adj.value)}
            className={cn(
              "flex-1 py-2 px-1 rounded-lg border-2 transition-all text-center",
              multiplier === adj.value
                ? "border-sage bg-sage-light text-sage-dark"
                : "border-border bg-card text-muted-foreground hover:border-sage/50"
            )}
          >
            <div className="font-semibold text-sm">{adj.label}</div>
            <div className="text-xs opacity-70 hidden sm:block">{adj.description}</div>
          </button>
        ))}
      </div>

      {multiplier !== 1 && (
        <p className="text-xs text-muted-foreground text-center">
          Macros adjusted to {Math.round(multiplier * 100)}% of original estimate
        </p>
      )}
    </div>
  );
};

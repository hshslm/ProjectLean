import React, { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface Ingredient {
  name: string;
  estimatedWeight?: string;
  calories: { low: number; high: number };
  protein: { low: number; high: number };
  carbs: { low: number; high: number };
  fat: { low: number; high: number };
}

interface IngredientBreakdownProps {
  ingredients: Ingredient[];
}

export const IngredientBreakdown: React.FC<IngredientBreakdownProps> = ({
  ingredients,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!ingredients || ingredients.length === 0) return null;

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-4 hover:bg-secondary/50 transition-colors"
      >
        <span className="font-medium text-sm">
          Ingredient breakdown ({ingredients.length} items)
        </span>
        {isExpanded ? (
          <ChevronUp className="w-4 h-4 text-muted-foreground" />
        ) : (
          <ChevronDown className="w-4 h-4 text-muted-foreground" />
        )}
      </button>

      {isExpanded && (
        <div className="border-t border-border divide-y divide-border">
          {ingredients.map((item, index) => (
            <div
              key={index}
              className={cn(
                "p-4 opacity-0 animate-fade-up",
              )}
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium text-foreground">{item.name}</span>
                {item.estimatedWeight && (
                  <span className="text-xs text-muted-foreground bg-secondary px-2 py-0.5 rounded-full">
                    ~{item.estimatedWeight}
                  </span>
                )}
              </div>
              <div className="grid grid-cols-4 gap-2 text-xs">
                <div className="text-center p-2 bg-coral-light rounded-lg">
                  <div className="text-muted-foreground mb-0.5">Cal</div>
                  <div className="font-medium text-foreground">
                    {item.calories.low}-{item.calories.high}
                  </div>
                </div>
                <div className="text-center p-2 bg-sage-light rounded-lg">
                  <div className="text-muted-foreground mb-0.5">Prot</div>
                  <div className="font-medium text-foreground">
                    {item.protein.low}-{item.protein.high}g
                  </div>
                </div>
                <div className="text-center p-2 bg-amber-50 rounded-lg">
                  <div className="text-muted-foreground mb-0.5">Carb</div>
                  <div className="font-medium text-foreground">
                    {item.carbs.low}-{item.carbs.high}g
                  </div>
                </div>
                <div className="text-center p-2 bg-sky-50 rounded-lg">
                  <div className="text-muted-foreground mb-0.5">Fat</div>
                  <div className="font-medium text-foreground">
                    {item.fat.low}-{item.fat.high}g
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

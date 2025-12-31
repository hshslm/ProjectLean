import React from 'react';
import { Flame, Beef, Wheat, Droplets, Sparkles, Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ConfidenceIndicator, ConfidenceLevel } from '@/components/ConfidenceIndicator';
import { IngredientBreakdown, Ingredient } from '@/components/IngredientBreakdown';

interface MacroData {
  caloriesLow: number;
  caloriesHigh: number;
  proteinLow: number;
  proteinHigh: number;
  carbsLow: number;
  carbsHigh: number;
  fatLow: number;
  fatHigh: number;
}

interface MacroResultsProps {
  foodIdentification: string;
  macros: MacroData;
  coachingContext: string;
  suggestion?: string;
  imagePreview?: string | null;
  ingredients?: Ingredient[];
  confidence?: {
    level: ConfidenceLevel;
    reason?: string;
  };
}

const MacroCard: React.FC<{
  icon: React.ReactNode;
  label: string;
  low: number;
  high: number;
  unit: string;
  color: string;
  delay: number;
}> = ({ icon, label, low, high, unit, color, delay }) => (
  <div 
    className={cn(
      "flex flex-col items-center p-4 rounded-xl bg-card shadow-soft",
      "opacity-0 animate-fade-up"
    )}
    style={{ animationDelay: `${delay}ms` }}
  >
    <div className={cn("p-2 rounded-lg mb-2", color)}>
      {icon}
    </div>
    <span className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
      {label}
    </span>
    <span className="font-display font-semibold text-lg text-foreground">
      {low}–{high}
      <span className="text-sm text-muted-foreground ml-0.5">{unit}</span>
    </span>
  </div>
);

export const MacroResults: React.FC<MacroResultsProps> = ({
  foodIdentification,
  macros,
  coachingContext,
  suggestion,
  imagePreview,
  ingredients,
  confidence,
}) => {
  return (
    <div className="space-y-6">
      {/* Image Preview in Results */}
      {imagePreview && (
        <div 
          className="rounded-2xl overflow-hidden shadow-soft opacity-0 animate-fade-up"
          style={{ animationDelay: '0ms' }}
        >
          <img
            src={imagePreview}
            alt="Analyzed meal"
            className="w-full h-48 object-cover"
          />
        </div>
      )}

      {/* Confidence Indicator */}
      {confidence && (
        <div className="opacity-0 animate-fade-up" style={{ animationDelay: '50ms' }}>
          <ConfidenceIndicator level={confidence.level} reason={confidence.reason} />
        </div>
      )}

      {/* Food Identification */}
      <div 
        className="p-5 rounded-2xl bg-sage-light border border-sage/20 opacity-0 animate-fade-up"
        style={{ animationDelay: '100ms' }}
      >
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-sage/20">
            <Sparkles className="w-4 h-4 text-sage-dark" />
          </div>
          <div>
            <h3 className="font-display font-semibold text-foreground mb-1">
              What I see
            </h3>
            <p className="text-muted-foreground leading-relaxed">
              {foodIdentification}
            </p>
          </div>
        </div>
      </div>

      {/* Macro Grid */}
      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2">
          <MacroCard
            icon={<Flame className="w-5 h-5 text-coral" />}
            label="Calories"
            low={macros.caloriesLow}
            high={macros.caloriesHigh}
            unit="kcal"
            color="bg-coral-light"
            delay={200}
          />
        </div>
        <MacroCard
          icon={<Beef className="w-4 h-4 text-sage-dark" />}
          label="Protein"
          low={macros.proteinLow}
          high={macros.proteinHigh}
          unit="g"
          color="bg-sage-light"
          delay={300}
        />
        <MacroCard
          icon={<Wheat className="w-4 h-4 text-amber-600" />}
          label="Carbs"
          low={macros.carbsLow}
          high={macros.carbsHigh}
          unit="g"
          color="bg-amber-50"
          delay={400}
        />
        <MacroCard
          icon={<Droplets className="w-4 h-4 text-sky-600" />}
          label="Fat"
          low={macros.fatLow}
          high={macros.fatHigh}
          unit="g"
          color="bg-sky-50"
          delay={500}
        />
        <div className="flex items-center justify-center p-4 rounded-xl bg-secondary opacity-0 animate-fade-up" style={{ animationDelay: '600ms' }}>
          <span className="text-xs text-muted-foreground text-center">
            Ranges account for portion & prep variance
          </span>
        </div>
      </div>

      {/* Ingredient Breakdown */}
      {ingredients && ingredients.length > 0 && (
        <div className="opacity-0 animate-fade-up" style={{ animationDelay: '650ms' }}>
          <IngredientBreakdown ingredients={ingredients} />
        </div>
      )}

      {/* Coaching Context */}
      <div 
        className="p-5 rounded-2xl bg-card shadow-soft border border-border opacity-0 animate-fade-up"
        style={{ animationDelay: '700ms' }}
      >
        <p className="text-foreground leading-relaxed font-medium">
          {coachingContext}
        </p>
      </div>

      {/* Optional Suggestion */}
      {suggestion && (
        <div 
          className="p-4 rounded-xl bg-coral-light border border-coral/20 opacity-0 animate-fade-up"
          style={{ animationDelay: '800ms' }}
        >
          <p className="text-charcoal-light text-sm leading-relaxed">
            💡 {suggestion}
          </p>
        </div>
      )}

      {/* Disclaimer */}
      <div 
        className="flex items-start gap-2 p-4 rounded-xl bg-secondary opacity-0 animate-fade-up"
        style={{ animationDelay: '900ms' }}
      >
        <Info className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
        <p className="text-xs text-muted-foreground leading-relaxed">
          Estimates are approximate. This tool supports awareness, not precision or tracking.
        </p>
      </div>
    </div>
  );
};

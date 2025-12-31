import React, { useState, useEffect } from 'react';
import { Leaf, ArrowRight, RotateCcw, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { MultiPhotoUpload } from '@/components/MultiPhotoUpload';
import { MacroResults } from '@/components/MacroResults';
import { LoadingState } from '@/components/LoadingState';
import { PortionSelector, PortionSize } from '@/components/PortionSelector';
import { CalorieBudget } from '@/components/CalorieBudget';
import { ProteinGoal } from '@/components/ProteinGoal';
import { WeightInput, WeightUnit } from '@/components/WeightInput';
import { ReferenceObjectTip } from '@/components/ReferenceObjectTip';
import { VisualPortionGuide } from '@/components/VisualPortionGuide';
import { QuickAdjustments } from '@/components/QuickAdjustments';
import { InstallPrompt } from '@/components/InstallPrompt';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import type { Ingredient } from '@/components/IngredientBreakdown';
import type { ConfidenceLevel } from '@/components/ConfidenceIndicator';

interface PhotoItem {
  file: File;
  preview: string;
}

interface EstimationResult {
  foodIdentification: string;
  macros: {
    caloriesLow: number;
    caloriesHigh: number;
    proteinLow: number;
    proteinHigh: number;
    carbsLow: number;
    carbsHigh: number;
    fatLow: number;
    fatHigh: number;
  };
  ingredients?: Ingredient[];
  confidence?: {
    level: ConfidenceLevel;
    reason?: string;
  };
  coachingContext: string;
  suggestion?: string;
}

export const MealEstimator: React.FC = () => {
  const [photos, setPhotos] = useState<PhotoItem[]>([]);
  const [notes, setNotes] = useState('');
  const [portionSize, setPortionSize] = useState<PortionSize>('medium');
  const [calorieBudget, setCalorieBudget] = useState('');
  const [proteinGoal, setProteinGoal] = useState('');
  const [weight, setWeight] = useState('');
  const [weightUnit, setWeightUnit] = useState<WeightUnit>('g');
  const [showReferenceTip, setShowReferenceTip] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<EstimationResult | null>(null);
  const [multiplier, setMultiplier] = useState(1);

  // Hide reference tip once photos are added
  useEffect(() => {
    if (photos.length > 0) {
      const timer = setTimeout(() => setShowReferenceTip(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [photos.length]);

  const handleEstimate = async () => {
    if (photos.length === 0 && !notes.trim()) {
      toast.error('Please add a photo or description of your meal');
      return;
    }

    setIsLoading(true);
    setMultiplier(1); // Reset multiplier for new estimation
    
    try {
      // Build context from all inputs
      let contextNotes = notes.trim();
      
      if (portionSize !== 'medium') {
        contextNotes += contextNotes ? `. ` : '';
        contextNotes += `Portion size: ${portionSize}`;
      }

      if (weight) {
        contextNotes += contextNotes ? `. ` : '';
        contextNotes += `Known weight of main item: ${weight}${weightUnit}`;
      }

      if (calorieBudget) {
        contextNotes += contextNotes ? `. ` : '';
        contextNotes += `My calorie budget for this meal is ${calorieBudget} kcal - please tell me if this meal fits within that budget`;
      }

      if (proteinGoal) {
        contextNotes += contextNotes ? `. ` : '';
        contextNotes += `My protein goal for this meal is ${proteinGoal}g - please tell me if this meal meets that goal`;
      }

      // Call the AI edge function with all images
      const { data, error } = await supabase.functions.invoke('analyze-meal', {
        body: {
          images: photos.map(p => p.preview),
          notes: contextNotes || undefined,
        },
      });

      if (error) {
        console.error('Function error:', error);
        toast.error('Something went wrong. Please try again.');
        return;
      }

      if (data.error) {
        console.error('API error:', data.error);
        toast.error(data.error);
        return;
      }

      setResult(data);
    } catch (error) {
      toast.error('Something went wrong. Please try again.');
      console.error('Estimation error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setPhotos([]);
    setNotes('');
    setPortionSize('medium');
    setCalorieBudget('');
    setProteinGoal('');
    setWeight('');
    setWeightUnit('g');
    setResult(null);
    setMultiplier(1);
    setShowReferenceTip(true);
  };

  const handleTryExample = () => {
    setNotes('Grilled chicken breast with steamed broccoli and brown rice');
    setPortionSize('medium');
    setCalorieBudget('600');
    setProteinGoal('40');
    setWeight('150');
    setWeightUnit('g');
  };

  const canEstimate = photos.length > 0 || notes.trim().length > 0;

  // Apply multiplier to macros
  const adjustedMacros = result?.macros ? {
    caloriesLow: Math.round(result.macros.caloriesLow * multiplier),
    caloriesHigh: Math.round(result.macros.caloriesHigh * multiplier),
    proteinLow: Math.round(result.macros.proteinLow * multiplier),
    proteinHigh: Math.round(result.macros.proteinHigh * multiplier),
    carbsLow: Math.round(result.macros.carbsLow * multiplier),
    carbsHigh: Math.round(result.macros.carbsHigh * multiplier),
    fatLow: Math.round(result.macros.fatLow * multiplier),
    fatHigh: Math.round(result.macros.fatHigh * multiplier),
  } : null;

  return (
    <div className="min-h-screen gradient-warm">
      <div className="max-w-lg mx-auto px-4 py-8 sm:py-12">
        {/* Header */}
        <header className="text-center mb-8 animate-fade-up">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-sage-light text-sage-dark text-sm font-medium mb-4">
            <Leaf className="w-4 h-4" />
            <span>Project Lean</span>
          </div>
          <h1 className="font-display text-3xl sm:text-4xl font-bold text-foreground mb-2">
            Meal Macro Estimator
          </h1>
          <p className="text-muted-foreground max-w-sm mx-auto">
            Get a quick estimate to make informed decisions — no tracking required.
          </p>
        </header>

        {/* Main Content */}
        <main className="space-y-6">
          {!result ? (
            <>
              {/* Reference Object Tip */}
              {showReferenceTip && photos.length === 0 && (
                <div className="animate-fade-up">
                  <ReferenceObjectTip onDismiss={() => setShowReferenceTip(false)} />
                </div>
              )}

              {/* Multi-Photo Upload */}
              <div className="animate-fade-up" style={{ animationDelay: '100ms' }}>
                <MultiPhotoUpload
                  photos={photos}
                  onPhotosChange={setPhotos}
                  maxPhotos={4}
                  disabled={isLoading}
                />
              </div>

              {/* Weight Input */}
              <div className="animate-fade-up" style={{ animationDelay: '150ms' }}>
                <WeightInput
                  weight={weight}
                  unit={weightUnit}
                  onWeightChange={setWeight}
                  onUnitChange={setWeightUnit}
                  disabled={isLoading}
                />
              </div>

              {/* Portion Size Selector with Guide */}
              <div className="animate-fade-up" style={{ animationDelay: '175ms' }}>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-foreground">
                    Portion size
                  </label>
                  <VisualPortionGuide />
                </div>
                <PortionSelector
                  value={portionSize}
                  onChange={setPortionSize}
                  disabled={isLoading}
                />
              </div>

              {/* Calorie Budget */}
              <div className="animate-fade-up" style={{ animationDelay: '200ms' }}>
                <CalorieBudget
                  value={calorieBudget}
                  onChange={setCalorieBudget}
                  disabled={isLoading}
                />
              </div>

              {/* Protein Goal */}
              <div className="animate-fade-up" style={{ animationDelay: '225ms' }}>
                <ProteinGoal
                  value={proteinGoal}
                  onChange={setProteinGoal}
                  disabled={isLoading}
                />
              </div>

              {/* Notes Input */}
              <div className="animate-fade-up" style={{ animationDelay: '250ms' }}>
                <label 
                  htmlFor="notes"
                  className="block text-sm font-medium text-foreground mb-2"
                >
                  Anything to add?
                  <span className="text-muted-foreground font-normal ml-1">(optional)</span>
                </label>
                <Textarea
                  id="notes"
                  placeholder="E.g., cooked in olive oil, extra sauce, ate half..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  disabled={isLoading}
                  className="min-h-[80px] resize-none rounded-xl border-border bg-card focus:border-sage focus:ring-sage"
                />
              </div>

              {/* Loading or Submit */}
              {isLoading ? (
                <LoadingState />
              ) : (
                <div className="animate-fade-up space-y-3" style={{ animationDelay: '300ms' }}>
                  <Button
                    onClick={handleEstimate}
                    disabled={!canEstimate}
                    variant="coral"
                    size="xl"
                    className="w-full"
                  >
                    Estimate macros
                    <ArrowRight className="w-5 h-5" />
                  </Button>
                  
                  {!canEstimate && (
                    <Button
                      onClick={handleTryExample}
                      variant="ghost"
                      size="sm"
                      className="w-full text-muted-foreground hover:text-foreground"
                    >
                      <Sparkles className="w-4 h-4 mr-1" />
                      Try an example meal
                    </Button>
                  )}
                </div>
              )}
            </>
          ) : (
            <>
              {/* Results */}
              <MacroResults
                foodIdentification={result.foodIdentification}
                macros={adjustedMacros!}
                coachingContext={result.coachingContext}
                suggestion={result.suggestion}
                imagePreview={photos[0]?.preview || null}
                ingredients={result.ingredients}
                confidence={result.confidence}
              />

              {/* Quick Adjustments */}
              <div className="opacity-0 animate-fade-up" style={{ animationDelay: '950ms' }}>
                <QuickAdjustments
                  multiplier={multiplier}
                  onMultiplierChange={setMultiplier}
                />
              </div>

              {/* Try Another */}
              <div className="pt-4 opacity-0 animate-fade-up" style={{ animationDelay: '1000ms' }}>
                <Button
                  onClick={handleReset}
                  variant="sage-outline"
                  size="lg"
                  className="w-full"
                >
                  <RotateCcw className="w-4 h-4" />
                  Try another meal
                </Button>
              </div>
            </>
          )}
        </main>

        {/* Footer */}
        <footer className="mt-12 pb-20 text-center opacity-0 animate-fade-up" style={{ animationDelay: '400ms' }}>
          <p className="text-xs text-muted-foreground">
            Built for awareness, not obsession.
          </p>
        </footer>

        {/* Install Prompt */}
        <InstallPrompt />
      </div>
    </div>
  );
};

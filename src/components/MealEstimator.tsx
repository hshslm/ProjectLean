import React, { useState, useCallback } from 'react';
import { Leaf, ArrowRight, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { PhotoUpload } from '@/components/PhotoUpload';
import { MacroResults } from '@/components/MacroResults';
import { LoadingState } from '@/components/LoadingState';
import { PortionSelector, PortionSize } from '@/components/PortionSelector';
import { CalorieBudget } from '@/components/CalorieBudget';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

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
  coachingContext: string;
  suggestion?: string;
}

export const MealEstimator: React.FC = () => {
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [notes, setNotes] = useState('');
  const [portionSize, setPortionSize] = useState<PortionSize>('medium');
  const [calorieBudget, setCalorieBudget] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<EstimationResult | null>(null);

  const handleImageSelect = useCallback((file: File, preview: string) => {
    setImageFile(file);
    setImagePreview(preview);
    setResult(null);
  }, []);

  const handleImageClear = useCallback(() => {
    setImageFile(null);
    setImagePreview(null);
    setResult(null);
  }, []);

  const handleEstimate = async () => {
    if (!imageFile && !notes.trim()) {
      toast.error('Please add a photo or description of your meal');
      return;
    }

    setIsLoading(true);
    try {
      // Build context from portion size and goal
      let contextNotes = notes.trim();
      
      if (portionSize !== 'medium') {
        contextNotes += contextNotes ? `. ` : '';
        contextNotes += `Portion size: ${portionSize}`;
      }

      if (calorieBudget) {
        contextNotes += contextNotes ? `. ` : '';
        contextNotes += `My calorie budget for this meal is ${calorieBudget} kcal - please tell me if this meal fits within that budget`;
      }

      // Call the AI edge function
      const { data, error } = await supabase.functions.invoke('analyze-meal', {
        body: {
          imageBase64: imagePreview,
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
    setImageFile(null);
    setImagePreview(null);
    setNotes('');
    setPortionSize('medium');
    setCalorieBudget('');
    setResult(null);
  };

  const canEstimate = imageFile || notes.trim().length > 0;

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
              {/* Photo Upload */}
              <div className="animate-fade-up" style={{ animationDelay: '100ms' }}>
                <PhotoUpload
                  onImageSelect={handleImageSelect}
                  onImageClear={handleImageClear}
                  preview={imagePreview}
                  disabled={isLoading}
                />
              </div>

              {/* Portion Size Selector */}
              <div className="animate-fade-up" style={{ animationDelay: '150ms' }}>
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
                <div className="animate-fade-up" style={{ animationDelay: '300ms' }}>
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
                </div>
              )}
            </>
          ) : (
            <>
              {/* Results with image */}
              <MacroResults
                foodIdentification={result.foodIdentification}
                macros={result.macros}
                coachingContext={result.coachingContext}
                suggestion={result.suggestion}
                imagePreview={imagePreview}
              />

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
        <footer className="mt-12 text-center opacity-0 animate-fade-up" style={{ animationDelay: '400ms' }}>
          <p className="text-xs text-muted-foreground">
            Built for awareness, not obsession.
          </p>
        </footer>
      </div>
    </div>
  );
};

import React, { useState, useCallback } from 'react';
import { Leaf, ArrowRight, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { PhotoUpload } from '@/components/PhotoUpload';
import { MacroResults } from '@/components/MacroResults';
import { LoadingState } from '@/components/LoadingState';
import { toast } from 'sonner';

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

// Demo function - simulates AI response for demo purposes
const simulateEstimation = async (hasImage: boolean, notes: string): Promise<EstimationResult> => {
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // Demo responses based on common meals
  const demoResults: EstimationResult[] = [
    {
      foodIdentification: "Looks like grilled chicken breast, white rice, and steamed broccoli with a light sauce drizzle.",
      macros: {
        caloriesLow: 450,
        caloriesHigh: 550,
        proteinLow: 35,
        proteinHigh: 45,
        carbsLow: 40,
        carbsHigh: 50,
        fatLow: 10,
        fatHigh: 15,
      },
      coachingContext: "This looks like a solid, protein-forward meal. The balance of lean protein with complex carbs and vegetables is great for supporting your goals.",
      suggestion: "If you're aiming for lower carbs, you could swap some rice for extra vegetables.",
    },
    {
      foodIdentification: "I see what appears to be a burger with fries, possibly with cheese and sauce.",
      macros: {
        caloriesLow: 800,
        caloriesHigh: 1100,
        proteinLow: 30,
        proteinHigh: 45,
        carbsLow: 60,
        carbsHigh: 85,
        fatLow: 40,
        fatHigh: 60,
      },
      coachingContext: "This is a more calorie-dense meal, with most of the energy coming from fats and carbs. Totally fine as part of a balanced day.",
      suggestion: "If you're being mindful of intake today, this might be your main meal — and that's okay.",
    },
    {
      foodIdentification: "This looks like a mixed salad with grilled protein, possibly salmon or chicken, with dressing.",
      macros: {
        caloriesLow: 350,
        caloriesHigh: 500,
        proteinLow: 25,
        proteinHigh: 35,
        carbsLow: 15,
        carbsHigh: 25,
        fatLow: 18,
        fatHigh: 30,
      },
      coachingContext: "A lighter, nutrient-dense choice. The fat content depends heavily on the dressing amount.",
      suggestion: "Great option if you're looking for something satisfying without being too heavy.",
    },
  ];
  
  // Return a random demo result
  return demoResults[Math.floor(Math.random() * demoResults.length)];
};

export const MealEstimator: React.FC = () => {
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [notes, setNotes] = useState('');
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
      // For demo purposes, we're using a simulated response
      // In production, this would call the AI backend
      const estimation = await simulateEstimation(!!imageFile, notes);
      setResult(estimation);
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

              {/* Notes Input */}
              <div className="animate-fade-up" style={{ animationDelay: '200ms' }}>
                <label 
                  htmlFor="notes"
                  className="block text-sm font-medium text-foreground mb-2"
                >
                  Anything to add?
                  <span className="text-muted-foreground font-normal ml-1">(optional)</span>
                </label>
                <Textarea
                  id="notes"
                  placeholder="E.g., cooked in olive oil, extra sauce, large portion..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  disabled={isLoading}
                  className="min-h-[100px] resize-none rounded-xl border-border bg-card focus:border-sage focus:ring-sage"
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
              {/* Results */}
              <MacroResults
                foodIdentification={result.foodIdentification}
                macros={result.macros}
                coachingContext={result.coachingContext}
                suggestion={result.suggestion}
              />

              {/* Try Another */}
              <div className="pt-4 opacity-0 animate-fade-up" style={{ animationDelay: '900ms' }}>
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

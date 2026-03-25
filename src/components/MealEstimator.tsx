import React, { useState, useEffect } from 'react';
import { ArrowRight, RotateCcw, History, LogOut, ChevronLeft, ChevronRight, Plus, ClipboardCheck, UtensilsCrossed, BarChart3, LifeBuoy, Sparkles, HelpCircle } from 'lucide-react';
import { format, addDays, subDays, isToday } from 'date-fns';
import projectLeanLogo from '@/assets/project-lean-logo.png';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
import { DailyTotals } from '@/components/DailyTotals';
import { MealLogCard } from '@/components/MealLogCard';
import { PaywallModal } from '@/components/PaywallModal';
import { ScanCounter } from '@/components/ScanCounter';
import { GoalProgress } from '@/components/GoalProgress';
import { GoalSettings } from '@/components/GoalSettings';
import { WeeklyChart } from '@/components/WeeklyChart';
import { MealTemplates } from '@/components/MealTemplates';
import { SaveTemplateDialog } from '@/components/SaveTemplateDialog';
import { NotificationSettings } from '@/components/NotificationSettings';
import { useAuth } from '@/hooks/useAuth';
import { DailyCheckIn } from '@/components/DailyCheckIn';
import { WeeklyInsights } from '@/components/WeeklyInsights';
import { ResetProtocol } from '@/components/ResetProtocol';
import ErrorBoundary from '@/components/ErrorBoundary';
import SkeletonCard from '@/components/SkeletonCard';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { useSubscription } from '@/hooks/useSubscription';
import { CoachingUpsell } from '@/components/CoachingUpsell';
import { MilestoneUpsellModal } from '@/components/MilestoneUpsellModal';
import { LeanBrainChat } from '@/components/LeanBrainChat';
import { CheckInReminder } from '@/components/CheckInReminder';
import { OnboardingWalkthrough } from '@/components/OnboardingWalkthrough';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { uploadMealImage } from '@/lib/storage';
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

interface MealLog {
  id: string;
  logged_at: string;
  meal_date: string;
  food_identified: string;
  calories_low: number;
  calories_high: number;
  protein_low: number;
  protein_high: number;
  carbs_low: number;
  carbs_high: number;
  fat_low: number;
  fat_high: number;
  confidence: string | null;
  notes: string | null;
  image_url: string | null;
}

interface UserGoals {
  daily_calories: number | null;
  daily_protein: number | null;
}

export const MealEstimator: React.FC = () => {
  const { user, signOut } = useAuth();
  const { 
    hasAccess, 
    isSubscribed,
    isCoachingClient,
    openPaymentLink,
    refetch: refetchSubscription 
  } = useSubscription();
  
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
  const [showPaywall, setShowPaywall] = useState(false);
  
  // View state: 'estimate' or 'history'
  const [view, setView] = useState<'estimate' | 'history'>('history');
  const [activeTab, setActiveTab] = useState<'meals' | 'checkin' | 'insights'>('meals');
  const [showResetSheet, setShowResetSheet] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [mealLogs, setMealLogs] = useState<MealLog[]>([]);
  const [showTutorial, setShowTutorial] = useState(false);
  const [weeklyLogs, setWeeklyLogs] = useState<MealLog[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [editingMealId, setEditingMealId] = useState<string | null>(null);
  const [originalImageUrl, setOriginalImageUrl] = useState<string | null>(null);

  // Goals
  const [userGoals, setUserGoals] = useState<UserGoals>({ daily_calories: null, daily_protein: null });

  // Template dialog
  const [saveTemplateOpen, setSaveTemplateOpen] = useState(false);
  const [templateMeal, setTemplateMeal] = useState<MealLog | null>(null);

  // Fetch user goals
  useEffect(() => {
    if (user) {
      fetchUserGoals();
    }
  }, [user]);

  const fetchUserGoals = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('user_goals')
      .select('daily_calories, daily_protein')
      .eq('user_id', user.id)
      .maybeSingle();
    
    if (data) {
      setUserGoals(data);
    }
  };

  // Fetch meal logs when viewing history or changing date
  useEffect(() => {
    if (view === 'history' && user) {
      fetchMealLogs();
    }
  }, [view, selectedDate, user]);

  // Fetch weekly logs once when entering history view (relative to today, not selectedDate)
  useEffect(() => {
    if (view === 'history' && user) {
      fetchWeeklyLogs();
    }
  }, [view, user]);

  const fetchMealLogs = async () => {
    if (!user) return;
    setIsLoadingHistory(true);
    
    const dateStr = format(selectedDate, 'yyyy-MM-dd');
    const { data, error } = await supabase
      .from('meal_logs')
      .select('*')
      .eq('user_id', user.id)
      .eq('meal_date', dateStr)
      .order('logged_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching meal logs:', error);
    } else {
      setMealLogs(data || []);
    }
    setIsLoadingHistory(false);
  };

  const fetchWeeklyLogs = async () => {
    if (!user) return;
    const endDate = format(new Date(), 'yyyy-MM-dd');
    const startDate = format(subDays(new Date(), 6), 'yyyy-MM-dd');
    
    const { data } = await supabase
      .from('meal_logs')
      .select('*')
      .eq('user_id', user.id)
      .gte('meal_date', startDate)
      .lte('meal_date', endDate);
    
    setWeeklyLogs(data || []);
  };

  // Hide reference tip once photos are added
  useEffect(() => {
    if (photos.length > 0) {
      const timer = setTimeout(() => setShowReferenceTip(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [photos.length]);

  const handleDeleteMeal = async (id: string) => {
    const { error } = await supabase
      .from('meal_logs')
      .delete()
      .eq('id', id);

    if (error) {
      toast.error('Failed to delete meal');
    } else {
      toast.success('Meal deleted');
      fetchMealLogs();
      fetchWeeklyLogs();
    }
  };

  const handleEditMeal = async (id: string, updates: Partial<MealLog>) => {
    const { error } = await supabase
      .from('meal_logs')
      .update(updates)
      .eq('id', id);

    if (error) {
      toast.error('Failed to update meal');
    } else {
      toast.success('Meal updated');
      fetchMealLogs();
      fetchWeeklyLogs();
    }
  };

  const handleStartEdit = (log: MealLog) => {
    // Pre-fill notes with the food name for context
    setNotes(log.food_identified);
    // If the meal has an image, pre-fill it
    if (log.image_url) {
      setPhotos([{ file: new File([], 'existing.jpg'), preview: log.image_url }]);
      setOriginalImageUrl(log.image_url);
    } else {
      setPhotos([]);
      setOriginalImageUrl(null);
    }
    setPortionSize('medium');
    setCalorieBudget('');
    setProteinGoal('');
    setWeight('');
    setWeightUnit('g');
    setResult(null);
    setMultiplier(1);
    setEditingMealId(log.id);
    setView('estimate');
  };

  const handleSaveAsTemplate = (log: MealLog) => {
    setTemplateMeal(log);
    setSaveTemplateOpen(true);
  };

  const handleUseTemplate = async (template: any) => {
    if (!user) return;

    const d = selectedDate;
    const mealDate = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

    // Re-upload base64 images from old templates; keep existing URLs
    let imageUrl = template.image_url || null;
    if (imageUrl && imageUrl.startsWith('data:')) {
      imageUrl = await uploadMealImage(imageUrl, user.id);
    }

    const { error } = await supabase
      .from('meal_logs')
      .insert({
        user_id: user.id,
        food_identified: template.food_identified,
        calories_low: template.calories_low,
        calories_high: template.calories_high,
        protein_low: template.protein_low,
        protein_high: template.protein_high,
        carbs_low: template.carbs_low,
        carbs_high: template.carbs_high,
        fat_low: template.fat_low,
        fat_high: template.fat_high,
        image_url: imageUrl,
        meal_date: mealDate,
      });

    if (error) {
      toast.error('Failed to log meal');
    } else {
      fetchMealLogs();
      fetchWeeklyLogs();
    }
  };

  const handleEstimate = async () => {
    if (photos.length === 0 && !notes.trim()) {
      toast.error('Please add a photo or description of your meal');
      return;
    }

    // Check if user has an active subscription
    if (!hasAccess) {
      setShowPaywall(true);
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
        const msg = error.message?.includes('failed to send request') || error.message?.includes('FetchError')
          ? 'Connection error. Please check your internet and try again.'
          : 'Something went wrong. Please try again.';
        toast.error(msg);
        return;
      }

      if (data.error) {
        console.error('API error:', data.error);
        toast.error(data.error);
        return;
      }

      setResult(data);

      // Save to meal_logs
      if (user && data.macros) {
        // Use selectedDate to log meal to the day the user is viewing
        const d = selectedDate;
        const localDate = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

        // Upload image to storage (or keep existing URL if photo unchanged)
        let imageUrl: string | null = null;
        const photoPreview = photos[0]?.preview || null;
        if (photoPreview) {
          const photoChanged = photoPreview !== originalImageUrl;
          if (photoChanged && photoPreview.startsWith('data:')) {
            imageUrl = await uploadMealImage(photoPreview, user.id);
          } else {
            // Photo didn't change or is already a URL — keep as-is
            imageUrl = photoPreview;
          }
        }

        if (editingMealId) {
          // Update existing meal
          const { error: saveError } = await supabase
            .from('meal_logs')
            .update({
              food_identified: data.foodIdentification,
              calories_low: data.macros.caloriesLow,
              calories_high: data.macros.caloriesHigh,
              protein_low: data.macros.proteinLow,
              protein_high: data.macros.proteinHigh,
              carbs_low: data.macros.carbsLow,
              carbs_high: data.macros.carbsHigh,
              fat_low: data.macros.fatLow,
              fat_high: data.macros.fatHigh,
              confidence: data.confidence?.level || null,
              notes: notes.trim() || null,
              image_url: imageUrl,
            })
            .eq('id', editingMealId);

          if (saveError) {
            console.error('Error updating meal log:', saveError);
          } else {
            toast.success('Meal updated');
          }
        } else {
          // Insert new meal
          const { error: saveError } = await supabase
            .from('meal_logs')
            .insert({
              user_id: user.id,
              food_identified: data.foodIdentification,
              calories_low: data.macros.caloriesLow,
              calories_high: data.macros.caloriesHigh,
              protein_low: data.macros.proteinLow,
              protein_high: data.macros.proteinHigh,
              carbs_low: data.macros.carbsLow,
              carbs_high: data.macros.carbsHigh,
              fat_low: data.macros.fatLow,
              fat_high: data.macros.fatHigh,
              confidence: data.confidence?.level || null,
              notes: notes.trim() || null,
              image_url: imageUrl,
              meal_date: localDate,
            });

          if (saveError) {
            console.error('Error saving meal log:', saveError);
          }
        }
      }
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
    setEditingMealId(null);
    setOriginalImageUrl(null);
    setView('history');
    fetchMealLogs();
    fetchWeeklyLogs();
  };

  const handlePrevDay = () => {
    setSelectedDate(prev => subDays(prev, 1));
  };

  const handleNextDay = () => {
    if (!isToday(selectedDate)) {
      setSelectedDate(prev => addDays(prev, 1));
    }
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

  // Calculate daily totals for goal progress
  const dailyTotals = mealLogs.reduce(
    (acc, log) => ({
      caloriesLow: acc.caloriesLow + log.calories_low,
      caloriesHigh: acc.caloriesHigh + log.calories_high,
      proteinLow: acc.proteinLow + log.protein_low,
      proteinHigh: acc.proteinHigh + log.protein_high,
      carbsLow: acc.carbsLow + log.carbs_low,
      carbsHigh: acc.carbsHigh + log.carbs_high,
      fatLow: acc.fatLow + log.fat_low,
      fatHigh: acc.fatHigh + log.fat_high,
    }),
    { caloriesLow: 0, caloriesHigh: 0, proteinLow: 0, proteinHigh: 0, carbsLow: 0, carbsHigh: 0, fatLow: 0, fatHigh: 0 }
  );

  return (
    <div className="min-h-screen gradient-warm">
      <div className="max-w-lg mx-auto px-4 py-8 sm:py-12">
        {/* Header with sign out */}
        <header className="mb-8 animate-fade-up">
          <div className="flex items-center justify-between mb-4">
            <img 
              src={projectLeanLogo} 
              alt="Project Lean" 
              className="h-16 sm:h-20"
            />
            <div className="flex items-center gap-1">
              {isSubscribed && (
                <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20">
                  <Sparkles className="h-3 w-3 mr-1" /> Pro
                </Badge>
              )}
              {user && <NotificationSettings userId={user.id} />}
              {isSubscribed && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => window.open('https://billing.stripe.com/p/login/4gw6rbcv63Gl4gw4gg', '_blank')}
                  title="Manage Subscription"
                  className="h-8 w-8 p-0"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowTutorial(true)}
                title="Replay Tutorial"
                className="h-8 w-8 p-0"
              >
                <HelpCircle className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="sm" onClick={signOut} className="h-8 w-8 p-0">
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          </div>
          <div className="text-center">
            <h1 className="font-display text-2xl sm:text-3xl font-bold text-foreground mb-1">
              The Lean Brain™
            </h1>
            <p className="text-muted-foreground max-w-sm mx-auto text-xs">
              A behavior intelligence system inside Project Lean.
            </p>
          </div>
        </header>

        {/* Main Content */}
        <main className="space-y-6">
          {/* Goals Summary Card */}
          {user && (
            <div className="rounded-xl border border-border bg-card p-4">
              {userGoals.daily_calories || userGoals.daily_protein ? (
                <>
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Daily Macros</p>
                    <GoalSettings
                      userId={user.id}
                      currentCalorieGoal={userGoals.daily_calories}
                      currentProteinGoal={userGoals.daily_protein}
                      onGoalsUpdated={fetchUserGoals}
                      triggerLabel="Edit"
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    {/* Calories */}
                    <div className="text-center">
                      <p className="text-xs text-muted-foreground mb-1">Goal</p>
                      <p className="text-lg font-bold text-foreground">{userGoals.daily_calories ?? '—'}</p>
                      <p className="text-[10px] text-muted-foreground">kcal</p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-muted-foreground mb-1">Eaten</p>
                      <p className="text-lg font-bold text-foreground">{Math.round((dailyTotals.caloriesLow + dailyTotals.caloriesHigh) / 2)}</p>
                      <p className="text-[10px] text-muted-foreground">kcal</p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-muted-foreground mb-1">Left</p>
                      <p className={`text-lg font-bold ${(userGoals.daily_calories ?? 0) - Math.round((dailyTotals.caloriesLow + dailyTotals.caloriesHigh) / 2) < 0 ? 'text-destructive' : 'text-primary'}`}>
                        {(userGoals.daily_calories ?? 0) - Math.round((dailyTotals.caloriesLow + dailyTotals.caloriesHigh) / 2)}
                      </p>
                      <p className="text-[10px] text-muted-foreground">kcal</p>
                    </div>
                  </div>
                  {userGoals.daily_protein && (
                    <div className="mt-3 pt-3 border-t border-border">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">Protein</span>
                        <span className="text-sm font-semibold text-foreground">
                          {Math.round((dailyTotals.proteinLow + dailyTotals.proteinHigh) / 2)}g
                          <span className="text-muted-foreground font-normal"> / {userGoals.daily_protein}g</span>
                        </span>
                      </div>
                      <div className="mt-1.5 bg-secondary rounded-full h-2">
                        <div
                          className="bg-primary rounded-full h-2 transition-all"
                          style={{ width: `${Math.min(100, (Math.round((dailyTotals.proteinLow + dailyTotals.proteinHigh) / 2) / userGoals.daily_protein) * 100)}%` }}
                        />
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-foreground text-sm">Set your daily goals</p>
                    <p className="text-xs text-muted-foreground">Calculate or enter your calorie & protein targets.</p>
                  </div>
                  <GoalSettings
                    userId={user.id}
                    currentCalorieGoal={null}
                    currentProteinGoal={null}
                    onGoalsUpdated={fetchUserGoals}
                    triggerLabel="Set Goals"
                    triggerVariant="coral"
                  />
                </div>
              )}
            </div>
          )}

          {/* Tab Navigation */}
          <div className="flex gap-1 bg-muted rounded-xl p-1">
            <button
              onClick={() => { setActiveTab('meals'); setView('history'); }}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'meals'
                  ? 'bg-card text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <UtensilsCrossed className="w-4 h-4" />
              Meals
            </button>
            <button
              onClick={() => setActiveTab('checkin')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'checkin'
                  ? 'bg-card text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <ClipboardCheck className="w-4 h-4" />
              Check-In
            </button>
            <button
              onClick={() => setActiveTab('insights')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'insights'
                  ? 'bg-card text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              Insights
            </button>
          </div>

          {/* Check-in reminder banner */}
          {activeTab === 'meals' && user && (
            <CheckInReminder
              userId={user.id}
              onGoToCheckIn={() => setActiveTab('checkin')}
            />
          )}

          {activeTab === 'insights' ? (
            <ErrorBoundary><WeeklyInsights userId={user!.id} /></ErrorBoundary>
          ) : activeTab === 'checkin' ? (
            <ErrorBoundary><DailyCheckIn userId={user!.id} /></ErrorBoundary>
          ) : view === 'history' && !result ? (
            <>
              <div className="flex items-center justify-center gap-4">

                <Button variant="ghost" size="icon" onClick={handlePrevDay}>
                  <ChevronLeft className="w-5 h-5" />
                </Button>
                <div className="text-center min-w-[160px]">
                  <p className="font-medium text-foreground">
                    {isToday(selectedDate) ? 'Today' : format(selectedDate, 'EEEE')}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {format(selectedDate, 'MMM d, yyyy')}
                  </p>
                </div>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={handleNextDay}
                  disabled={isToday(selectedDate)}
                >
                  <ChevronRight className="w-5 h-5" />
                </Button>
              </div>

              {/* Goal Progress */}
              {isToday(selectedDate) && !isLoadingHistory && (
                <GoalProgress
                  dailyCalorieGoal={userGoals.daily_calories}
                  dailyProteinGoal={userGoals.daily_protein}
                  currentCalories={{ low: dailyTotals.caloriesLow, high: dailyTotals.caloriesHigh }}
                  currentProtein={{ low: dailyTotals.proteinLow, high: dailyTotals.proteinHigh }}
                />
              )}

              {/* Daily Totals */}
              {!isLoadingHistory && <DailyTotals mealLogs={mealLogs} />}

              {/* Weekly Chart */}
              {isToday(selectedDate) && weeklyLogs.length > 0 && (
                <WeeklyChart 
                  mealLogs={weeklyLogs}
                  dailyCalorieGoal={userGoals.daily_calories}
                  dailyProteinGoal={userGoals.daily_protein}
                />
              )}

              {/* Coaching Upsell - show to subscribers who aren't already coaching clients */}
              {!isLoadingHistory && !isCoachingClient && (
                <CoachingUpsell />
              )}

              {/* Action Buttons */}
              <div className="flex gap-2">
                <Button
                  variant="coral"
                  size="lg"
                  className="flex-1"
                  onClick={() => setView('estimate')}
                >
                  <Plus className="w-5 h-5 mr-2" />
                  Add Meal
                </Button>
                {user && (
                  <MealTemplates
                    userId={user.id}
                    onUseTemplate={handleUseTemplate}
                  />
                )}
              </div>

              {/* Meal History */}
              {isLoadingHistory ? (
                <div className="space-y-3">
                  <SkeletonCard />
                  <SkeletonCard />
                  <SkeletonCard />
                </div>
              ) : mealLogs.length === 0 ? (
                <div className="text-center py-8">
                  <History className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
                  <p className="text-muted-foreground">No meals logged this day</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {mealLogs.map((log) => (
                    <MealLogCard 
                      key={log.id} 
                      log={log}
                      onDelete={handleDeleteMeal}
                      onEdit={handleEditMeal}
                      onRescan={(mealLog) => handleStartEdit(mealLog as MealLog)}
                      onSaveAsTemplate={handleSaveAsTemplate}
                    />
                  ))}
                </div>
              )}
            </>
          ) : view === 'estimate' && !result ? (
            <>
              {/* Back to History */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => { setEditingMealId(null); setView('history'); }}
                className="mb-2"
              >
                <ChevronLeft className="w-4 h-4 mr-1" />
                {editingMealId ? 'Cancel edit' : 'Back to today'}
              </Button>

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
                <div className="animate-fade-up" style={{ animationDelay: '300ms' }}>
                  <Button
                    onClick={handleEstimate}
                    disabled={!canEstimate}
                    variant="coral"
                    size="xl"
                    className="w-full"
                  >
                    {editingMealId ? 'Re-estimate macros' : 'Estimate macros'}
                    <ArrowRight className="w-5 h-5" />
                  </Button>
                </div>
              )}
            </>
          ) : (
            <>
              {/* Results */}
              <MacroResults
                foodIdentification={result!.foodIdentification}
                macros={adjustedMacros!}
                coachingContext={result!.coachingContext}
                suggestion={result!.suggestion}
                imagePreview={photos[0]?.preview || null}
                ingredients={result!.ingredients}
                confidence={result!.confidence}
              />

              {/* Quick Adjustments */}
              <div className="opacity-0 animate-fade-up" style={{ animationDelay: '950ms' }}>
                <QuickAdjustments
                  multiplier={multiplier}
                  onMultiplierChange={setMultiplier}
                />
              </div>

              {/* Done */}
              <div className="pt-4 opacity-0 animate-fade-up" style={{ animationDelay: '1000ms' }}>
                <Button
                  onClick={handleReset}
                  variant="coral"
                  size="lg"
                  className="w-full"
                >
                  Done
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

        {/* Paywall Modal */}
        <PaywallModal
          open={showPaywall}
          onOpenChange={setShowPaywall}
          onSubscribe={() => {
            openPaymentLink();
            setShowPaywall(false);
          }}
        />

        {user && !isCoachingClient && <MilestoneUpsellModal userId={user.id} />}

        {/* First-time onboarding */}
        {user && <OnboardingWalkthrough userId={user.id} onGoalsUpdated={fetchUserGoals} forceShow={showTutorial} onForceShowDone={() => setShowTutorial(false)} />}

        {/* Lean Brain Chat */}
        <LeanBrainChat
          dailyCalorieGoal={userGoals.daily_calories}
          dailyProteinGoal={userGoals.daily_protein}
          dailyTotals={dailyTotals}
        />

        {/* Save Template Dialog */}
        {user && (
          <SaveTemplateDialog
            open={saveTemplateOpen}
            onOpenChange={setSaveTemplateOpen}
            mealLog={templateMeal}
            userId={user.id}
          />
        )}

        {/* Floating Reset Protocol Button + Sheet */}
        <Sheet open={showResetSheet} onOpenChange={setShowResetSheet}>
          <SheetTrigger asChild>
            <button
              className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-destructive text-destructive-foreground shadow-lg flex items-center justify-center hover:bg-destructive/90 transition-all active:scale-95"
              aria-label="Reset Protocol"
            >
              <LifeBuoy className="w-6 h-6" />
            </button>
          </SheetTrigger>
          <SheetContent side="bottom" className="max-h-[85vh] overflow-y-auto rounded-t-2xl">
            <SheetHeader className="pb-2">
              <SheetTitle className="text-base">Reset Protocol</SheetTitle>
              <p className="text-xs text-muted-foreground">
                Feeling off track? Walk through these 5 steps to reset your mindset.
              </p>
            </SheetHeader>
            <ResetProtocol
              onComplete={() => {
                toast.success('Reset Protocol complete. You recovered.');
              }}
              isCompleted={false}
              defaultExpanded={true}
            />
          </SheetContent>
        </Sheet>
      </div>
    </div>
  );
};
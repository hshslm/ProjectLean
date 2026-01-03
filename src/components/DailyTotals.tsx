import { Card, CardContent } from '@/components/ui/card';

interface MealLog {
  calories_low: number;
  calories_high: number;
  protein_low: number;
  protein_high: number;
  carbs_low: number;
  carbs_high: number;
  fat_low: number;
  fat_high: number;
}

interface DailyTotalsProps {
  mealLogs: MealLog[];
}

export const DailyTotals = ({ mealLogs }: DailyTotalsProps) => {
  const totals = mealLogs.reduce(
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
    {
      caloriesLow: 0,
      caloriesHigh: 0,
      proteinLow: 0,
      proteinHigh: 0,
      carbsLow: 0,
      carbsHigh: 0,
      fatLow: 0,
      fatHigh: 0,
    }
  );

  if (mealLogs.length === 0) {
    return null;
  }

  return (
    <Card className="bg-primary/5 border-primary/20">
      <CardContent className="p-4">
        <h3 className="text-sm font-medium text-muted-foreground mb-3">Daily Total</h3>
        <div className="grid grid-cols-4 gap-4 text-center">
          <div>
            <p className="text-2xl font-bold text-primary">
              {totals.caloriesLow === totals.caloriesHigh 
                ? totals.caloriesLow 
                : `${totals.caloriesLow}-${totals.caloriesHigh}`}
            </p>
            <p className="text-xs text-muted-foreground">kcal</p>
          </div>
          <div>
            <p className="text-xl font-semibold text-foreground">
              {totals.proteinLow === totals.proteinHigh 
                ? totals.proteinLow 
                : `${totals.proteinLow}-${totals.proteinHigh}`}
            </p>
            <p className="text-xs text-muted-foreground">protein</p>
          </div>
          <div>
            <p className="text-xl font-semibold text-foreground">
              {totals.carbsLow === totals.carbsHigh 
                ? totals.carbsLow 
                : `${totals.carbsLow}-${totals.carbsHigh}`}
            </p>
            <p className="text-xs text-muted-foreground">carbs</p>
          </div>
          <div>
            <p className="text-xl font-semibold text-foreground">
              {totals.fatLow === totals.fatHigh 
                ? totals.fatLow 
                : `${totals.fatLow}-${totals.fatHigh}`}
            </p>
            <p className="text-xs text-muted-foreground">fat</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

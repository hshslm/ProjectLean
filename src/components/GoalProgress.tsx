import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

interface GoalProgressProps {
  dailyCalorieGoal: number | null;
  dailyProteinGoal: number | null;
  currentCalories: { low: number; high: number };
  currentProtein: { low: number; high: number };
}

export const GoalProgress = ({
  dailyCalorieGoal,
  dailyProteinGoal,
  currentCalories,
  currentProtein,
}: GoalProgressProps) => {
  if (!dailyCalorieGoal && !dailyProteinGoal) {
    return null;
  }

  const avgCalories = Math.round((currentCalories.low + currentCalories.high) / 2);
  const avgProtein = Math.round((currentProtein.low + currentProtein.high) / 2);

  const calorieProgress = dailyCalorieGoal ? Math.min((avgCalories / dailyCalorieGoal) * 100, 100) : 0;
  const proteinProgress = dailyProteinGoal ? Math.min((avgProtein / dailyProteinGoal) * 100, 100) : 0;

  const calorieOverage = dailyCalorieGoal && avgCalories > dailyCalorieGoal;
  const proteinMet = dailyProteinGoal && avgProtein >= dailyProteinGoal;

  return (
    <Card className="bg-card border-border">
      <CardContent className="p-4 space-y-4">
        <h3 className="text-sm font-medium text-foreground">Daily Goals</h3>
        
        {dailyCalorieGoal && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Calories</span>
              <span className={calorieOverage ? 'text-destructive font-medium' : 'text-foreground'}>
                {avgCalories} / {dailyCalorieGoal} kcal
              </span>
            </div>
            <Progress 
              value={calorieProgress} 
              className={`h-2 ${calorieOverage ? '[&>div]:bg-destructive' : ''}`}
            />
            {calorieOverage && (
              <p className="text-xs text-destructive">
                {avgCalories - dailyCalorieGoal} kcal over budget
              </p>
            )}
          </div>
        )}
        
        {dailyProteinGoal && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Protein</span>
              <span className={proteinMet ? 'text-primary font-medium' : 'text-foreground'}>
                {avgProtein} / {dailyProteinGoal}g
              </span>
            </div>
            <Progress 
              value={proteinProgress} 
              className={`h-2 ${proteinMet ? '[&>div]:bg-primary' : ''}`}
            />
            {proteinMet && (
              <p className="text-xs text-primary">
                ✓ Protein goal met!
              </p>
            )}
            {!proteinMet && dailyProteinGoal && (
              <p className="text-xs text-muted-foreground">
                {dailyProteinGoal - avgProtein}g remaining
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
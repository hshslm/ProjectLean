import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { format, subDays, parseISO, startOfDay, isSameDay } from 'date-fns';

interface MealLog {
  logged_at: string;
  meal_date: string;
  calories_low: number;
  calories_high: number;
  protein_low: number;
  protein_high: number;
}

interface WeeklyChartProps {
  mealLogs: MealLog[];
  dailyCalorieGoal?: number | null;
  dailyProteinGoal?: number | null;
}

export const WeeklyChart = ({ mealLogs, dailyCalorieGoal, dailyProteinGoal }: WeeklyChartProps) => {
  const chartData = useMemo(() => {
    const today = new Date();
    const days = [];
    
    for (let i = 6; i >= 0; i--) {
      const date = subDays(today, i);
      const dateStr = format(date, 'yyyy-MM-dd');
      
      const dayLogs = mealLogs.filter(log => log.meal_date === dateStr);
      
      const calories = dayLogs.reduce((sum, log) => 
        sum + Math.round((log.calories_low + log.calories_high) / 2), 0);
      const protein = dayLogs.reduce((sum, log) => 
        sum + Math.round((log.protein_low + log.protein_high) / 2), 0);
      
      days.push({
        date: format(date, 'EEE'),
        fullDate: dateStr,
        calories,
        protein,
        calorieGoal: dailyCalorieGoal || undefined,
        proteinGoal: dailyProteinGoal || undefined,
      });
    }
    
    return days;
  }, [mealLogs, dailyCalorieGoal, dailyProteinGoal]);

  const hasData = chartData.some(d => d.calories > 0 || d.protein > 0);

  if (!hasData) {
    return null;
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          7-Day Trend
        </CardTitle>
      </CardHeader>
      <CardContent className="pb-4">
        <div className="h-40">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorCalories" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorProtein" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--foreground))" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(var(--foreground))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis 
                dataKey="date" 
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
              />
              <YAxis 
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                  fontSize: '12px',
                }}
                labelStyle={{ color: 'hsl(var(--foreground))' }}
              />
              <Area
                type="monotone"
                dataKey="calories"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorCalories)"
                name="Calories"
              />
              <Area
                type="monotone"
                dataKey="protein"
                stroke="hsl(var(--foreground))"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorProtein)"
                name="Protein (g)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <div className="flex justify-center gap-6 mt-2 text-xs">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full bg-primary" />
            <span className="text-muted-foreground">Calories</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full bg-foreground" />
            <span className="text-muted-foreground">Protein</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
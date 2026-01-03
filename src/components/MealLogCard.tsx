import { Card, CardContent } from '@/components/ui/card';
import { format, parseISO } from 'date-fns';

interface MealLog {
  id: string;
  logged_at: string;
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

interface MealLogCardProps {
  log: MealLog;
  onDelete?: (id: string) => void;
}

export const MealLogCard = ({ log, onDelete }: MealLogCardProps) => {
  const formatRange = (low: number, high: number, unit?: string) => {
    if (low === high) return `${low}${unit || ''}`;
    return `${low}-${high}${unit || ''}`;
  };

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-4">
        <div className="flex gap-4">
          {log.image_url && (
            <img
              src={log.image_url}
              alt={log.food_identified}
              className="w-20 h-20 rounded-lg object-cover flex-shrink-0"
            />
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="font-medium text-foreground line-clamp-2">
                  {log.food_identified}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {format(parseISO(log.logged_at), 'h:mm a')}
                </p>
              </div>
            </div>
            <div className="flex gap-4 mt-3 text-sm">
              <span className="text-primary font-medium">
                {formatRange(log.calories_low, log.calories_high)} kcal
              </span>
              <span className="text-muted-foreground">
                P: {formatRange(log.protein_low, log.protein_high)}g
              </span>
              <span className="text-muted-foreground">
                C: {formatRange(log.carbs_low, log.carbs_high)}g
              </span>
              <span className="text-muted-foreground">
                F: {formatRange(log.fat_low, log.fat_high)}g
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

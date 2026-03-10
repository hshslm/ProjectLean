import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { format, parseISO } from 'date-fns';
import { Pencil, Trash2, Star, Check, X, RotateCcw } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

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
  onEdit?: (id: string, updates: Partial<MealLog>) => void;
  onSaveAsTemplate?: (log: MealLog) => void;
  showActions?: boolean;
}

export const MealLogCard = ({ 
  log, 
  onDelete, 
  onEdit, 
  onSaveAsTemplate,
  showActions = true 
}: MealLogCardProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editValues, setEditValues] = useState({
    food_identified: log.food_identified,
    calories_low: log.calories_low,
    calories_high: log.calories_high,
    protein_low: log.protein_low,
    protein_high: log.protein_high,
  });

  const formatRange = (low: number, high: number, unit?: string) => {
    if (low === high) return `${low}${unit || ''}`;
    return `${low}-${high}${unit || ''}`;
  };

  const handleSaveEdit = () => {
    if (onEdit) {
      onEdit(log.id, editValues);
    }
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setEditValues({
      food_identified: log.food_identified,
      calories_low: log.calories_low,
      calories_high: log.calories_high,
      protein_low: log.protein_low,
      protein_high: log.protein_high,
    });
    setIsEditing(false);
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
              <div className="flex-1">
                {isEditing ? (
                  <Input
                    value={editValues.food_identified}
                    onChange={(e) => setEditValues(prev => ({ ...prev, food_identified: e.target.value }))}
                    className="text-sm h-8 mb-1"
                  />
                ) : (
                  <p className="font-medium text-foreground line-clamp-2">
                    {log.food_identified}
                  </p>
                )}
                <p className="text-xs text-muted-foreground mt-1">
                  {format(parseISO(log.logged_at), 'h:mm a')}
                </p>
              </div>
              {showActions && !isEditing && (
                <div className="flex gap-1">
                  {onSaveAsTemplate && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => onSaveAsTemplate(log)}
                      title="Save as favorite"
                    >
                      <Star className="w-3.5 h-3.5" />
                    </Button>
                  )}
                  {onEdit && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => setIsEditing(true)}
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </Button>
                  )}
                  {onDelete && (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-destructive hover:text-destructive"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Meal</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete this meal? This cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => onDelete(log.id)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  )}
                </div>
              )}
              {isEditing && (
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-primary"
                    onClick={handleSaveEdit}
                  >
                    <Check className="w-3.5 h-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={handleCancelEdit}
                  >
                    <X className="w-3.5 h-3.5" />
                  </Button>
                </div>
              )}
            </div>
            {isEditing ? (
              <div className="grid grid-cols-2 gap-2 mt-2">
                <div>
                  <label className="text-xs text-muted-foreground">Calories</label>
                  <div className="flex gap-1 items-center">
                    <Input
                      type="number"
                      value={editValues.calories_low}
                      onChange={(e) => setEditValues(prev => ({ ...prev, calories_low: parseInt(e.target.value) || 0 }))}
                      className="h-7 text-xs w-16"
                    />
                    <span className="text-xs">-</span>
                    <Input
                      type="number"
                      value={editValues.calories_high}
                      onChange={(e) => setEditValues(prev => ({ ...prev, calories_high: parseInt(e.target.value) || 0 }))}
                      className="h-7 text-xs w-16"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Protein (g)</label>
                  <div className="flex gap-1 items-center">
                    <Input
                      type="number"
                      value={editValues.protein_low}
                      onChange={(e) => setEditValues(prev => ({ ...prev, protein_low: parseInt(e.target.value) || 0 }))}
                      className="h-7 text-xs w-16"
                    />
                    <span className="text-xs">-</span>
                    <Input
                      type="number"
                      value={editValues.protein_high}
                      onChange={(e) => setEditValues(prev => ({ ...prev, protein_high: parseInt(e.target.value) || 0 }))}
                      className="h-7 text-xs w-16"
                    />
                  </div>
                </div>
              </div>
            ) : (
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
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
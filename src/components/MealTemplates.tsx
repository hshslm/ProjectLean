import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Star, Plus, Trash2, X } from 'lucide-react';
import SkeletonCard from '@/components/SkeletonCard';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
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

interface MealTemplate {
  id: string;
  name: string;
  food_identified: string;
  calories_low: number;
  calories_high: number;
  protein_low: number;
  protein_high: number;
  carbs_low: number;
  carbs_high: number;
  fat_low: number;
  fat_high: number;
  image_url: string | null;
}

interface MealTemplatesProps {
  userId: string;
  onUseTemplate: (template: MealTemplate) => void;
}

export const MealTemplates = ({ userId, onUseTemplate }: MealTemplatesProps) => {
  const [templates, setTemplates] = useState<MealTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (open) {
      fetchTemplates();
    }
  }, [open, userId]);

  const fetchTemplates = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('meal_templates')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching templates:', error);
    } else {
      setTemplates(data || []);
    }
    setIsLoading(false);
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase
      .from('meal_templates')
      .delete()
      .eq('id', id);

    if (error) {
      toast.error('Failed to delete template');
    } else {
      toast.success('Template deleted');
      fetchTemplates();
    }
  };

  const handleUse = (template: MealTemplate) => {
    onUseTemplate(template);
    setOpen(false);
    toast.success(`Added ${template.name}`);
  };

  const formatRange = (low: number, high: number) => {
    if (low === high) return `${low}`;
    return `${low}-${high}`;
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Star className="w-4 h-4" />
          Favorites
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Favorite Meals</SheetTitle>
          <SheetDescription>
            Quickly log meals you eat often
          </SheetDescription>
        </SheetHeader>
        
        <div className="mt-6 space-y-3">
          {isLoading ? (
            <div className="space-y-3"><SkeletonCard /><SkeletonCard /></div>
          ) : templates.length === 0 ? (
            <div className="text-center py-8">
              <Star className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
              <p className="text-muted-foreground">No favorites yet</p>
              <p className="text-sm text-muted-foreground mt-1">
                Tap the star on any logged meal to save it
              </p>
            </div>
          ) : (
            templates.map((template) => (
              <Card key={template.id} className="overflow-hidden">
                <CardContent className="p-3">
                  <div className="flex gap-3">
                    {template.image_url && (
                      <img
                        src={template.image_url}
                        alt={template.name}
                        className="w-14 h-14 rounded-lg object-cover flex-shrink-0"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground text-sm line-clamp-1">
                        {template.name}
                      </p>
                      <p className="text-xs text-muted-foreground line-clamp-1">
                        {template.food_identified}
                      </p>
                      <div className="flex gap-3 mt-1 text-xs text-muted-foreground">
                        <span className="text-primary font-medium">
                          {formatRange(template.calories_low, template.calories_high)} kcal
                        </span>
                        <span>P: {formatRange(template.protein_low, template.protein_high)}g</span>
                      </div>
                    </div>
                    <div className="flex flex-col gap-1">
                      <Button
                        variant="coral"
                        size="sm"
                        className="h-7 px-2 text-xs"
                        onClick={() => handleUse(template)}
                      >
                        <Plus className="w-3 h-3 mr-1" />
                        Add
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 px-2 text-destructive hover:text-destructive"
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Favorite</AlertDialogTitle>
                            <AlertDialogDescription>
                              Remove "{template.name}" from your favorites?
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDelete(template.id)}
                              className="bg-destructive text-destructive-foreground"
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};
import React, { useState } from 'react';
import { X, Hand, CreditCard, Circle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

const guides = [
  {
    icon: <Hand className="w-6 h-6" />,
    title: 'Palm = Protein',
    description: 'Your palm (no fingers) ≈ 3-4oz / 85-115g of meat, fish, or poultry',
    examples: '~25-30g protein',
  },
  {
    icon: <Circle className="w-6 h-6" />,
    title: 'Fist = Carbs',
    description: 'Your closed fist ≈ 1 cup of rice, pasta, or vegetables',
    examples: '~30-45g carbs for grains',
  },
  {
    icon: <CreditCard className="w-6 h-6" />,
    title: 'Thumb = Fats',
    description: 'Your thumb tip to knuckle ≈ 1 tbsp of oil, butter, or nut butter',
    examples: '~14g fat',
  },
  {
    icon: (
      <div className="flex -space-x-1">
        <Circle className="w-4 h-4" />
        <Circle className="w-4 h-4" />
      </div>
    ),
    title: 'Cupped Hand = Snacks',
    description: 'Your cupped hand ≈ 1oz of nuts, chips, or small snacks',
    examples: '~150-200 calories',
  },
];

interface VisualPortionGuideProps {
  trigger?: React.ReactNode;
}

export const VisualPortionGuide: React.FC<VisualPortionGuideProps> = ({ trigger }) => {
  return (
    <Dialog>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="ghost" size="sm" className="text-muted-foreground">
            <Hand className="w-4 h-4 mr-1" />
            Portion guide
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Hand className="w-5 h-5 text-sage" />
            Hand-Based Portion Guide
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 mt-4">
          {guides.map((guide, index) => (
            <div
              key={index}
              className="flex gap-4 p-4 rounded-xl bg-secondary"
            >
              <div className="p-3 rounded-lg bg-sage-light text-sage-dark flex-shrink-0">
                {guide.icon}
              </div>
              <div>
                <h4 className="font-semibold text-foreground mb-1">{guide.title}</h4>
                <p className="text-sm text-muted-foreground mb-1">{guide.description}</p>
                <p className="text-xs text-sage-dark font-medium">{guide.examples}</p>
              </div>
            </div>
          ))}
        </div>

        <p className="text-xs text-muted-foreground text-center mt-4">
          These are general guidelines. Individual hands vary, but this gives you a quick reference without measuring.
        </p>
      </DialogContent>
    </Dialog>
  );
};

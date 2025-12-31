import React from 'react';
import { Sparkles } from 'lucide-react';

export const LoadingState: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center py-12 gap-4 animate-fade-up">
      <div className="relative">
        <div className="p-4 rounded-full bg-sage-light">
          <Sparkles className="w-6 h-6 text-sage animate-pulse-soft" />
        </div>
        <div className="absolute inset-0 rounded-full bg-sage/20 animate-ping" />
      </div>
      <div className="text-center">
        <p className="font-display font-medium text-foreground mb-1">
          Analyzing your meal...
        </p>
        <p className="text-sm text-muted-foreground">
          This usually takes a few seconds
        </p>
      </div>
    </div>
  );
};

import React from 'react';
import { Lightbulb, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ReferenceObjectTipProps {
  onDismiss: () => void;
  className?: string;
}

export const ReferenceObjectTip: React.FC<ReferenceObjectTipProps> = ({
  onDismiss,
  className,
}) => {
  return (
    <div
      className={cn(
        "relative p-4 rounded-xl bg-amber-50 border border-amber-200 animate-fade-up",
        className
      )}
    >
      <button
        onClick={onDismiss}
        className="absolute top-2 right-2 p-1 rounded-full hover:bg-amber-100 transition-colors"
        aria-label="Dismiss tip"
      >
        <X className="w-3.5 h-3.5 text-amber-600" />
      </button>
      <div className="flex items-start gap-3 pr-6">
        <div className="p-2 rounded-lg bg-amber-100 flex-shrink-0">
          <Lightbulb className="w-4 h-4 text-amber-600" />
        </div>
        <div>
          <p className="font-medium text-amber-800 text-sm mb-1">
            Pro tip for accuracy
          </p>
          <p className="text-amber-700 text-xs leading-relaxed">
            Include a common object (fork, credit card, or your hand) in the photo for size reference. This helps estimate portions more accurately.
          </p>
        </div>
      </div>
    </div>
  );
};

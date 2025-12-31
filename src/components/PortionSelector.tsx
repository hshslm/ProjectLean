import React from 'react';
import { cn } from '@/lib/utils';

export type PortionSize = 'small' | 'medium' | 'large';

interface PortionSelectorProps {
  value: PortionSize;
  onChange: (size: PortionSize) => void;
  disabled?: boolean;
}

const portions: { value: PortionSize; label: string; description: string }[] = [
  { value: 'small', label: 'Small', description: 'Lighter portion' },
  { value: 'medium', label: 'Medium', description: 'Regular serving' },
  { value: 'large', label: 'Large', description: 'Bigger portion' },
];

export const PortionSelector: React.FC<PortionSelectorProps> = ({
  value,
  onChange,
  disabled = false,
}) => {
  return (
    <div className="grid grid-cols-3 gap-2">
      {portions.map((portion) => (
        <button
          key={portion.value}
          type="button"
          onClick={() => onChange(portion.value)}
          disabled={disabled}
          className={cn(
            "flex flex-col items-center p-3 rounded-xl border-2 transition-all duration-200",
            "focus:outline-none focus:ring-2 focus:ring-sage focus:ring-offset-2",
            value === portion.value
              ? "border-sage bg-sage-light text-sage-dark"
              : "border-border bg-card text-muted-foreground hover:border-sage/50",
            disabled && "opacity-50 cursor-not-allowed"
          )}
        >
          <span className="font-medium text-sm">{portion.label}</span>
          <span className="text-xs mt-0.5 opacity-70">{portion.description}</span>
        </button>
      ))}
    </div>
  );
};

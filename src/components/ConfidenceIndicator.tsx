import React from 'react';
import { cn } from '@/lib/utils';
import { AlertCircle, CheckCircle, HelpCircle } from 'lucide-react';

export type ConfidenceLevel = 'high' | 'medium' | 'low';

interface ConfidenceIndicatorProps {
  level: ConfidenceLevel;
  reason?: string;
}

const config: Record<ConfidenceLevel, { 
  icon: React.ReactNode; 
  label: string; 
  color: string; 
  bg: string;
  description: string;
}> = {
  high: {
    icon: <CheckCircle className="w-4 h-4" />,
    label: 'High confidence',
    color: 'text-emerald-600',
    bg: 'bg-emerald-50 border-emerald-200',
    description: 'Clear photo with identifiable foods',
  },
  medium: {
    icon: <HelpCircle className="w-4 h-4" />,
    label: 'Medium confidence',
    color: 'text-amber-600',
    bg: 'bg-amber-50 border-amber-200',
    description: 'Some uncertainty in portions or ingredients',
  },
  low: {
    icon: <AlertCircle className="w-4 h-4" />,
    label: 'Lower confidence',
    color: 'text-rose-600',
    bg: 'bg-rose-50 border-rose-200',
    description: 'Limited visibility or unclear portions',
  },
};

export const ConfidenceIndicator: React.FC<ConfidenceIndicatorProps> = ({
  level,
  reason,
}) => {
  const { icon, label, color, bg, description } = config[level];

  return (
    <div className={cn("p-3 rounded-xl border", bg)}>
      <div className="flex items-center gap-2 mb-1">
        <span className={color}>{icon}</span>
        <span className={cn("font-medium text-sm", color)}>{label}</span>
      </div>
      <p className="text-xs text-muted-foreground">
        {reason || description}
      </p>
    </div>
  );
};

import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Users } from 'lucide-react';

interface FoundersCounterProps {
  variant?: 'hero' | 'card';
}

export const FoundersCounter = ({ variant = 'hero' }: FoundersCounterProps) => {
  const [claimed, setClaimed] = useState<number | null>(null);
  const total = 50;

  useEffect(() => {
    supabase.functions.invoke('get-founders-count').then(({ data }) => {
      if (data?.claimed !== undefined) setClaimed(data.claimed);
    });
  }, []);

  if (claimed === null) return null;

  const remaining = Math.max(0, total - claimed);
  const percentage = Math.min((claimed / total) * 100, 100);

  if (variant === 'card') {
    return (
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5 text-primary" />
            <span className="text-xs font-semibold text-foreground">
              {claimed}/{total} spots taken
            </span>
          </div>
          <span className={`text-xs font-bold ${remaining <= 10 ? 'text-primary animate-pulse' : 'text-muted-foreground'}`}>
            {remaining} left
          </span>
        </div>
        <div className="w-full h-2.5 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-primary rounded-full transition-all duration-1000 ease-out"
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>
    );
  }

  // Hero variant — live counter style
  return (
    <div className="inline-flex items-center gap-3 px-5 py-2.5 rounded-full bg-foreground/5 border border-border">
      <div className="flex items-center gap-1.5">
        <span className="relative flex h-2.5 w-2.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-primary"></span>
        </span>
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Live</span>
      </div>
      <span className="text-sm font-bold text-foreground">
        <span className="text-primary text-lg">{claimed}</span>
        <span className="text-muted-foreground font-normal"> / {total} founders spots taken</span>
      </span>
    </div>
  );
};

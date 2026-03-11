import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Flame } from 'lucide-react';

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
  const isAlmostGone = remaining <= 10;

  if (variant === 'card') {
    return (
      <div className="mb-6">
        <div className="flex items-center justify-between text-xs mb-1.5">
          <span className="font-medium text-muted-foreground">
            {claimed} / {total} spots claimed
          </span>
          {isAlmostGone && (
            <span className="text-primary font-semibold flex items-center gap-1">
              <Flame className="w-3 h-3" />
              {remaining} left
            </span>
          )}
        </div>
        <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-primary rounded-full transition-all duration-1000 ease-out"
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20">
      <Flame className="w-4 h-4 text-primary" />
      <span className="text-sm font-semibold text-foreground">
        {remaining > 0 ? (
          <>
            <span className="text-primary">{claimed}</span> / {total} founders spots claimed
          </>
        ) : (
          'Founders pricing is sold out'
        )}
      </span>
    </div>
  );
};

import { Badge } from '@/components/ui/badge';
import { Sparkles } from 'lucide-react';

interface ScanCounterProps {
  remainingScans: number;
  isSubscribed: boolean;
  freeScanLimit: number;
}

export const ScanCounter = ({ remainingScans, isSubscribed, freeScanLimit }: ScanCounterProps) => {
  if (isSubscribed) {
    return (
      <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20">
        <Sparkles className="h-3 w-3 mr-1" />
        Pro
      </Badge>
    );
  }

  const isLow = remainingScans <= 3;

  return (
    <Badge 
      variant="secondary" 
      className={isLow 
        ? "bg-destructive/10 text-destructive border-destructive/20" 
        : "bg-muted text-muted-foreground"
      }
    >
      {remainingScans}/{freeScanLimit} free scans
    </Badge>
  );
};

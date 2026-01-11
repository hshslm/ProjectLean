import { Badge } from '@/components/ui/badge';
import { Sparkles } from 'lucide-react';

interface ScanCounterProps {
  remainingScans: number;
  isSubscribed: boolean;
  totalScans: number;
}

export const ScanCounter = ({ remainingScans, isSubscribed, totalScans }: ScanCounterProps) => {
  const isLow = remainingScans <= 3;

  return (
    <Badge 
      variant="secondary" 
      className={
        isSubscribed
          ? "bg-primary/10 text-primary border-primary/20"
          : isLow 
            ? "bg-destructive/10 text-destructive border-destructive/20" 
            : "bg-muted text-muted-foreground"
      }
    >
      {isSubscribed && <Sparkles className="h-3 w-3 mr-1" />}
      {remainingScans}/{totalScans} scans
    </Badge>
  );
};

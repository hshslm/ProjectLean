import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Check, Sparkles, Zap, TrendingUp } from 'lucide-react';

interface PaywallModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubscribe: () => void;
}

export const PaywallModal = ({ open, onOpenChange, onSubscribe }: PaywallModalProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center text-2xl font-bold flex items-center justify-center gap-2">
            <Sparkles className="h-6 w-6 text-primary" />
            Upgrade to Pro
          </DialogTitle>
          <DialogDescription className="text-center">
            You've used all 6 free scans. Upgrade to continue tracking your meals.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="text-center">
            <div className="text-4xl font-bold text-primary">25 AED</div>
            <div className="text-muted-foreground">per month</div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                <Zap className="h-4 w-4 text-primary" />
              </div>
              <span>50 meal scans included</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                <TrendingUp className="h-4 w-4 text-primary" />
              </div>
              <span>Full meal history & tracking</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                <Check className="h-4 w-4 text-primary" />
              </div>
              <span>AI-powered macro estimates</span>
            </div>
          </div>

          <Button 
            onClick={onSubscribe} 
            className="w-full h-12 text-lg font-semibold"
          >
            Subscribe Now
          </Button>

          <p className="text-xs text-center text-muted-foreground">
            Cancel anytime. Secure payment via Stripe.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};

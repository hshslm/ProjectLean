import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Check, Sparkles, Brain, UtensilsCrossed } from 'lucide-react';
import { Link } from 'react-router-dom';

interface PaywallModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubscribe: () => void;
}

export const PaywallModal = ({ open, onOpenChange, onSubscribe }: PaywallModalProps) => {
  const [termsAccepted, setTermsAccepted] = useState(false);

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) setTermsAccepted(false); onOpenChange(o); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center text-2xl font-bold flex items-center justify-center gap-2">
            <Sparkles className="h-6 w-6 text-primary" />
            Upgrade to Pro
          </DialogTitle>
          <DialogDescription className="text-center">
            Subscribe to unlock the full Lean Brain™ experience.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="text-center">
            <div className="text-4xl font-bold text-primary">129 AED</div>
            <div className="text-muted-foreground">per month</div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                <UtensilsCrossed className="h-4 w-4 text-primary" />
              </div>
              <span>Unlimited meal scans</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                <Brain className="h-4 w-4 text-primary" />
              </div>
              <span>AI coaching & weekly insights</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                <Check className="h-4 w-4 text-primary" />
              </div>
              <span>Full meal history & tracking</span>
            </div>
          </div>

          <div className="flex items-start gap-2">
            <Checkbox
              id="terms"
              checked={termsAccepted}
              onCheckedChange={(checked) => setTermsAccepted(checked === true)}
              className="mt-0.5"
            />
            <label htmlFor="terms" className="text-sm text-muted-foreground leading-tight cursor-pointer">
              I agree to the{' '}
              <Link
                to="/terms"
                target="_blank"
                className="text-primary underline hover:text-primary/80"
              >
                Terms and Conditions
              </Link>
            </label>
          </div>

          <Button 
            onClick={onSubscribe} 
            className="w-full h-12 text-lg font-semibold"
            disabled={!termsAccepted}
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

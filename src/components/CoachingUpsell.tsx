import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowRight, Flame } from 'lucide-react';

const CALENDLY_LINK = 'https://calendly.com/projectlean/3times40-discovery-zoom-meeting';

export const CoachingUpsell: React.FC = () => {
  return (
    <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10 overflow-hidden relative">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/15 flex items-center justify-center shrink-0 mt-0.5">
            <Flame className="w-5 h-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-display font-bold text-foreground text-sm leading-tight">
              Ready to go further?
            </p>
            <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
              Join the 3×40 Coaching Program — 12 weeks of 1-on-1 coaching with Karim to transform your habits for good.
            </p>
            <Button
              variant="coral"
              size="sm"
              className="mt-3"
              onClick={() => window.open(CALENDLY_LINK, '_blank')}
            >
              Book a Call with Karim
              <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

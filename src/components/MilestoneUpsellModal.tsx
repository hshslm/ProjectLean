import React, { useState, useEffect } from 'react';
import { format, subDays } from 'date-fns';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ArrowRight, Trophy } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

const CALENDLY_LINK = 'https://calendly.com/projectlean/3times40-discovery-zoom-meeting';
const MILESTONE_KEY = 'coaching_upsell_shown';

interface MilestoneUpsellModalProps {
  userId: string;
}

export const MilestoneUpsellModal: React.FC<MilestoneUpsellModalProps> = ({ userId }) => {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    checkStreak();
  }, [userId]);

  const checkStreak = async () => {
    // Don't show if already dismissed
    const dismissed = localStorage.getItem(`${MILESTONE_KEY}_${userId}`);
    if (dismissed) return;

    // Get checkins from the last 7 days (local time, consistent with DailyCheckIn)
    const today = new Date();
    const dates: string[] = [];
    for (let i = 0; i < 7; i++) {
      dates.push(format(subDays(today, i), 'yyyy-MM-dd'));
    }

    const { data, error } = await supabase
      .from('daily_checkins')
      .select('checkin_date')
      .eq('user_id', userId)
      .in('checkin_date', dates);

    if (error || !data) return;

    const uniqueDays = new Set(data.map((d) => d.checkin_date));
    if (uniqueDays.size >= 7) {
      setOpen(true);
    }
  };

  const handleDismiss = () => {
    setOpen(false);
    localStorage.setItem(`${MILESTONE_KEY}_${userId}`, Date.now().toString());
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) handleDismiss(); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="text-center items-center">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-2">
            <Trophy className="w-8 h-8 text-primary" />
          </div>
          <DialogTitle className="font-display text-xl">
            7-Day Streak 🔥
          </DialogTitle>
          <DialogDescription className="text-sm leading-relaxed pt-2">
            You've checked in every day for a week straight. That's rare — and it tells me you're serious about this.
            <br /><br />
            Imagine what 12 weeks of focused 1-on-1 coaching could do. Let's talk about the <strong>3×40 Program</strong>.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-2 pt-2">
          <Button
            variant="coral"
            size="lg"
            className="w-full"
            onClick={() => {
              window.open(CALENDLY_LINK, '_blank');
              handleDismiss();
            }}
          >
            Book a Call with Karim
            <ArrowRight className="w-4 h-4 ml-1" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="text-muted-foreground"
            onClick={handleDismiss}
          >
            Maybe later
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

import React, { useState, useEffect } from 'react';
import { ClipboardCheck, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';

interface CheckInReminderProps {
  userId: string;
  onGoToCheckIn: () => void;
}

export const CheckInReminder: React.FC<CheckInReminderProps> = ({ userId, onGoToCheckIn }) => {
  const [show, setShow] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    checkTodayCheckin();
  }, [userId]);

  const checkTodayCheckin = async () => {
    const today = format(new Date(), 'yyyy-MM-dd');
    const { data } = await (supabase
      .from('daily_checkins' as any)
      .select('id')
      .eq('user_id', userId)
      .eq('checkin_date', today)
      .maybeSingle() as any);

    // Only show if no check-in exists today
    if (!data) {
      setShow(true);
    }
  };

  if (!show || dismissed) return null;

  return (
    <div className="flex items-center gap-3 p-3 rounded-xl bg-accent/10 border border-accent/20 animate-in fade-in slide-in-from-top-2 duration-300">
      <ClipboardCheck className="w-5 h-5 text-accent flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground">You haven't checked in today</p>
        <button
          onClick={onGoToCheckIn}
          className="text-xs font-medium text-accent hover:underline mt-0.5"
        >
          Do your check-in now →
        </button>
      </div>
      <button
        onClick={() => setDismissed(true)}
        className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors flex-shrink-0"
        aria-label="Dismiss"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};

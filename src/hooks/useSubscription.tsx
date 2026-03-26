import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

const STRIPE_PAYMENT_LINK = 'https://buy.stripe.com/dRm6oHaXr6Uw9hF1xG6c00C';

interface SubscriptionState {
  isSubscribed: boolean;
  isCoachingClient: boolean;
  loading: boolean;
  hasAccess: boolean;
  scanCount: number;
  checkinCount: number;
  canScan: boolean;
  canCheckIn: boolean;
}

export const useSubscription = () => {
  const { user } = useAuth();
  const [state, setState] = useState<SubscriptionState>({
    isSubscribed: false,
    isCoachingClient: false,
    loading: true,
    hasAccess: false,
    scanCount: 0,
    checkinCount: 0,
    canScan: false,
    canCheckIn: false,
  });

  const fetchSubscriptionStatus = useCallback(async () => {
    if (!user) {
      setState(prev => ({ ...prev, loading: false }));
      return;
    }

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) {
        console.error('Error fetching subscription:', error);
        setState(prev => ({ ...prev, loading: false }));
        return;
      }

      const profile = data as { is_subscribed?: boolean; is_coaching_client?: boolean; scan_count?: number; checkin_count?: number } | null;
      const isSubscribed = profile?.is_subscribed ?? false;
      const isCoachingClient = profile?.is_coaching_client ?? false;
      const hasAccess = isSubscribed || isCoachingClient;
      const scanCount = profile?.scan_count ?? 0;
      const checkinCount = profile?.checkin_count ?? 0;

      setState({
        isSubscribed,
        isCoachingClient,
        loading: false,
        hasAccess,
        scanCount,
        checkinCount,
        canScan: hasAccess || scanCount < 1,
        canCheckIn: hasAccess || checkinCount < 1,
      });
    } catch (err) {
      console.error('Error:', err);
      setState(prev => ({ ...prev, loading: false }));
    }
  }, [user]);

  useEffect(() => {
    fetchSubscriptionStatus();
  }, [fetchSubscriptionStatus]);

  const openPaymentLink = () => {
    window.open(STRIPE_PAYMENT_LINK, '_blank');
  };

  return {
    ...state,
    openPaymentLink,
    refetch: fetchSubscriptionStatus,
  };
};

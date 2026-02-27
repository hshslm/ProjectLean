import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

const STRIPE_PAYMENT_LINK = 'https://buy.stripe.com/8x23cv2qV2EgdxVcck6c00x';

interface SubscriptionState {
  isSubscribed: boolean;
  isCoachingClient: boolean;
  loading: boolean;
  hasAccess: boolean;
}

export const useSubscription = () => {
  const { user } = useAuth();
  const [state, setState] = useState<SubscriptionState>({
    isSubscribed: false,
    isCoachingClient: false,
    loading: true,
    hasAccess: false,
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

      const profile = data as { is_subscribed?: boolean; is_coaching_client?: boolean } | null;
      const isSubscribed = profile?.is_subscribed ?? false;
      const isCoachingClient = profile?.is_coaching_client ?? false;
      const hasAccess = isSubscribed || isCoachingClient;

      setState({
        isSubscribed,
        isCoachingClient,
        loading: false,
        hasAccess,
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

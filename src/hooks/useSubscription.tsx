import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

const FREE_SCAN_LIMIT = 10;
const PAID_SCAN_LIMIT = 50;
const STRIPE_PAYMENT_LINK = 'https://buy.stripe.com/8x23cv2qV2EgdxVcck6c00x';

interface SubscriptionState {
  scanCount: number;
  isSubscribed: boolean;
  loading: boolean;
  canScan: boolean;
  remainingScans: number;
  totalScans: number;
}

export const useSubscription = () => {
  const { user } = useAuth();
  const [state, setState] = useState<SubscriptionState>({
    scanCount: 0,
    isSubscribed: false,
    loading: true,
    canScan: true,
    remainingScans: FREE_SCAN_LIMIT,
    totalScans: FREE_SCAN_LIMIT,
  });

  const fetchSubscriptionStatus = useCallback(async () => {
    if (!user) {
      setState(prev => ({ ...prev, loading: false }));
      return;
    }

    try {
      // Use raw query since types might not be updated yet
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

      // Cast to access new columns
      const profile = data as { scan_count?: number; is_subscribed?: boolean } | null;
      const scanCount = profile?.scan_count ?? 0;
      const isSubscribed = profile?.is_subscribed ?? false;
      
      // For subscribers: they get 50 scans total, remaining = 50 - used
      // For free users: they get 10 scans total, remaining = 10 - used
      const totalScans = isSubscribed ? PAID_SCAN_LIMIT : FREE_SCAN_LIMIT;
      const remainingScans = Math.max(0, totalScans - scanCount);
      const canScan = remainingScans > 0;

      setState({
        scanCount,
        isSubscribed,
        loading: false,
        canScan,
        remainingScans,
        totalScans,
      });
    } catch (err) {
      console.error('Error:', err);
      setState(prev => ({ ...prev, loading: false }));
    }
  }, [user]);

  useEffect(() => {
    fetchSubscriptionStatus();
  }, [fetchSubscriptionStatus]);

  const incrementScanCount = async (): Promise<boolean> => {
    if (!user) return false;

    // Check if under limit (both free and paid users have limits now)
    const limit = state.isSubscribed ? PAID_SCAN_LIMIT : FREE_SCAN_LIMIT;
    if (state.scanCount >= limit) {
      return false;
    }

    try {
      const newCount = state.scanCount + 1;
      // Use type assertion for new columns
      const { error } = await supabase
        .from('profiles')
        .update({ scan_count: newCount } as Record<string, unknown>)
        .eq('user_id', user.id);

      if (error) {
        console.error('Error incrementing scan count:', error);
        return false;
      }

      const remainingScans = Math.max(0, limit - newCount);
      setState(prev => ({
        ...prev,
        scanCount: newCount,
        canScan: remainingScans > 0,
        remainingScans,
      }));

      return true;
    } catch (err) {
      console.error('Error:', err);
      return false;
    }
  };

  const openPaymentLink = () => {
    window.open(STRIPE_PAYMENT_LINK, '_blank');
  };

  return {
    ...state,
    incrementScanCount,
    openPaymentLink,
    refetch: fetchSubscriptionStatus,
    freeScanLimit: FREE_SCAN_LIMIT,
  };
};

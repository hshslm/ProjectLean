import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Loader2, WifiOff } from 'lucide-react';
import { MealEstimator } from '@/components/MealEstimator';
import ErrorBoundary from '@/components/ErrorBoundary';

const Index = () => {
  const { user, role, loading } = useAuth();
  const navigate = useNavigate();
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  useEffect(() => {
    const goOnline = () => setIsOffline(false);
    const goOffline = () => setIsOffline(true);
    window.addEventListener('online', goOnline);
    window.addEventListener('offline', goOffline);
    return () => {
      window.removeEventListener('online', goOnline);
      window.removeEventListener('offline', goOffline);
    };
  }, []);

  useEffect(() => {
    if (!loading) {
      if (!user) {
        navigate('/auth');
      } else if (role === 'admin') {
        navigate('/admin');
      }
    }
  }, [user, role, loading, navigate]);

  // Show loading while auth or role is loading
  if (loading || (user && role === null)) {
    return (
      <div className="min-h-screen gradient-warm flex flex-col items-center justify-center gap-3">
        {isOffline ? (
          <>
            <WifiOff className="w-8 h-8 text-muted-foreground" />
            <p className="text-muted-foreground text-sm">You're offline. Please check your connection.</p>
          </>
        ) : (
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        )}
      </div>
    );
  }

  // Only clients see the meal estimator
  if (user && role === 'client') {
    return <ErrorBoundary><MealEstimator /></ErrorBoundary>;
  }

  return null;
};

export default Index;

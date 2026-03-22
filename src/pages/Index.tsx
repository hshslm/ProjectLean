import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Loader2 } from 'lucide-react';
import { MealEstimator } from '@/components/MealEstimator';
import ErrorBoundary from '@/components/ErrorBoundary';

const Index = () => {
  const { user, role, loading } = useAuth();
  const navigate = useNavigate();

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
      <div className="min-h-screen gradient-warm flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
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

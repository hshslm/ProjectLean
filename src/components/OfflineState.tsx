import { useState, useEffect } from 'react';
import { WifiOff } from 'lucide-react';
import { Button } from '@/components/ui/button';

const OfflineState = () => {
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  useEffect(() => {
    const goOffline = () => setIsOffline(true);
    const goOnline = () => setIsOffline(false);
    window.addEventListener('offline', goOffline);
    window.addEventListener('online', goOnline);
    return () => {
      window.removeEventListener('offline', goOffline);
      window.removeEventListener('online', goOnline);
    };
  }, []);

  if (!isOffline) return null;

  return (
    <div className="fixed inset-0 z-[100] min-h-screen gradient-warm flex flex-col items-center justify-center px-4">
      <WifiOff className="w-12 h-12 text-muted-foreground mb-4" />
      <h2 className="text-lg font-semibold text-foreground mb-2">You're offline</h2>
      <p className="text-sm text-muted-foreground text-center mb-6 max-w-xs">
        Please check your connection and try again.
      </p>
      <Button variant="coral" onClick={() => window.location.reload()}>
        Try Again
      </Button>
    </div>
  );
};

export default OfflineState;

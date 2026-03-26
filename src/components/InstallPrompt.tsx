import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Download, Share, X, Smartphone } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

export const InstallPrompt: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showIOSInstructions, setShowIOSInstructions] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // Check if already installed
    const standalone = window.matchMedia('(display-mode: standalone)').matches;
    setIsStandalone(standalone);

    // Detect iOS
    const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    setIsIOS(iOS);

    // Check if dismissed before
    const wasDismissed = localStorage.getItem('install-prompt-dismissed');
    if (wasDismissed) {
      setDismissed(true);
    }

    // Listen for install prompt (Android/Desktop)
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
    }
  };

  const handleDismiss = () => {
    setDismissed(true);
    localStorage.setItem('install-prompt-dismissed', 'true');
  };

  // Don't show if already installed, dismissed, or no prompt available (except iOS)
  if (isStandalone || dismissed || (!deferredPrompt && !isIOS)) {
    return null;
  }

  return (
    <>
      {/* Install Banner */}
      <div className="fixed bottom-0 left-0 right-0 z-[55] animate-fade-up safe-area-bottom">
        <div className="max-w-lg mx-auto px-4 pb-4">
          <div className="flex items-center gap-3 p-3 bg-card rounded-2xl border border-border shadow-elevated">
            <div className="p-2 rounded-xl bg-sage-light shrink-0">
              <Smartphone className="w-5 h-5 text-sage-dark" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground">
                Add to Home Screen
              </p>
              <p className="text-xs text-muted-foreground truncate">
                Quick access to The Lean Brain
              </p>
            </div>
            {isIOS ? (
              <Button
                onClick={() => setShowIOSInstructions(true)}
                variant="sage"
                size="sm"
                className="shrink-0"
              >
                <Share className="w-4 h-4 mr-1" />
                How
              </Button>
            ) : (
              <Button
                onClick={handleInstall}
                variant="sage"
                size="sm"
                className="shrink-0"
              >
                <Download className="w-4 h-4 mr-1" />
                Install
              </Button>
            )}
            <button
              onClick={handleDismiss}
              className="p-1.5 text-muted-foreground hover:text-foreground transition-colors shrink-0"
              aria-label="Dismiss"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* iOS Instructions Modal */}
      {showIOSInstructions && (
        <div 
          className="fixed inset-0 bg-foreground/50 z-[60] flex items-end sm:items-center justify-center p-4"
          onClick={() => setShowIOSInstructions(false)}
        >
          <div
            className="bg-card rounded-2xl p-6 pb-8 max-w-sm w-full shadow-floating animate-fade-up safe-area-bottom"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display text-lg font-semibold text-foreground">
                Add to Home Screen
              </h3>
              <button
                onClick={() => setShowIOSInstructions(false)}
                className="p-1 text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-full bg-sage-light flex items-center justify-center shrink-0 text-sm font-medium text-sage-dark">
                  1
                </div>
                <p className="text-sm text-foreground pt-0.5">
                  Tap the <Share className="w-4 h-4 inline mx-0.5 -mt-0.5" /> share button at the bottom of Safari
                </p>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-full bg-sage-light flex items-center justify-center shrink-0 text-sm font-medium text-sage-dark">
                  2
                </div>
                <p className="text-sm text-foreground pt-0.5">
                  Scroll down and tap <strong>"Add to Home Screen"</strong>
                </p>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-full bg-sage-light flex items-center justify-center shrink-0 text-sm font-medium text-sage-dark">
                  3
                </div>
                <p className="text-sm text-foreground pt-0.5">
                  Tap <strong>"Add"</strong> in the top right corner
                </p>
              </div>
            </div>

            <Button
              onClick={() => setShowIOSInstructions(false)}
              variant="sage"
              className="w-full mt-6"
            >
              Got it
            </Button>
          </div>
        </div>
      )}
    </>
  );
};

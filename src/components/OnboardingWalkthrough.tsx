import React, { useState, useEffect } from 'react';
import { Camera, ClipboardCheck, BarChart3, MessageSquare, LifeBuoy, Settings, ArrowRight, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import projectLeanLogo from '@/assets/project-lean-logo.png';

const ONBOARDING_KEY = 'project-lean-onboarding-completed';

interface Step {
  icon: React.ReactNode;
  title: string;
  description: string;
}

const STEPS: Step[] = [
  {
    icon: <Camera className="w-8 h-8 text-accent" />,
    title: 'Scan Your Meals',
    description: 'Snap a photo of any meal and get an instant macro estimate. Add notes, adjust portions, or type a description — your call.',
  },
  {
    icon: <ClipboardCheck className="w-8 h-8 text-accent" />,
    title: 'Daily Check-In',
    description: 'Track 5 daily habits (protein, steps, training, sleep, aligned eating), log your mood & stress, and identify any negative thought patterns.',
  },
  {
    icon: <BarChart3 className="w-8 h-8 text-accent" />,
    title: 'Weekly Insights',
    description: 'See your patterns over time — habit streaks, recurring cognitive traps, and trend data that shows what\'s actually working.',
  },
  {
    icon: <MessageSquare className="w-8 h-8 text-accent" />,
    title: 'Lean Brain Chat',
    description: 'Ask Karim\'s coaching logic anything — about your habits, nutrition, or what to do when the plan breaks. Direct answers, no fluff.',
  },
  {
    icon: <Settings className="w-8 h-8 text-accent" />,
    title: 'Set Your Goals',
    description: 'Tap the gear icon to set your calorie and protein targets. The app tracks your progress against these every day.',
  },
  {
    icon: <LifeBuoy className="w-8 h-8 text-accent" />,
    title: 'Reset Protocol',
    description: 'The red button in the bottom-right corner. Use it when you\'re spiraling — it walks you through 5 steps to get back on track.',
  },
];

interface OnboardingWalkthroughProps {
  userId: string;
}

export const OnboardingWalkthrough: React.FC<OnboardingWalkthroughProps> = ({ userId }) => {
  const [show, setShow] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    const key = `${ONBOARDING_KEY}-${userId}`;
    const completed = localStorage.getItem(key);
    if (!completed) {
      setShow(true);
    }
  }, [userId]);

  const handleComplete = () => {
    const key = `${ONBOARDING_KEY}-${userId}`;
    localStorage.setItem(key, 'true');
    setShow(false);
  };

  const handleNext = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      handleComplete();
    }
  };

  const handleSkip = () => {
    handleComplete();
  };

  if (!show) return null;

  const step = STEPS[currentStep];
  const isLast = currentStep === STEPS.length - 1;

  return (
    <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-300">
      <div className="w-full max-w-sm bg-card rounded-3xl shadow-elevated border border-border/50 overflow-hidden animate-in zoom-in-95 duration-300">
        {/* Header */}
        <div className="flex items-center justify-between p-4 pb-0">
          <div className="flex items-center gap-2">
            <img src={projectLeanLogo} alt="" className="h-6" />
            <span className="text-xs font-medium text-muted-foreground">
              {currentStep + 1} of {STEPS.length}
            </span>
          </div>
          <button
            onClick={handleSkip}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
            aria-label="Skip tutorial"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Progress dots */}
        <div className="flex gap-1.5 px-4 pt-3">
          {STEPS.map((_, i) => (
            <div
              key={i}
              className={`h-1 rounded-full flex-1 transition-all duration-300 ${
                i <= currentStep ? 'bg-accent' : 'bg-muted'
              }`}
            />
          ))}
        </div>

        {/* Content */}
        <div className="p-6 pt-5 text-center">
          <div className="w-16 h-16 rounded-2xl bg-accent/10 flex items-center justify-center mx-auto mb-4">
            {step.icon}
          </div>
          <h2 className="font-display text-xl font-bold text-foreground mb-2">
            {step.title}
          </h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {step.description}
          </p>
        </div>

        {/* Actions */}
        <div className="p-4 pt-0 space-y-2">
          <Button
            variant="coral"
            size="lg"
            className="w-full"
            onClick={handleNext}
          >
            {isLast ? "Let's go" : 'Next'}
            <ArrowRight className="w-4 h-4 ml-1" />
          </Button>
          {!isLast && (
            <button
              onClick={handleSkip}
              className="w-full text-sm text-muted-foreground hover:text-foreground transition-colors py-1"
            >
              Skip tutorial
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

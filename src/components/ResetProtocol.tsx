import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Check, RotateCcw, Footprints, GlassWater, Beef } from 'lucide-react';

const RESET_STEPS = [
  {
    title: 'Pause & Breathe',
    description: '3 deep breaths. This moment does not define your day.',
  },
  {
    title: 'Name the Pattern',
    description: 'Say it out loud: "I\'m in all-or-nothing mode" or "I\'m eating emotionally." Awareness breaks the loop.',
  },
  {
    title: 'Zoom Out',
    description: 'One meal is 1 out of 21 this week. One bad hour is 1 out of 112 waking hours. The math is on your side.',
  },
  {
    title: 'Next Best Action',
    description: 'Pick one thing you can do in the next 30 minutes:',
    actions: [
      { label: 'Go for a walk', icon: Footprints },
      { label: 'Drink water', icon: GlassWater },
      { label: 'Protein snack', icon: Beef },
    ],
  },
  {
    title: 'Recommit to Today',
    description: 'You\'re not starting over tomorrow. You\'re continuing right now. This is what high-performers do — they recover fast.',
  },
] as const;

interface ResetProtocolProps {
  onComplete: () => void;
  isCompleted: boolean;
  defaultExpanded?: boolean;
}

export const ResetProtocol: React.FC<ResetProtocolProps> = ({ onComplete, isCompleted, defaultExpanded = false }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  const handleStepComplete = (stepIndex: number) => {
    if (!completedSteps.includes(stepIndex)) {
      const updated = [...completedSteps, stepIndex];
      setCompletedSteps(updated);

      if (updated.length === RESET_STEPS.length) {
        onComplete();
      } else if (stepIndex === currentStep && currentStep < RESET_STEPS.length - 1) {
        setCurrentStep(currentStep + 1);
      }
    }
  };

  const allDone = completedSteps.length === RESET_STEPS.length || isCompleted;

  return (
    <Card className="border-destructive/20 bg-destructive/5">
      <CardHeader className="pb-2">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center justify-between w-full text-left"
        >
          <div className="flex items-center gap-2">
            <RotateCcw className="w-4 h-4 text-destructive" />
            <CardTitle className="text-sm font-semibold text-destructive">
              Reset Protocol
            </CardTitle>
          </div>
          {allDone && (
            <span className="text-xs text-primary font-medium flex items-center gap-1">
              <Check className="w-3 h-3" /> Completed
            </span>
          )}
        </button>
        {!isExpanded && (
          <p className="text-xs text-muted-foreground mt-1">
            A negative pattern was detected. Tap to start the 5-step reset.
          </p>
        )}
      </CardHeader>

      {isExpanded && (
        <CardContent className="space-y-2 pt-0">
          {RESET_STEPS.map((step, index) => {
            const isDone = completedSteps.includes(index) || isCompleted;
            const isCurrent = index === currentStep && !allDone;

            return (
              <div
                key={index}
                className={`p-3 rounded-xl border transition-all duration-200 ${
                  isDone
                    ? 'bg-primary/10 border-primary/20'
                    : isCurrent
                      ? 'bg-background border-destructive/30 shadow-sm'
                      : 'bg-muted/30 border-transparent opacity-60'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 text-xs font-bold ${
                    isDone
                      ? 'bg-primary text-primary-foreground'
                      : isCurrent
                        ? 'bg-destructive text-destructive-foreground'
                        : 'bg-muted text-muted-foreground'
                  }`}>
                    {isDone ? <Check className="w-3 h-3" /> : index + 1}
                  </div>
                  <div className="flex-1">
                    <p className={`text-sm font-medium ${isDone ? 'text-foreground' : 'text-foreground'}`}>
                      {step.title}
                    </p>
                    {(isCurrent || isDone) && (
                      <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                        {step.description}
                      </p>
                    )}
                  </div>
                </div>

                {/* Action buttons for step 4 */}
                {'actions' in step && isCurrent && !isDone && (
                  <div className="flex gap-2 mt-3 ml-9">
                    {step.actions.map((action) => {
                      const Icon = action.icon;
                      return (
                        <Button
                          key={action.label}
                          variant="outline"
                          size="sm"
                          className="flex-1 gap-1.5 border-destructive/30 hover:bg-destructive/10 hover:text-destructive text-xs h-9"
                          onClick={() => handleStepComplete(index)}
                        >
                          <Icon className="w-3.5 h-3.5" />
                          {action.label}
                        </Button>
                      );
                    })}
                  </div>
                )}

                {/* Done it / complete button */}
                {isCurrent && !isDone && !('actions' in step) && (
                  <div className="mt-3 ml-9">
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-1.5 border-destructive/30 hover:bg-destructive/10 hover:text-destructive text-xs h-8 px-4"
                      onClick={() => handleStepComplete(index)}
                    >
                      <Check className="w-3 h-3" />
                      Done
                    </Button>
                  </div>
                )}
              </div>
            );
          })}

          {allDone && (
            <p className="text-xs text-primary font-medium text-center pt-2">
              Protocol complete. You recovered. That's the skill.
            </p>
          )}
        </CardContent>
      )}
    </Card>
  );
};

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { useLocalStorage } from '@/hooks/useLocalStorage';

const TUTORIAL_STEPS = [
  {
    id: 'welcome',
    title: 'Welcome to OneSong',
    content: "Let's get you started with the basics of managing your event.",
    target: 'body'
  },
  {
    id: 'queue', 
    title: 'Queue Management',
    content: "This is where you'll manage your playlist and upcoming songs.",
    target: '[data-tutorial="queue"]'
  },
  // More steps...
];

export function TutorialOverlay() {
  const [currentStep, setCurrentStep] = useState(0);
  const [isTutorialComplete, setTutorialComplete] = useLocalStorage('tutorial-complete', false);
  const [isVisible, setIsVisible] = useState(!isTutorialComplete);

  const handleNext = () => {
    if (currentStep < TUTORIAL_STEPS.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      setTutorialComplete(true);
      setIsVisible(false);
    }
  };

  return isVisible ? (
    <Dialog open={isVisible} onOpenChange={setIsVisible}>
      <DialogContent className="sm:max-w-md">
        <div className="space-y-4">
          <h2 className="text-xl font-bold">{TUTORIAL_STEPS[currentStep].title}</h2>
          <p>{TUTORIAL_STEPS[currentStep].content}</p>
          <div className="flex justify-between">
            <Button variant="outline" onClick={() => setIsVisible(false)}>
              Skip Tutorial
            </Button>
            <Button onClick={handleNext}>
              {currentStep === TUTORIAL_STEPS.length - 1 ? 'Finish' : 'Next'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  ) : null;
} 
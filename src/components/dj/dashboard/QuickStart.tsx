import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle2, Circle } from 'lucide-react';
import { useState } from 'react';

interface QuickStartStep {
  id: string;
  title: string;
  description: string;
  action: string;
  href: string;
}

const QUICK_START_STEPS: QuickStartStep[] = [
  {
    id: 'profile',
    title: 'Complete Your Profile',
    description: 'Add your details and preferences to personalize your experience',
    action: 'Update Profile',
    href: '/profile/edit'
  },
  {
    id: 'event',
    title: 'Create Your First Event',
    description: 'Set up an event and customize its settings',
    action: 'Create Event',
    href: '/events/create'
  },
  {
    id: 'spotify',
    title: 'Connect Spotify',
    description: 'Link your Spotify account to access your music library',
    action: 'Connect',
    href: '/settings/integrations'
  },
  {
    id: 'payment',
    title: 'Set Up Payments',
    description: 'Configure your payment settings to accept tips',
    action: 'Configure',
    href: '/settings/payments'
  }
];

export function QuickStart() {
  const [completedSteps, setCompletedSteps] = useState<Set<string>>(new Set());

  const toggleStep = (stepId: string) => {
    const newCompleted = new Set(completedSteps);
    if (newCompleted.has(stepId)) {
      newCompleted.delete(stepId);
    } else {
      newCompleted.add(stepId);
    }
    setCompletedSteps(newCompleted);
  };

  return (
    <Card className="p-6 space-y-6">
      <div className="space-y-2">
        <h2 className="text-2xl font-bold text-white">Quick Start Guide</h2>
        <p className="text-gray-400">
          Complete these steps to get the most out of OneSong
        </p>
      </div>

      <div className="space-y-4">
        {QUICK_START_STEPS.map((step) => (
          <div
            key={step.id}
            className="flex items-start space-x-4 p-4 rounded-lg bg-[#2E2F2E] border border-white/10"
          >
            <button
              onClick={() => toggleStep(step.id)}
              className="mt-1 focus:outline-none"
            >
              {completedSteps.has(step.id) ? (
                <CheckCircle2 className="w-5 h-5 text-[#F49620]" />
              ) : (
                <Circle className="w-5 h-5 text-gray-400" />
              )}
            </button>
            <div className="flex-1 min-w-0">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-white font-medium">{step.title}</h3>
                  <p className="text-sm text-gray-400">{step.description}</p>
                </div>
                <Button
                  variant="ghost"
                  className="text-[#F49620] hover:text-[#FF7200] hover:bg-[#F49620]/10"
                  href={step.href}
                >
                  {step.action}
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="flex justify-between items-center pt-4 border-t border-white/10">
        <p className="text-sm text-gray-400">
          {completedSteps.size} of {QUICK_START_STEPS.length} completed
        </p>
        <div className="bg-[#2E2F2E] rounded-full h-2 flex-1 mx-4">
          <div
            className="bg-[#F49620] rounded-full h-full transition-all"
            style={{
              width: `${(completedSteps.size / QUICK_START_STEPS.length) * 100}%`
            }}
          />
        </div>
      </div>
    </Card>
  );
}

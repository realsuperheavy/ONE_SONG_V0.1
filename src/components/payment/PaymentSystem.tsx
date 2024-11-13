'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { StatusIndicator, ProgressIndicator } from '@/components/ui/status/StatusSystem';
import { useToast } from '@/hooks/useToast';
import { analyticsService } from '@/lib/firebase/services/analytics';

interface PaymentStep {
  id: string;
  title: string;
  description: string;
  component: React.ReactNode;
}

interface PaymentSystemProps {
  eventId: string;
  amount: number;
  onSuccess: () => void;
  onCancel: () => void;
}

export function PaymentSystem({
  eventId,
  amount,
  onSuccess,
  onCancel
}: PaymentSystemProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const { showToast } = useToast();

  const steps: PaymentStep[] = [
    {
      id: 'amount',
      title: 'Confirm Amount',
      description: 'Review the payment amount',
      component: (
        <div className="text-center">
          <span className="text-3xl font-bold">${amount}</span>
        </div>
      )
    },
    {
      id: 'method',
      title: 'Payment Method',
      description: 'Select your payment method',
      component: (
        <div className="space-y-4">
          {/* Payment method selection */}
        </div>
      )
    },
    {
      id: 'confirm',
      title: 'Confirm Payment',
      description: 'Review and confirm your payment',
      component: (
        <div className="space-y-4">
          {/* Payment confirmation */}
        </div>
      )
    }
  ];

  const handleNext = async () => {
    if (currentStep === steps.length - 1) {
      setLoading(true);
      try {
        // Process payment logic here
        onSuccess();
        analyticsService.trackEvent('payment_completed', {
          eventId,
          amount
        });
      } catch (error) {
        showToast({
          title: 'Payment Failed',
          description: 'Please try again',
          variant: 'destructive'
        });
        analyticsService.trackError(error as Error, {
          context: 'payment_processing',
          eventId
        });
      } finally {
        setLoading(false);
      }
    } else {
      setCurrentStep(step => step + 1);
    }
  };

  return (
    <Card className="p-6 max-w-md mx-auto">
      <div className="space-y-6">
        {/* Progress Indicator */}
        <ProgressIndicator
          progress={(currentStep / (steps.length - 1)) * 100}
          type="info"
          className="mb-8"
        />

        {/* Step Content */}
        <div className="space-y-4">
          <h3 className="text-xl font-semibold">
            {steps[currentStep].title}
          </h3>
          <p className="text-gray-500">
            {steps[currentStep].description}
          </p>
          {steps[currentStep].component}
        </div>

        {/* Actions */}
        <div className="flex justify-between pt-6">
          <Button
            variant="outline"
            onClick={onCancel}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleNext}
            loading={loading}
          >
            {currentStep === steps.length - 1 ? 'Pay Now' : 'Next'}
          </Button>
        </div>

        {/* Status Indicator */}
        {loading && (
          <StatusIndicator
            type="loading"
            message="Processing payment..."
            className="mt-4"
          />
        )}
      </div>
    </Card>
  );
} 
'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/useToast';
import { analyticsService } from '@/lib/firebase/services/analytics';
import { loadStripe } from '@stripe/stripe-js';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_KEY!);

interface PaymentFlowProps {
  eventId: string;
  amount: number;
  description: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function PaymentFlow({ 
  eventId, 
  amount, 
  description,
  onSuccess,
  onCancel 
}: PaymentFlowProps) {
  const [loading, setLoading] = useState(false);
  const { showToast } = useToast();

  const handlePayment = async () => {
    setLoading(true);
    try {
      const stripe = await stripePromise;
      if (!stripe) throw new Error('Stripe failed to initialize');

      // Create payment intent
      const response = await fetch('/api/create-payment-intent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount,
          eventId,
          description
        }),
      });

      const { clientSecret } = await response.json();

      // Confirm payment
      const result = await stripe.confirmCardPayment(clientSecret);

      if (result.error) {
        throw new Error(result.error.message);
      }

      analyticsService.trackEvent('payment_completed', {
        eventId,
        amount,
        success: true
      });

      showToast({
        title: 'Payment Successful',
        description: 'Your payment has been processed',
        variant: 'default'
      });

      onSuccess?.();
    } catch (error) {
      analyticsService.trackError(error as Error, {
        context: 'payment_flow',
        eventId,
        amount
      });

      showToast({
        title: 'Payment Failed',
        description: error instanceof Error ? error.message : 'Payment processing failed',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="p-6 max-w-md mx-auto">
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold">Payment Details</h3>
          <p className="text-sm text-gray-500">{description}</p>
        </div>

        <div className="space-y-4">
          <div className="text-2xl font-bold">
            ${(amount / 100).toFixed(2)}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Card Information</label>
            <div id="card-element" className="p-3 border rounded-md bg-white/5" />
          </div>
        </div>

        <div className="flex gap-4">
          <Button
            onClick={handlePayment}
            loading={loading}
            className="flex-1"
          >
            Pay Now
          </Button>
          <Button
            variant="outline"
            onClick={onCancel}
            disabled={loading}
          >
            Cancel
          </Button>
        </div>
      </div>
    </Card>
  );
} 
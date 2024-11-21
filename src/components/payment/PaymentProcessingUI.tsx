import { useState, useEffect } from 'react';
import { useStripe, useElements, PaymentElement } from '@stripe/react-stripe-js';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { CheckCircle, XCircle } from 'lucide-react';
import { analyticsService } from '@/lib/firebase/services/analytics';

interface PaymentResult {
  id: string;
  status: 'succeeded' | 'failed';
  amount: number;
}

interface PaymentProcessingUIProps {
  amount: number;
  onComplete: (result: PaymentResult) => void;
  onError: (error: Error) => void;
}

export const PaymentProcessingUI: React.FC<PaymentProcessingUIProps> = ({
  amount,
  onComplete,
  onError
}) => {
  const [step, setStep] = useState<'initial' | 'processing' | 'complete' | 'error'>('initial');
  const { elements, stripe } = useStripe();
  const [paymentMethod, setPaymentMethod] = useState<string | null>(null);

  useEffect(() => {
    if (!stripe || !elements) {
      onError(new Error('Stripe not initialized'));
    }
  }, [stripe, elements, onError]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    setStep('processing');

    try {
      // Create payment intent
      const { clientSecret } = await createPaymentIntent(amount);

      // Confirm payment
      const result = await stripe.confirmPayment({
        elements,
        clientSecret,
        confirmParams: {
          return_url: window.location.href,
        },
      });

      if (result.error) {
        setStep('error');
        onError(result.error);
        analyticsService.trackEvent('payment_failed', {
          amount,
          error: result.error.message
        });
      } else {
        setStep('complete');
        onComplete({
          id: result.paymentIntent.id,
          status: 'succeeded',
          amount
        });
        analyticsService.trackEvent('payment_succeeded', {
          amount,
          paymentIntentId: result.paymentIntent.id
        });
      }
    } catch (error) {
      setStep('error');
      const paymentError = error instanceof Error ? error : new Error('Payment failed');
      onError(paymentError);
      analyticsService.trackError('payment_processing_error', paymentError);
    }
  };

  return (
    <motion.div className="space-y-4">
      <AnimatePresence mode="wait">
        {step === 'initial' && (
          <motion.div
            key="payment-form"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <form onSubmit={handleSubmit} className="space-y-4">
              <PaymentElement 
                options={{
                  layout: 'tabs',
                  defaultValues: {
                    billingDetails: {
                      name: 'John Doe',
                    }
                  }
                }}
              />
              <Button 
                type="submit"
                disabled={!stripe}
                className="w-full"
                variant="primary"
              >
                Pay ${amount}
              </Button>
            </form>
          </motion.div>
        )}

        {step === 'processing' && (
          <motion.div
            key="processing"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="text-center py-8"
          >
            <Spinner className="w-12 h-12 mb-4" />
            <p className="text-lg font-medium">Processing Payment...</p>
            <p className="text-sm text-gray-400">Please don't close this window</p>
          </motion.div>
        )}

        {step === 'complete' && (
          <motion.div
            key="complete"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-8"
          >
            <CheckCircle className="w-12 h-12 text-green-500 mb-4 mx-auto" />
            <p className="text-lg font-medium">Payment Complete!</p>
            <p className="text-sm text-gray-400">Your request has been submitted</p>
          </motion.div>
        )}

        {step === 'error' && (
          <motion.div
            key="error"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-8"
          >
            <XCircle className="w-12 h-12 text-red-500 mb-4 mx-auto" />
            <p className="text-lg font-medium">Payment Failed</p>
            <p className="text-sm text-gray-400">Please try again</p>
            <Button 
              variant="outline"
              onClick={() => setStep('initial')}
              className="mt-4"
            >
              Try Again
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

async function createPaymentIntent(amount: number): Promise<{ clientSecret: string }> {
  const response = await fetch('/api/create-payment-intent', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ amount }),
  });

  if (!response.ok) {
    throw new Error('Failed to create payment intent');
  }

  return response.json();
} 
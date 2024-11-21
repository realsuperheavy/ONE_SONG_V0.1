export const AddPaymentMethodForm: React.FC<{
  onSuccess: (paymentMethod: PaymentMethod) => void;
  onCancel: () => void;
}> = ({ onSuccess, onCancel }) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { elements, stripe } = useStripe();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    setIsProcessing(true);
    setError(null);

    try {
      // Create payment method
      const { paymentMethod, error } = await stripe.createPaymentMethod({
        type: 'card',
        card: elements.getElement(CardElement)!,
        billing_details: {
          // Add billing details if needed
        }
      });

      if (error) {
        throw error;
      }

      // Save to user profile
      await onSuccess(paymentMethod);

      // Track analytics
      analyticsService.trackEvent('payment_method_added', {
        type: paymentMethod.type
      });

    } catch (err) {
      setError(err.message);
      analyticsService.trackError('payment_method_add_failed', err);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label>Card Information</Label>
        <div className="p-3 bg-gray-700 rounded-md">
          <CardElement
            options={{
              style: {
                base: {
                  fontSize: '16px',
                  color: '#ffffff',
                  '::placeholder': {
                    color: '#9ca3af'
                  }
                }
              }
            }}
          />
        </div>
      </div>

      {error && (
        <Alert variant="error">
          {error}
        </Alert>
      )}

      <div className="flex justify-end space-x-2">
        <Button
          type="button"
          variant="ghost"
          onClick={onCancel}
          disabled={isProcessing}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          variant="primary"
          disabled={isProcessing}
        >
          {isProcessing ? (
            <>
              <Spinner className="w-4 h-4 mr-2" />
              Saving...
            </>
          ) : (
            'Save Card'
          )}
        </Button>
      </div>
    </form>
  );
}; 
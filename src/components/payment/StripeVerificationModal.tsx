export const StripeVerificationModal: React.FC<{
  url: string;
  onComplete: () => void;
  onClose: () => void;
}> = ({ url, onComplete, onClose }) => {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Listen for messages from Stripe
    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== process.env.NEXT_PUBLIC_STRIPE_HOST) return;

      if (event.data.type === 'stripe:verification:complete') {
        onComplete();
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [onComplete]);

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-3xl w-full h-[80vh]">
        <DialogHeader>
          <DialogTitle>Complete Verification</DialogTitle>
          <DialogDescription>
            Please complete the verification process with Stripe
          </DialogDescription>
        </DialogHeader>

        <div className="relative flex-1">
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-900/50">
              <Spinner className="w-8 h-8" />
            </div>
          )}
          <iframe
            src={url}
            className="w-full h-full border-0 rounded-md"
            onLoad={() => setIsLoading(false)}
          />
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}; 
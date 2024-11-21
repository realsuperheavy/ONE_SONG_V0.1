import { motion, AnimatePresence } from 'framer-motion';

export const SongRequestModal: React.FC<{
  song: SpotifyTrack;
  eventId: string;
  onClose: () => void;
}> = ({ song, eventId, onClose }) => {
  const [tipAmount, setTipAmount] = useState<number | null>(null);
  const [message, setMessage] = useState('');
  const { submitRequest, isSubmitting } = useRequestSubmission(eventId);
  const { tipPresets, processTip } = useTipping(eventId);

  const handleSubmit = async () => {
    try {
      // Create request with optional tip
      const request = await submitRequest({
        song,
        message,
        tip: tipAmount ? {
          amount: tipAmount,
          currency: 'USD',
          message
        } : undefined
      });

      // Process tip if included
      if (tipAmount) {
        await processTip({
          amount: tipAmount,
          requestId: request.id,
          message
        });
      }

      onClose();
    } catch (error) {
      // Handle error
    }
  };

  const fadeIn = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: 20 }
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="bg-gray-800 text-white p-6 rounded-xl max-w-md w-full">
        <motion.div {...fadeIn} transition={{ duration: 0.3 }}>
          <DialogHeader>
            <DialogTitle>Request Song</DialogTitle>
          </DialogHeader>

          {/* Song Info with Animation */}
          <motion.div 
            className="flex items-center space-x-4 my-4"
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
          >
            <Image
              src={song.albumArt}
              alt={song.album}
              width={64}
              height={64}
              className="rounded-md"
            />
            <div>
              <h3 className="font-medium">{song.title}</h3>
              <p className="text-sm text-gray-400">{song.artist}</p>
            </div>
          </motion.div>

          {/* Tip Selection with Stagger Animation */}
          <motion.div 
            className="space-y-4 my-6"
            initial="hidden"
            animate="visible"
            variants={{
              hidden: { opacity: 0 },
              visible: {
                opacity: 1,
                transition: { staggerChildren: 0.1 }
              }
            }}
          >
            <Label>Add a Tip (Optional)</Label>
            <div className="grid grid-cols-4 gap-2">
              {tipPresets.map((amount, index) => (
                <motion.div
                  key={amount}
                  variants={{
                    hidden: { scale: 0.8, opacity: 0 },
                    visible: { scale: 1, opacity: 1 }
                  }}
                >
                  <Button
                    variant={tipAmount === amount ? 'primary' : 'outline'}
                    onClick={() => setTipAmount(amount)}
                    className="w-full transform transition-all duration-200 hover:scale-105"
                  >
                    ${amount}
                  </Button>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Payment Processing UI */}
          <AnimatePresence>
            {isProcessingPayment && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="bg-gray-700 rounded-lg p-4 mb-4"
              >
                <PaymentProcessingUI 
                  amount={tipAmount}
                  onComplete={handlePaymentComplete}
                  onError={handlePaymentError}
                />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Actions */}
          <motion.div 
            className="mt-6 flex justify-end space-x-2"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            <Button variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button 
              variant="primary"
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="relative"
            >
              {isSubmitting ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="absolute inset-0 flex items-center justify-center"
                >
                  <Spinner className="w-5 h-5" />
                </motion.div>
              ) : null}
              <span className={isSubmitting ? 'opacity-0' : 'opacity-100'}>
                {tipAmount ? `Request with $${tipAmount} Tip` : 'Request Song'}
              </span>
            </Button>
          </motion.div>
        </motion.div>
      </DialogContent>
    </Dialog>
  );
}; 
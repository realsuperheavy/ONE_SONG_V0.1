import { useStripe, useElements, PaymentElement } from '@stripe/stripe-react-components';
import { motion, AnimatePresence } from 'framer-motion';

export const ProfileEditForm: React.FC<{
  profile: UserProfile;
  onSave: (profile: UserProfile) => Promise<void>;
  onCancel: () => void;
}> = ({ profile, onSave, onCancel }) => {
  const [formData, setFormData] = useState(profile);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationUrl, setVerificationUrl] = useState<string | null>(null);
  const { stripe, elements } = useStripe();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    try {
      // First save profile data
      await onSave(formData);

      // If payment verification needed, start Stripe verification
      if (formData.requiresVerification) {
        setIsVerifying(true);
        const { url } = await initiateStripeVerification(formData.userId);
        setVerificationUrl(url);
      }
    } catch (error) {
      toast.error('Failed to update profile');
    }
  };

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Basic Profile Info */}
        <div className="space-y-4">
          <div>
            <Label>Display Name</Label>
            <Input
              value={formData.displayName}
              onChange={(e) => setFormData(prev => ({
                ...prev,
                displayName: e.target.value
              }))}
              className="bg-gray-700"
            />
          </div>

          <div>
            <Label>Profile Photo</Label>
            <ImageUpload
              currentImage={formData.photoUrl}
              onUpload={(url) => setFormData(prev => ({
                ...prev,
                photoUrl: url
              }))}
            />
          </div>

          <div>
            <Label>Preferred Genres</Label>
            <GenreSelect
              selected={formData.genres}
              onChange={(genres) => setFormData(prev => ({
                ...prev,
                genres
              }))}
            />
          </div>
        </div>

        {/* Payment Verification Section */}
        <Card className="p-4 bg-gray-700">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-medium text-white">Payment Verification</h3>
              <p className="text-sm text-gray-400">
                Required for receiving tips and payments
              </p>
            </div>
            <Badge
              variant={formData.isVerified ? 'success' : 'warning'}
            >
              {formData.isVerified ? 'Verified' : 'Verification Required'}
            </Badge>
          </div>

          {!formData.isVerified && (
            <div className="space-y-4">
              <Alert variant="info">
                You'll be redirected to Stripe to complete verification
              </Alert>

              {/* Stripe Elements Integration */}
              <div className="bg-gray-800 p-4 rounded-md">
                <PaymentElement 
                  options={{
                    layout: 'tabs',
                    defaultValues: {
                      billingDetails: {
                        name: formData.displayName,
                        email: formData.email
                      }
                    }
                  }}
                />
              </div>
            </div>
          )}
        </Card>

        {/* Form Actions */}
        <div className="flex justify-end space-x-2">
          <Button
            type="button"
            variant="ghost"
            onClick={onCancel}
            disabled={isVerifying}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            disabled={isVerifying}
          >
            {isVerifying ? (
              <>
                <Spinner className="w-4 h-4 mr-2" />
                Verifying...
              </>
            ) : (
              'Save Changes'
            )}
          </Button>
        </div>
      </form>

      {/* Stripe Verification Modal */}
      <AnimatePresence>
        {verificationUrl && (
          <StripeVerificationModal
            url={verificationUrl}
            onComplete={() => {
              setVerificationUrl(null);
              setIsVerifying(false);
              // Refresh profile to get updated verification status
              refetchProfile();
            }}
            onClose={() => {
              setVerificationUrl(null);
              setIsVerifying(false);
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}; 
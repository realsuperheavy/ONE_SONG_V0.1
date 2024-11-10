import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, AlertCircle, ArrowLeft, Phone, User } from 'lucide-react';
import { 
  initializePhoneAuth, 
  sendVerificationCode,
  confirmVerificationCode,
  formatPhoneNumber
} from '@/lib/firebase/phone-auth';

interface PhoneFormProps {
  isSignUp: boolean;
  username: string;
  onUsernameChange: (value: string) => void;
  onSuccess: () => void;
  onBack?: () => void;
}

export function PhoneForm({
  isSignUp,
  username,
  onUsernameChange,
  onSuccess,
  onBack
}: PhoneFormProps) {
  const [step, setStep] = useState<'phone' | 'code'>('phone');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState(30);

  useEffect(() => {
    if (timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [timeLeft]);

  const handleSendCode = async () => {
    if (!phoneNumber.trim()) return;

    setIsLoading(true);
    setError(null);

    try {
      await initializePhoneAuth('recaptcha-container');
      const formattedNumber = formatPhoneNumber(phoneNumber);
      await sendVerificationCode(formattedNumber);
      setStep('code');
      setTimeLeft(30);
    } catch (err) {
      setError('Failed to send verification code. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyCode = async () => {
    if (!verificationCode.trim()) return;

    setIsLoading(true);
    setError(null);

    try {
      await confirmVerificationCode(verificationCode);
      onSuccess();
    } catch (err) {
      setError('Invalid verification code. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {isSignUp && (
        <div className="space-y-2">
          <Label htmlFor="username">Username</Label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="username"
              placeholder="Enter your username"
              value={username}
              onChange={(e) => onUsernameChange(e.target.value)}
              className="pl-9"
              disabled={isLoading}
              required
            />
          </div>
        </div>
      )}

      {step === 'phone' ? (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="phone">Phone Number</Label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="phone"
                type="tel"
                placeholder="+1 (555) 555-5555"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                className="pl-9"
                disabled={isLoading}
                required
              />
            </div>
          </div>

          <div id="recaptcha-container" className="flex justify-center" />

          <div className="flex gap-2">
            {onBack && (
              <Button
                variant="outline"
                onClick={onBack}
                disabled={isLoading}
                className="flex-1"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
            )}
            <Button
              onClick={handleSendCode}
              disabled={isLoading || !phoneNumber.trim()}
              className="flex-1"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending Code...
                </>
              ) : (
                'Send Verification Code'
              )}
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="code">Verification Code</Label>
            <Input
              id="code"
              type="text"
              placeholder="Enter 6-digit code"
              value={verificationCode}
              onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ''))}
              maxLength={6}
              className="text-center text-2xl tracking-widest"
              disabled={isLoading}
              required
            />
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setStep('phone')}
              disabled={isLoading}
              className="flex-1"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <Button
              onClick={handleVerifyCode}
              disabled={isLoading || verificationCode.length !== 6}
              className="flex-1"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Verifying...
                </>
              ) : (
                'Verify Code'
              )}
            </Button>
          </div>

          {timeLeft > 0 ? (
            <p className="text-sm text-center text-muted-foreground">
              Resend code in {timeLeft}s
            </p>
          ) : (
            <Button
              variant="link"
              onClick={handleSendCode}
              disabled={isLoading}
              className="w-full"
            >
              Resend Code
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
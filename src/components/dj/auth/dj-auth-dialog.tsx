import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AuthTabs } from './auth-tabs';
import { EmailForm } from './email-form';
import { PhoneForm } from './phone-form';
import { SocialButtons } from './social-buttons';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/components/ui/use-toast';

interface DJAuthDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

interface PhoneFormProps {
  onSuccess: () => void;
  isSignUp: boolean;
  username: string;
  onUsernameChange: (value: string) => void;
}

export function DJAuthDialog({ isOpen, onClose }: DJAuthDialogProps) {
  const [authMethod, setAuthMethod] = useState<'email' | 'phone' | 'social'>('email');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { signIn } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSocialAuth = async (provider: 'google' | 'apple' | 'facebook') => {
    setIsLoading(true);
    try {
      await signIn(provider, '');
      onClose();
    } catch (error) {
      toast({
        title: 'Authentication failed',
        description: 'Please try again or use another method',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px] bg-[#1E1E1E] text-white">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-center">
            Sign in to OneSong
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <AuthTabs
            activeMethod={authMethod}
            onMethodChange={setAuthMethod}
          />

          <div className="mt-6">
            {authMethod === 'email' && (
              <EmailForm
                isSignUp={false}
                email={email}
                password={password}
                username={username}
                isLoading={isLoading}
                error={error}
                onEmailChange={setEmail}
                onPasswordChange={setPassword}
                onUsernameChange={setUsername}
                onSubmit={async (e) => {
                  e.preventDefault();
                  try {
                    // Handle submit logic
                    onClose();
                  } catch (err) {
                    // Handle error
                  }
                }}
              />
            )}
            {authMethod === 'phone' && (
              <PhoneForm 
                onSuccess={onClose}
                isSignUp={false}
                username={username}
                onUsernameChange={setUsername}
              />
            )}
            {authMethod === 'social' && (
              <SocialButtons
                onGoogleClick={() => handleSocialAuth('google')}
                onAppleClick={() => handleSocialAuth('apple')}
                onFacebookClick={() => handleSocialAuth('facebook')}
                isLoading={isLoading}
              />
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
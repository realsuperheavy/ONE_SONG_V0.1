import { useState } from 'react';
import { AuthTabs } from './auth-tabs';
import { EmailForm } from '@/components/dj/auth/email-form';
import { PhoneForm } from './phone-form';
import { SocialButtons } from '@/components/dj/auth/social-buttons';
import { Separator } from '@/components/ui/separator';
import { useDJAuth } from '@/hooks/use-dj-auth';

interface DJAuthFormProps {
  onSuccess?: () => void;
}

export function DJAuthForm({ onSuccess }: DJAuthFormProps) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const { signIn, signUp, signInWithGoogle, signInWithApple, signInWithFacebook, isLoading, error } = useDJAuth();

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (isSignUp) {
        await signUp(email, password, username);
      } else {
        await signIn(email, password);
      }
      onSuccess?.();
    } catch (err) {
      // Error handled by hook
    }
  };

  const handleSocialAuth = async (provider: 'google' | 'apple' | 'facebook') => {
    try {
      switch (provider) {
        case 'google':
          await signInWithGoogle();
          break;
        case 'apple':
          await signInWithApple();
          break;
        case 'facebook':
          await signInWithFacebook();
          break;
      }
      onSuccess?.();
    } catch (err) {
      // Error handled by hook
    }
  };

  return (
    <div className="space-y-6">
      <AuthTabs 
        activeMethod="email"
        onMethodChange={() => {}}  // Add proper method change handler if needed
      />

      <EmailForm
        isSignUp={isSignUp}
        email={email}
        password={password}
        username={username}
        isLoading={isLoading}
        error={error}
        onEmailChange={setEmail}
        onPasswordChange={setPassword}
        onUsernameChange={setUsername}
        onSubmit={handleEmailSubmit}
      />

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-muted-foreground">
            Or continue with
          </span>
        </div>
      </div>

      <SocialButtons
        onGoogleClick={() => handleSocialAuth('google')}
        onAppleClick={() => handleSocialAuth('apple')}
        onFacebookClick={() => handleSocialAuth('facebook')}
        isLoading={isLoading}
      />
    </div>
  );
}
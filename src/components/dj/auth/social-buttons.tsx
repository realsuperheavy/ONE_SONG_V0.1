interface SocialButtonsProps {
  onGoogleClick: () => void;
  onAppleClick: () => void;
  onFacebookClick: () => void;
  isLoading: boolean;
}

export function SocialButtons({ onGoogleClick, onAppleClick, onFacebookClick, isLoading }: SocialButtonsProps) {
  return (
    <div className="flex flex-col gap-2">
      <button 
        onClick={onGoogleClick} 
        disabled={isLoading}
        className="w-full p-2 border rounded-lg"
      >
        Continue with Google
      </button>
      <button 
        onClick={onAppleClick} 
        disabled={isLoading}
        className="w-full p-2 border rounded-lg"
      >
        Continue with Apple
      </button>
      <button 
        onClick={onFacebookClick} 
        disabled={isLoading}
        className="w-full p-2 border rounded-lg"
      >
        Continue with Facebook
      </button>
    </div>
  );
} 
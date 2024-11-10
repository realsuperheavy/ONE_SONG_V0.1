export interface EmailFormProps {
  onSuccess: () => void;
  isLoading?: boolean;
  error?: string;
}

export interface PhoneFormProps {
  onSuccess: () => void;
  isLoading?: boolean;
  error?: string;
  isSignUp?: boolean;
  username?: string;
  onUsernameChange?: (username: string) => void;
} 
export interface AuthFormProps {
  onSubmit: (data: AuthFormData) => Promise<void>;
  isLoading?: boolean;
  error?: string;
}

export interface AuthFormData {
  email?: string;
  phone?: string;
  password?: string;
  confirmPassword?: string;
}

export interface AuthTabsProps {
  value: 'email' | 'phone';
  onChange: (value: 'email' | 'phone') => void;
} 
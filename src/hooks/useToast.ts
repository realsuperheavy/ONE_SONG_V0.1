import { useCallback } from 'react';
import { toast } from '@/components/ui/use-toast';

interface ToastOptions {
  title: string;
  description: string;
  variant?: 'default' | 'destructive';
}

export function useToast() {
  const showToast = useCallback(({ title, description, variant = 'default' }: ToastOptions) => {
    toast({
      title,
      description,
      variant,
    });
  }, []);

  return { showToast };
} 
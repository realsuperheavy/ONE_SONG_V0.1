import { ToastProps } from '@/components/ui/toast';

export const useToast = () => {
  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    const event = new CustomEvent('toast', {
      detail: {
        title: type === 'success' ? 'Success' : 'Error',
        description: message,
        variant: type === 'success' ? 'default' : 'destructive'
      } as ToastProps
    });
    window.dispatchEvent(event);
  };

  return { showToast };
};

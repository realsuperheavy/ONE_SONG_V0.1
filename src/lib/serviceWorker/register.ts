import { analyticsService } from '@/lib/firebase/services/analytics';

export async function registerServiceWorker(): Promise<void> {
  if ('serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.register('/service-worker.js', {
        scope: '/'
      });

      // Handle updates
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        if (!newWorker) return;

        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            // New service worker available
            analyticsService.trackEvent('sw_update_available');
            
            // Notify the user
            dispatchEvent(new CustomEvent('swUpdate'));
          }
        });
      });

      // Track successful registration
      analyticsService.trackEvent('sw_registered', {
        scope: registration.scope
      });

    } catch (error) {
      analyticsService.trackError(error as Error, {
        context: 'sw_registration'
      });
      console.error('Service worker registration failed:', error);
    }
  }
}

export async function unregisterServiceWorker(): Promise<void> {
  if ('serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.ready;
      await registration.unregister();
      
      analyticsService.trackEvent('sw_unregistered');
      
    } catch (error) {
      analyticsService.trackError(error as Error, {
        context: 'sw_unregistration'
      });
      console.error('Service worker unregistration failed:', error);
    }
  }
} 
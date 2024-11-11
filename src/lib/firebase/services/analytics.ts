import { logEvent } from 'firebase/analytics';
import { analytics } from '../config';

export const analyticsService = {
  trackEvent: (eventName: string, params?: Record<string, any>) => {
    if (analytics) {
      logEvent(analytics, eventName, params);
    }
  },
  
  trackError: (error: Error, context?: Record<string, any>) => {
    if (analytics) {
      logEvent(analytics, 'error', {
        error_name: error.name,
        error_message: error.message,
        stack: error.stack,
        timestamp: Date.now(),
        ...context
      });
    }
  }
};
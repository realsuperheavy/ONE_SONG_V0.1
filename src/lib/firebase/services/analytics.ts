import { analytics } from '../config';
import { logEvent } from 'firebase/analytics';

export const analyticsService = {
  trackEvent: (eventName: string, params?: Record<string, any>) => {
    logEvent(analytics, eventName, params);
  },

  trackError: (error: Error, context?: Record<string, any>) => {
    logEvent(analytics, 'error', {
      error_name: error.name,
      error_message: error.message,
      error_stack: error.stack,
      ...context
    });
  }
}; 
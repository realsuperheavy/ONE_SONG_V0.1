import { getAnalytics, logEvent } from 'firebase/analytics';
import app from '../init';

const analytics = typeof window !== 'undefined' ? getAnalytics(app) : null;

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
        ...context
      });
    }
  }
};
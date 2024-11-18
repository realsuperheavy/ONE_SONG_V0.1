import { getAnalytics, logEvent } from 'firebase/analytics';
import app from '@/lib/firebase/config';

const analytics = getAnalytics(app);

export const analyticsService = {
  trackEvent: (eventName: string, params?: { [key: string]: any }) => {
    logEvent(analytics, eventName, params);
  },
  trackError: (error: Error, context?: any) => {
    logEvent(analytics, 'exception', {
      description: `${error.message} - Context: ${JSON.stringify(context)}`,
      fatal: false,
    });
  },
}; 
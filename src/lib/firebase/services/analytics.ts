import { logEvent } from 'firebase/analytics';
import { analytics } from '../config';

export interface AnalyticsService {
  trackEvent: (eventName: string, params?: Record<string, any>) => void;
  trackError: (error: Error, context?: Record<string, any>) => void;
  trackEventMetrics: (eventId: string) => void;
  stopTracking: (eventId: string) => void;
}

export const analyticsService: AnalyticsService = {
  trackEvent: (eventName, params) => {
    if (analytics) {
      logEvent(analytics, eventName, params);
    }
  },
  trackError: (error, context) => {
    if (analytics) {
      logEvent(analytics, 'error', {
        error_name: error.name,
        error_message: error.message,
        stack: error.stack,
        timestamp: Date.now(),
        ...context
      });
    }
  },
  trackEventMetrics: (eventId) => {
    // Implementation
  },
  stopTracking: (eventId) => {
    // Implementation
  }
};
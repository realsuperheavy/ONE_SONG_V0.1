import { analytics } from '../config';
import { logEvent } from 'firebase/analytics';

export interface AnalyticsService {
  trackEvent: (eventName: string, params?: Record<string, any>) => void;
  trackError: (error: Error, context?: Record<string, any>) => void;
  trackEventMetrics: (eventId: string) => void;
  stopTracking: (eventId: string) => void;
}

export const analyticsService: AnalyticsService = {
  trackEvent: (eventName, params) => {
    logEvent(analytics, eventName, params);
  },
  trackError: (error, context) => {
    logEvent(analytics, 'error', {
      error_name: error.name,
      error_message: error.message,
      error_stack: error.stack,
      ...context
    });
  },
  trackEventMetrics: (eventId) => {
    // Implementation
  },
  stopTracking: (eventId) => {
    // Implementation
  }
}; 
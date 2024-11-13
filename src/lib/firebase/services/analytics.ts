import { getAnalytics, logEvent } from 'firebase/analytics';
import { getApp } from 'firebase/app';
import type { ErrorReport } from '@/debug/types';

export const analyticsService = {
  trackError: (error: Error, context?: Record<string, any>) => {
    const analytics = getAnalytics(getApp());
    logEvent(analytics, 'error', {
      error_message: error.message,
      error_stack: error.stack,
      ...context
    });
  },

  trackEvent: (eventName: string, params?: Record<string, any>) => {
    const analytics = getAnalytics(getApp());
    logEvent(analytics, eventName, params);
  },

  trackUserAction: (action: string, params?: Record<string, any>) => {
    const analytics = getAnalytics(getApp());
    logEvent(analytics, `user_action_${action}`, params);
  },

  trackAttendeeAction: (action: string, params?: Record<string, any>) => {
    const analytics = getAnalytics(getApp());
    logEvent(analytics, `attendee_${action}`, {
      timestamp: Date.now(),
      ...params
    });
  },

  trackEventActivity: (eventId: string, action: string, params?: Record<string, any>) => {
    const analytics = getAnalytics(getApp());
    logEvent(analytics, `event_${action}`, {
      eventId,
      timestamp: Date.now(),
      ...params
    });
  },

  trackRequestActivity: (eventId: string, requestId: string, action: string, params?: Record<string, any>) => {
    const analytics = getAnalytics(getApp());
    logEvent(analytics, `request_${action}`, {
      eventId,
      requestId,
      timestamp: Date.now(),
      ...params
    });
  }
};
import { getAnalytics, logEvent } from 'firebase/analytics';
import { firebaseApp } from '../config';
import { DateRange } from 'react-day-picker';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  orderBy, 
  startAt, 
  endAt,
  aggregateQuerySnapshotEqual,
  getCountFromServer
} from 'firebase/firestore';
import { db } from '../config';

export interface RequestAnalytics {
  totalRequests: number;
  totalTips: number;
  averageVotes: number;
  popularGenres: { [genre: string]: number };
  requestsByHour: { [hour: string]: number };
  approvalRate: number;
  averageResponseTime: number;
}

export interface AnalyticsService {
  trackEvent: (eventName: string, params?: Record<string, any>) => void;
  trackError: (error: Error, context?: Record<string, any>) => void;
  trackEventMetrics: (eventId: string) => void;
  stopTracking: (eventId: string) => void;
  getRequestAnalytics: (eventId: string, dateRange?: DateRange) => Promise<RequestAnalytics>;
}

const analytics = getAnalytics(firebaseApp);

// Track active event monitoring
const activeEvents = new Set<string>();

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
    if (activeEvents.has(eventId)) {
      return; // Already tracking
    }

    activeEvents.add(eventId);
    logEvent(analytics, 'event_tracking_started', { eventId });
  },

  stopTracking: (eventId) => {
    if (!activeEvents.has(eventId)) {
      return; // Not tracking
    }

    activeEvents.delete(eventId);
    logEvent(analytics, 'event_tracking_stopped', { eventId });
  },

  getRequestAnalytics: async (eventId, dateRange): Promise<RequestAnalytics> => {
    const requestsRef = collection(db, `events/${eventId}/requests`);
    let baseQuery = query(requestsRef);

    // Add date range if provided
    if (dateRange?.from) {
      baseQuery = query(
        baseQuery,
        where('metadata.requestTime', '>=', dateRange.from.toISOString())
      );
    }
    if (dateRange?.to) {
      baseQuery = query(
        baseQuery,
        where('metadata.requestTime', '<=', dateRange.to.toISOString())
      );
    }

    const snapshot = await getDocs(baseQuery);
    const requests = snapshot.docs.map(doc => doc.data());

    // Calculate analytics
    const totalRequests = requests.length;
    const totalTips = requests.reduce((sum, req) => sum + (req.metadata?.tipAmount || 0), 0);
    const totalVotes = requests.reduce((sum, req) => sum + (req.metadata?.votes || 0), 0);
    const averageVotes = totalRequests > 0 ? totalVotes / totalRequests : 0;

    // Calculate genres
    const popularGenres = requests.reduce((genres, req) => {
      const genre = req.song?.genre || 'unknown';
      genres[genre] = (genres[genre] || 0) + 1;
      return genres;
    }, {} as { [genre: string]: number });

    // Calculate requests by hour
    const requestsByHour = requests.reduce((hours, req) => {
      const hour = new Date(req.metadata.requestTime).getHours().toString();
      hours[hour] = (hours[hour] || 0) + 1;
      return hours;
    }, {} as { [hour: string]: number });

    // Calculate approval rate
    const approvedRequests = requests.filter(req => req.status === 'approved').length;
    const approvalRate = totalRequests > 0 ? (approvedRequests / totalRequests) * 100 : 0;

    // Calculate average response time
    const responseTimes = requests
      .filter(req => req.metadata.responseTime)
      .map(req => {
        const requestTime = new Date(req.metadata.requestTime).getTime();
        const responseTime = new Date(req.metadata.responseTime).getTime();
        return responseTime - requestTime;
      });
    const averageResponseTime = responseTimes.length > 0 
      ? responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length 
      : 0;

    return {
      totalRequests,
      totalTips,
      averageVotes,
      popularGenres,
      requestsByHour,
      approvalRate,
      averageResponseTime
    };
  }
};
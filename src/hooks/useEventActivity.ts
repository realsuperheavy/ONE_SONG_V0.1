'use client';

import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase/config';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { PerformanceMetricsCollector } from '@/lib/monitoring/PerformanceMetricsCollector';
import { FirebaseDebugger } from '@/debug/firebase/FirebaseDebugger';
import { analyticsService } from '@/lib/firebase/services/analytics';

interface EventActivity {
  timestamp: number;
  type: 'request' | 'vote' | 'play' | 'skip';
  userId: string;
  data: Record<string, any>;
}

export function useEventActivity(eventId: string) {
  const [activity, setActivity] = useState<EventActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const performanceMonitor = new PerformanceMetricsCollector();
    const debugger = new FirebaseDebugger(eventId);
    
    performanceMonitor.startOperation('eventActivitySubscription');

    const activityRef = collection(db, 'events', eventId, 'activity');
    const activityQuery = query(
      activityRef,
      where('timestamp', '>=', Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
    );

    const unsubscribe = onSnapshot(
      activityQuery,
      {
        next: (snapshot) => {
          const newActivity = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          })) as EventActivity[];

          setActivity(newActivity);
          setLoading(false);

          // Track performance metrics
          performanceMonitor.endOperation('eventActivitySubscription');
          performanceMonitor.trackMetric('activityCount', newActivity.length);

          // Track analytics
          analyticsService.trackEvent('activity_updated', {
            eventId,
            activityCount: newActivity.length,
            latestActivityType: newActivity[0]?.type
          });
        },
        error: async (error) => {
          setError(error);
          setLoading(false);

          // Debug and track error
          const diagnosis = await debugger.diagnoseRealTimeIssue();
          
          analyticsService.trackError(error, {
            context: 'event_activity_subscription',
            eventId,
            diagnosis
          });

          performanceMonitor.trackError('eventActivitySubscription');
        }
      }
    );

    // Cleanup subscription
    return () => {
      unsubscribe();
      performanceMonitor.dispose();
    };
  }, [eventId]);

  // Process and aggregate activity data
  const processedActivity = activity.reduce((acc, item) => {
    const existingType = acc.find(a => a.label === item.type);
    if (existingType) {
      existingType.value++;
    } else {
      acc.push({ label: item.type, value: 1 });
    }
    return acc;
  }, [] as Array<{ label: string; value: number }>);

  return {
    activity: processedActivity,
    loading,
    error
  };
} 
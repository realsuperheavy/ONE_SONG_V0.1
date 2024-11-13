'use client';

import { useEffect, useRef, useState } from 'react';
import { useAccessibility } from '@/providers/accessibility/AccessibilityProvider';
import { analyticsService } from '@/lib/firebase/services/analytics';
import { db } from '@/lib/firebase/config';
import { 
  collection, 
  query, 
  onSnapshot, 
  orderBy, 
  limit 
} from 'firebase/firestore';

interface RealtimeConfig {
  path: string;
  limit?: number;
  orderBy?: string;
  onUpdate: (data: any) => void;
  onError: (error: Error) => void;
}

interface RealtimeMetrics {
  latency: number;
  updates: number;
  errors: number;
  lastUpdate: number;
}

export function RealtimeManager({ 
  path,
  limit: queryLimit = 100,
  orderBy: orderByField = 'timestamp',
  onUpdate,
  onError
}: RealtimeConfig) {
  const { announceMessage } = useAccessibility();
  const metricsRef = useRef<RealtimeMetrics>({
    latency: 0,
    updates: 0,
    errors: 0,
    lastUpdate: Date.now()
  });
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    const collectionRef = collection(db, path);
    const q = query(
      collectionRef,
      orderBy(orderByField, 'desc'),
      limit(queryLimit)
    );

    // Set up realtime listener
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const startTime = performance.now();
        
        try {
          const data = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));

          // Calculate metrics
          const latency = performance.now() - startTime;
          metricsRef.current.latency = latency;
          metricsRef.current.updates++;
          metricsRef.current.lastUpdate = Date.now();

          // Track performance
          analyticsService.trackEvent('realtime_update', {
            path,
            latency,
            documentsCount: data.length
          });

          // Announce significant changes
          if (data.length > 0) {
            announceMessage(`${data.length} items updated`);
          }

          // Update online status
          setIsOnline(true);
          
          // Call update handler
          onUpdate(data);
        } catch (error) {
          handleError(error as Error);
        }
      },
      (error) => handleError(error)
    );

    // Cleanup subscription
    return () => {
      unsubscribe();
      analyticsService.trackEvent('realtime_subscription_ended', {
        path,
        totalUpdates: metricsRef.current.updates
      });
    };
  }, [path, queryLimit, orderByField, onUpdate, onError, announceMessage]);

  const handleError = (error: Error) => {
    metricsRef.current.errors++;
    setIsOnline(false);
    
    analyticsService.trackError(error, {
      context: 'realtime_updates',
      path
    });

    announceMessage('Connection error occurred', true);
    onError(error);
  };

  // Monitor connection status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return (
    <div aria-live="polite" className="sr-only">
      {isOnline ? 'Connected' : 'Connection lost'}
    </div>
  );
} 
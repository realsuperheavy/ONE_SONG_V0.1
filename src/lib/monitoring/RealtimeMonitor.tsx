'use client';

import { useEffect, useRef } from 'react';
import { analyticsService } from '@/lib/firebase/services/analytics';

interface RealtimeMetrics {
  latency: number;
  reconnections: number;
  messageRate: number;
}

export function useRealtimeMonitor() {
  const metricsRef = useRef<RealtimeMetrics>({
    latency: 0,
    reconnections: 0,
    messageRate: 0
  });

  const messageCountRef = useRef(0);
  const lastPingRef = useRef<number | null>(null);

  useEffect(() => {
    // Measure WebSocket/Realtime Database latency
    const measureLatency = () => {
      lastPingRef.current = Date.now();
      // Send ping through your realtime connection
    };

    // Handle pong response
    const handlePong = () => {
      if (lastPingRef.current) {
        const latency = Date.now() - lastPingRef.current;
        metricsRef.current.latency = latency;

        if (latency > 1000) {
          analyticsService.trackEvent('high_latency_detected', {
            latency,
            timestamp: Date.now()
          });
        }
      }
    };

    // Monitor message rate
    const updateMessageRate = () => {
      const rate = messageCountRef.current;
      metricsRef.current.messageRate = rate;
      messageCountRef.current = 0;

      if (rate > 100) { // Threshold for high message rate
        analyticsService.trackEvent('high_message_rate', {
          rate,
          timestamp: Date.now()
        });
      }
    };

    // Start monitoring
    const latencyInterval = setInterval(measureLatency, 5000);
    const messageRateInterval = setInterval(updateMessageRate, 1000);

    return () => {
      clearInterval(latencyInterval);
      clearInterval(messageRateInterval);
    };
  }, []);

  return metricsRef.current;
} 
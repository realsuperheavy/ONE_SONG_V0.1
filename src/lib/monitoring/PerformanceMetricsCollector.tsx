'use client';

import { useEffect, useRef } from 'react';
import { analyticsService } from '@/lib/firebase/services/analytics';

interface PerformanceMetrics {
  fps: number[];
  memory: number[];
  networkRequests: number;
  errorCount: number;
  interactionDelay: number[];
}

export function PerformanceMetricsCollector() {
  const metricsRef = useRef<PerformanceMetrics>({
    fps: [],
    memory: [],
    networkRequests: 0,
    errorCount: 0,
    interactionDelay: []
  });

  useEffect(() => {
    // FPS Monitoring
    let frameCount = 0;
    let lastTime = performance.now();

    const measureFPS = () => {
      const now = performance.now();
      frameCount++;

      if (now - lastTime >= 1000) {
        const fps = Math.round((frameCount * 1000) / (now - lastTime));
        metricsRef.current.fps.push(fps);
        
        if (fps < 30) {
          analyticsService.trackEvent('performance_degradation', {
            metric: 'fps',
            value: fps
          });
        }

        frameCount = 0;
        lastTime = now;
      }

      requestAnimationFrame(measureFPS);
    };

    requestAnimationFrame(measureFPS);

    // Memory Monitoring
    const memoryInterval = setInterval(() => {
      if ('memory' in performance) {
        const memory = (performance as any).memory;
        const usage = memory.usedJSHeapSize / memory.jsHeapSizeLimit;
        metricsRef.current.memory.push(usage);

        if (usage > 0.9) {
          analyticsService.trackEvent('performance_warning', {
            metric: 'memory',
            usage: usage * 100
          });
        }
      }
    }, 30000);

    // Network Request Monitoring
    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
      metricsRef.current.networkRequests++;
      const startTime = performance.now();
      
      try {
        const response = await originalFetch(...args);
        const duration = performance.now() - startTime;

        if (duration > 3000) {
          analyticsService.trackEvent('slow_network_request', {
            duration,
            url: args[0]
          });
        }

        return response;
      } catch (error) {
        metricsRef.current.errorCount++;
        throw error;
      }
    };

    // Interaction Delay Monitoring
    const measureInteractionDelay = () => {
      const startTime = performance.now();
      
      const handler = () => {
        const delay = performance.now() - startTime;
        metricsRef.current.interactionDelay.push(delay);

        if (delay > 100) {
          analyticsService.trackEvent('high_interaction_delay', {
            delay
          });
        }
      };

      document.addEventListener('click', handler, { once: true });
    };

    document.addEventListener('mousedown', measureInteractionDelay);

    // Cleanup
    return () => {
      clearInterval(memoryInterval);
      window.fetch = originalFetch;
      document.removeEventListener('mousedown', measureInteractionDelay);
    };
  }, []);

  // Report metrics periodically
  useEffect(() => {
    const reportInterval = setInterval(() => {
      const metrics = metricsRef.current;
      
      const averageFPS = metrics.fps.reduce((a, b) => a + b, 0) / metrics.fps.length;
      const averageMemory = metrics.memory.reduce((a, b) => a + b, 0) / metrics.memory.length;
      const averageDelay = metrics.interactionDelay.reduce((a, b) => a + b, 0) / metrics.interactionDelay.length;

      analyticsService.trackEvent('performance_metrics', {
        averageFPS,
        averageMemory,
        networkRequests: metrics.networkRequests,
        errorCount: metrics.errorCount,
        averageDelay
      });

      // Reset counters
      metrics.fps = [];
      metrics.memory = [];
      metrics.networkRequests = 0;
      metrics.errorCount = 0;
      metrics.interactionDelay = [];
    }, 60000); // Report every minute

    return () => clearInterval(reportInterval);
  }, []);

  return null;
} 
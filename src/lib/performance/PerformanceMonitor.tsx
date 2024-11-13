'use client';

import { useEffect, useRef } from 'react';
import { analyticsService } from '@/lib/firebase/services/analytics';

interface PerformanceMetrics {
  fps: number;
  memory: number;
  cpu: number;
  batteryLevel: number | null;
}

export function usePerformanceMonitor() {
  const metricsRef = useRef<PerformanceMetrics>({
    fps: 60,
    memory: 0,
    cpu: 0,
    batteryLevel: null
  });

  const frameCountRef = useRef(0);
  const lastTimeRef = useRef(performance.now());

  useEffect(() => {
    let rafId: number;
    
    // FPS Monitoring
    const measureFPS = () => {
      frameCountRef.current++;
      const currentTime = performance.now();
      
      if (currentTime - lastTimeRef.current >= 1000) {
        const fps = Math.round(frameCountRef.current * 1000 / (currentTime - lastTimeRef.current));
        metricsRef.current.fps = fps;
        
        frameCountRef.current = 0;
        lastTimeRef.current = currentTime;

        // Report if FPS drops below threshold
        if (fps < 30) {
          analyticsService.trackEvent('performance_degradation', {
            metric: 'fps',
            value: fps
          });
        }
      }
      
      rafId = requestAnimationFrame(measureFPS);
    };

    // Memory Monitoring
    const measureMemory = async () => {
      if ('memory' in performance) {
        const memory = (performance as any).memory;
        metricsRef.current.memory = memory.usedJSHeapSize / memory.jsHeapSizeLimit;
        
        if (metricsRef.current.memory > 0.9) {
          analyticsService.trackEvent('performance_degradation', {
            metric: 'memory',
            value: metricsRef.current.memory
          });
        }
      }
    };

    // Battery Monitoring
    const monitorBattery = async () => {
      if ('getBattery' in navigator) {
        const battery = await (navigator as any).getBattery();
        
        const updateBattery = () => {
          metricsRef.current.batteryLevel = battery.level;
          
          if (battery.level < 0.2 && !battery.charging) {
            analyticsService.trackEvent('battery_warning', {
              level: battery.level,
              charging: battery.charging
            });
          }
        };

        battery.addEventListener('levelchange', updateBattery);
        updateBattery();

        return () => battery.removeEventListener('levelchange', updateBattery);
      }
    };

    // Start monitoring
    rafId = requestAnimationFrame(measureFPS);
    const memoryInterval = setInterval(measureMemory, 5000);
    const batteryCleanup = monitorBattery();

    return () => {
      cancelAnimationFrame(rafId);
      clearInterval(memoryInterval);
      batteryCleanup.then(cleanup => cleanup?.());
    };
  }, []);

  return metricsRef.current;
} 
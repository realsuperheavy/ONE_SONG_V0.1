'use client';

import { useEffect, useRef } from 'react';
import { analyticsService } from '@/lib/firebase/services/analytics';

interface BatteryStatus {
  level: number;
  charging: boolean;
}

export function BatteryOptimizer() {
  const batteryRef = useRef<BatteryStatus>({ level: 1, charging: true });
  const optimizationsApplied = useRef<Set<string>>(new Set());

  useEffect(() => {
    const monitorBattery = async () => {
      if ('getBattery' in navigator) {
        const battery = await (navigator as any).getBattery();

        const updateBatteryStatus = () => {
          batteryRef.current = {
            level: battery.level,
            charging: battery.charging
          };

          applyOptimizations();
        };

        battery.addEventListener('levelchange', updateBatteryStatus);
        battery.addEventListener('chargingchange', updateBatteryStatus);
        updateBatteryStatus();

        return () => {
          battery.removeEventListener('levelchange', updateBatteryStatus);
          battery.removeEventListener('chargingchange', updateBatteryStatus);
        };
      }
    };

    monitorBattery();
  }, []);

  const applyOptimizations = () => {
    const { level, charging } = batteryRef.current;

    // Critical battery level optimizations
    if (level < 0.15 && !charging) {
      applyOptimization('reduce-animations', () => {
        document.body.classList.add('reduce-motion');
        document.body.style.setProperty('--animation-duration', '0s');
      });

      applyOptimization('reduce-polling', () => {
        window.dispatchEvent(new CustomEvent('reduce-polling-rate'));
      });

      applyOptimization('reduce-quality', () => {
        document.body.classList.add('reduce-image-quality');
      });

      analyticsService.trackEvent('battery_optimizations_applied', {
        level,
        optimizations: Array.from(optimizationsApplied.current)
      });
    } else {
      // Restore normal operation
      removeOptimization('reduce-animations', () => {
        document.body.classList.remove('reduce-motion');
        document.body.style.removeProperty('--animation-duration');
      });

      removeOptimization('reduce-polling', () => {
        window.dispatchEvent(new CustomEvent('restore-polling-rate'));
      });

      removeOptimization('reduce-quality', () => {
        document.body.classList.remove('reduce-image-quality');
      });
    }
  };

  const applyOptimization = (name: string, callback: () => void) => {
    if (!optimizationsApplied.current.has(name)) {
      optimizationsApplied.current.add(name);
      callback();
    }
  };

  const removeOptimization = (name: string, callback: () => void) => {
    if (optimizationsApplied.current.has(name)) {
      optimizationsApplied.current.delete(name);
      callback();
    }
  };

  return null;
} 
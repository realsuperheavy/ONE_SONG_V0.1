import { useEffect } from 'react';
import { productionMonitor } from '@/lib/monitoring/ProductionMonitor';

export function useMonitoring(componentName: string) {
  useEffect(() => {
    const startTime = performance.now();

    return () => {
      const duration = performance.now() - startTime;
      productionMonitor.trackPerformance({
        [`${componentName}_duration`]: duration
      });
    };
  }, [componentName]);

  return {
    trackError: (error: Error, context: Record<string, any> = {}) => {
      productionMonitor.trackError({
        error,
        context: { ...context, component: componentName },
        severity: 'medium'
      });
    },
    trackMetric: (name: string, value: number) => {
      productionMonitor.trackPerformance({
        [`${componentName}_${name}`]: value
      });
    }
  };
} 
'use client';

import { memo, useEffect, useRef } from 'react';
import { Chart as ChartJS } from 'chart.js/auto';
import { PerformanceMetricsCollector } from '@/lib/monitoring/PerformanceMetricsCollector';
import { useAccessibility } from '@/providers/accessibility/AccessibilityProvider';
import { analyticsService } from '@/lib/firebase/services/analytics';

interface ChartBaseProps {
  type: 'line' | 'bar' | 'pie';
  data: any;
  options: any;
  title?: string;
  height?: number;
  onDataPointClick?: (point: any) => void;
}

export const ChartBase = memo(function ChartBase({
  type,
  data,
  options,
  title,
  height = 300,
  onDataPointClick
}: ChartBaseProps) {
  const chartRef = useRef<ChartJS | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const { announceMessage } = useAccessibility();
  const performanceMonitor = new PerformanceMetricsCollector();

  useEffect(() => {
    if (!canvasRef.current) return;

    performanceMonitor.startOperation('chartInit');

    try {
      // Destroy existing chart
      if (chartRef.current) {
        chartRef.current.destroy();
      }

      // Create new chart
      chartRef.current = new ChartJS(canvasRef.current, {
        type,
        data,
        options: {
          ...options,
          onHover: (event: any, elements: any[]) => {
            if (elements.length > 0) {
              canvasRef.current!.style.cursor = 'pointer';
            } else {
              canvasRef.current!.style.cursor = 'default';
            }
          },
          onClick: (event: any, elements: any[]) => {
            if (elements.length > 0 && onDataPointClick) {
              const index = elements[0].index;
              const dataPoint = data.datasets[0].data[index];
              onDataPointClick(dataPoint);

              // Announce for screen readers
              const label = data.labels[index];
              announceMessage(`Selected ${label}: ${dataPoint}`);

              analyticsService.trackEvent('chart_interaction', {
                type,
                label,
                value: dataPoint
              });
            }
          }
        }
      });

      performanceMonitor.endOperation('chartInit');
    } catch (error) {
      performanceMonitor.trackError('chartInit');
      analyticsService.trackError(error as Error, {
        context: 'chart_initialization',
        type
      });
    }

    return () => {
      if (chartRef.current) {
        chartRef.current.destroy();
      }
      performanceMonitor.dispose();
    };
  }, [type, data, options, onDataPointClick, announceMessage]);

  return (
    <div 
      style={{ height }} 
      className="relative"
      role="img" 
      aria-label={title}
    >
      <canvas ref={canvasRef} />
      {title && (
        <div className="absolute top-0 left-0 p-4">
          <h3 className="text-lg font-semibold">{title}</h3>
        </div>
      )}
    </div>
  );
}, (prevProps, nextProps) => {
  // Custom comparison for memoization
  return (
    prevProps.type === nextProps.type &&
    JSON.stringify(prevProps.data) === JSON.stringify(nextProps.data) &&
    JSON.stringify(prevProps.options) === JSON.stringify(nextProps.options) &&
    prevProps.title === nextProps.title &&
    prevProps.height === nextProps.height
  );
}); 
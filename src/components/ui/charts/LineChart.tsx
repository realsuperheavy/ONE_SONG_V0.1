'use client';

import { useEffect, useRef, memo } from 'react';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS } from 'chart.js/auto';
import { PerformanceMetricsCollector } from '@/lib/monitoring/PerformanceMetricsCollector';
import { useAccessibility } from '@/providers/accessibility/AccessibilityProvider';
import { analyticsService } from '@/lib/firebase/services/analytics';

interface LineChartProps {
  data: Array<{
    x: string | number;
    y: number;
  }>;
  title?: string;
  color?: string;
  height?: number;
  xLabel?: string;
  yLabel?: string;
  showLegend?: boolean;
  onPointClick?: (point: { x: string | number; y: number }) => void;
}

export const LineChart = memo(function LineChart({
  data,
  title,
  color = '#F49620',
  height = 300,
  xLabel,
  yLabel,
  showLegend = false,
  onPointClick
}: LineChartProps) {
  const chartRef = useRef<ChartJS | null>(null);
  const { announceMessage } = useAccessibility();
  const performanceMonitor = new PerformanceMetricsCollector();

  useEffect(() => {
    performanceMonitor.startOperation('lineChartRender');

    // Announce data summary for screen readers
    const total = data.reduce((sum, point) => sum + point.y, 0);
    const average = total / data.length;
    const max = Math.max(...data.map(d => d.y));
    const maxPoint = data.find(d => d.y === max);

    announceMessage(
      `Line chart showing ${data.length} points. ` +
      `Average value: ${average.toFixed(1)}. ` +
      `Peak value: ${max} at ${maxPoint?.x}.`
    );

    return () => {
      if (chartRef.current) {
        chartRef.current.destroy();
        performanceMonitor.endOperation('lineChartRender');
      }
      performanceMonitor.dispose();
    };
  }, [data, announceMessage]);

  const chartData = {
    labels: data.map(d => d.x),
    datasets: [{
      label: title,
      data: data.map(d => d.y),
      borderColor: color,
      backgroundColor: `${color}33`,
      fill: true,
      tension: 0.4,
      pointRadius: 4,
      pointHoverRadius: 6,
      pointBackgroundColor: color,
      pointBorderColor: 'rgba(255, 255, 255, 0.8)',
      pointBorderWidth: 2
    }]
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    onClick: (_: any, elements: any[]) => {
      if (elements.length > 0 && onPointClick) {
        const index = elements[0].index;
        const point = data[index];
        onPointClick(point);

        // Announce selection for screen readers
        announceMessage(`Selected point at ${point.x}: ${point.y}`);

        analyticsService.trackEvent('chart_interaction', {
          type: 'line',
          point: point,
          chartTitle: title
        });

        performanceMonitor.trackMetric('chartInteraction', {
          type: 'click',
          timestamp: Date.now()
        });
      }
    },
    plugins: {
      legend: {
        display: showLegend,
        position: 'bottom' as const,
        labels: {
          usePointStyle: true,
          padding: 20
        }
      },
      tooltip: {
        callbacks: {
          label: (context: any) => {
            const value = context.raw;
            const total = data.reduce((sum, point) => sum + point.y, 0);
            const percentage = ((value / total) * 100).toFixed(1);
            return `Value: ${value} (${percentage}%)`;
          }
        }
      }
    },
    scales: {
      x: {
        title: {
          display: !!xLabel,
          text: xLabel
        },
        grid: {
          display: false
        },
        ticks: {
          maxRotation: 45,
          minRotation: 45
        }
      },
      y: {
        title: {
          display: !!yLabel,
          text: yLabel
        },
        beginAtZero: true,
        grid: {
          color: 'rgba(255, 255, 255, 0.1)'
        }
      }
    },
    animation: {
      duration: 750,
      onProgress: (animation: any) => {
        performanceMonitor.trackMetric('chartAnimation', {
          progress: animation.currentStep / animation.numSteps,
          timestamp: Date.now()
        });
      }
    },
    interaction: {
      intersect: false,
      mode: 'index' as const
    }
  };

  return (
    <div 
      style={{ height }} 
      role="img" 
      aria-label={title}
      className="relative"
    >
      <Line
        ref={chartRef}
        data={chartData}
        options={options}
      />
      {title && (
        <h3 className="absolute top-0 left-0 text-lg font-semibold p-4">
          {title}
        </h3>
      )}
    </div>
  );
}); 
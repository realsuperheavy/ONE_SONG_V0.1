'use client';

import { useEffect, useRef, memo } from 'react';
import { Pie } from 'react-chartjs-2';
import { Chart as ChartJS } from 'chart.js/auto';
import { PerformanceMetricsCollector } from '@/lib/monitoring/PerformanceMetricsCollector';
import { useAccessibility } from '@/providers/accessibility/AccessibilityProvider';
import { analyticsService } from '@/lib/firebase/services/analytics';

interface PieChartProps {
  data: Array<{
    label: string;
    value: number;
    color?: string;
  }>;
  title?: string;
  height?: number;
  showLegend?: boolean;
  onSegmentClick?: (segment: { label: string; value: number }) => void;
}

export const PieChart = memo(function PieChart({
  data,
  title,
  height = 300,
  showLegend = true,
  onSegmentClick
}: PieChartProps) {
  const chartRef = useRef<ChartJS | null>(null);
  const { announceMessage } = useAccessibility();
  const performanceMonitor = new PerformanceMetricsCollector();

  useEffect(() => {
    performanceMonitor.startOperation('pieChartRender');

    // Announce data summary for screen readers
    const total = data.reduce((sum, item) => sum + item.value, 0);
    const largest = data.reduce((max, item) => 
      item.value > max.value ? item : max
    , data[0]);

    announceMessage(
      `Pie chart showing ${data.length} segments. ` +
      `Total value: ${total}. ` +
      `Largest segment is ${largest.label} at ${((largest.value / total) * 100).toFixed(1)}%.`
    );

    return () => {
      if (chartRef.current) {
        chartRef.current.destroy();
        performanceMonitor.endOperation('pieChartRender');
      }
      performanceMonitor.dispose();
    };
  }, [data, announceMessage]);

  const chartData = {
    labels: data.map(d => d.label),
    datasets: [{
      data: data.map(d => d.value),
      backgroundColor: data.map(d => d.color || '#F49620'),
      borderColor: 'rgba(255, 255, 255, 0.1)',
      borderWidth: 1,
      hoverOffset: 4
    }]
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    onClick: (_: any, elements: any[]) => {
      if (elements.length > 0 && onSegmentClick) {
        const index = elements[0].index;
        const segment = data[index];
        onSegmentClick(segment);

        // Announce selection for screen readers
        const total = data.reduce((sum, item) => sum + item.value, 0);
        const percentage = ((segment.value / total) * 100).toFixed(1);
        announceMessage(
          `Selected ${segment.label}: ${segment.value} (${percentage}%)`
        );

        analyticsService.trackEvent('chart_interaction', {
          type: 'pie',
          segment: segment.label,
          value: segment.value,
          percentage,
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
          padding: 20,
          generateLabels: (chart: any) => {
            const data = chart.data;
            const total = data.datasets[0].data.reduce((a: number, b: number) => a + b, 0);
            
            return data.labels.map((label: string, index: number) => {
              const value = data.datasets[0].data[index];
              const percentage = ((value / total) * 100).toFixed(1);
              
              return {
                text: `${label}: ${percentage}%`,
                fillStyle: data.datasets[0].backgroundColor[index],
                hidden: false,
                index
              };
            });
          }
        }
      },
      tooltip: {
        callbacks: {
          label: (context: any) => {
            const value = context.raw;
            const total = data.reduce((sum, item) => sum + item.value, 0);
            const percentage = ((value / total) * 100).toFixed(1);
            return `${context.label}: ${value} (${percentage}%)`;
          }
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
    }
  };

  return (
    <div 
      style={{ height }} 
      role="img" 
      aria-label={title}
      className="relative"
    >
      <Pie
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
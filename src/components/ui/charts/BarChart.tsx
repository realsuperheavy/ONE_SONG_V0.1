'use client';

import { useEffect, useRef, memo } from 'react';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS } from 'chart.js/auto';
import { PerformanceMetricsCollector } from '@/lib/monitoring/PerformanceMetricsCollector';
import { useAccessibility } from '@/providers/accessibility/AccessibilityProvider';
import { analyticsService } from '@/lib/firebase/services/analytics';

interface BarChartProps {
  data: Array<{
    label: string;
    value: number;
  }>;
  title?: string;
  color?: string;
  height?: number;
  xLabel?: string;
  yLabel?: string;
  onBarClick?: (item: { label: string; value: number }) => void;
}

export const BarChart = memo(function BarChart({
  data,
  title,
  color = '#F49620',
  height = 300,
  xLabel,
  yLabel,
  onBarClick
}: BarChartProps) {
  const chartRef = useRef<ChartJS | null>(null);
  const { announceMessage } = useAccessibility();
  const performanceMonitor = new PerformanceMetricsCollector();

  useEffect(() => {
    performanceMonitor.startOperation('barChartRender');

    // Announce data summary for screen readers
    const total = data.reduce((sum, item) => sum + item.value, 0);
    const max = Math.max(...data.map(d => d.value));
    const maxItem = data.find(d => d.value === max);
    
    announceMessage(
      `Bar chart showing ${data.length} items. ` +
      `Total value: ${total}. ` +
      `Highest value is ${maxItem?.label} at ${max}.`
    );

    return () => {
      if (chartRef.current) {
        chartRef.current.destroy();
        performanceMonitor.endOperation('barChartRender');
      }
      performanceMonitor.dispose();
    };
  }, [data, announceMessage]);

  const chartData = {
    labels: data.map(d => d.label),
    datasets: [{
      data: data.map(d => d.value),
      backgroundColor: color,
      borderColor: 'rgba(255, 255, 255, 0.1)',
      borderWidth: 1,
      borderRadius: 4,
      barThickness: 'flex' as const
    }]
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    onClick: (_: any, elements: any[]) => {
      if (elements.length > 0 && onBarClick) {
        const index = elements[0].index;
        const item = data[index];
        onBarClick(item);
        
        // Announce selection for screen readers
        announceMessage(`Selected ${item.label}: ${item.value}`);
        
        analyticsService.trackEvent('chart_interaction', {
          type: 'bar',
          item: item.label,
          value: item.value,
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
        display: false
      },
      tooltip: {
        callbacks: {
          label: (context: any) => {
            const value = context.raw;
            const total = data.reduce((sum, item) => sum + item.value, 0);
            const percentage = ((value / total) * 100).toFixed(1);
            return `${value} (${percentage}%)`;
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
    }
  };

  return (
    <div 
      style={{ height }} 
      role="img" 
      aria-label={title}
      className="relative"
    >
      <Bar
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
'use client';

import { useEffect, useRef, memo, useCallback } from 'react';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, ChartEvent, ChartData, ChartOptions } from 'chart.js/auto';
import { PerformanceMetricsCollector } from '@/lib/monitoring/PerformanceMetricsCollector';
import { useAccessibility } from '@/providers/accessibility/AccessibilityProvider';
import { analyticsService } from '@/lib/firebase/services/analytics';

interface ChartDataPoint {
  x: string;
  y: number;
  type?: string;
}

interface BarChartProps {
  data: ChartDataPoint[];
  title?: string;
  color?: string;
  height?: number;
  xLabel?: string;
  yLabel?: string;
  barWidth?: number;
  grouped?: boolean;
  onTooltip?: (value: number, type?: string) => string;
  onBarClick?: (item: ChartDataPoint) => void;
}

export const BarChart = memo(function BarChart({
  data,
  title,
  color = '#F49620',
  height = 300,
  xLabel,
  yLabel,
  barWidth = 1,
  grouped = false,
  onTooltip,
  onBarClick
}: BarChartProps) {
  const chartRef = useRef<ChartJS | null>(null);
  const { announceMessage } = useAccessibility();
  const performanceMonitor = useRef(new PerformanceMetricsCollector());

  const handleClick = useCallback((_: ChartEvent, elements: any[]) => {
    if (elements.length > 0 && onBarClick) {
      const index = elements[0].index;
      const item = data[index];
      onBarClick(item);
      
      announceMessage(`Selected ${item.x}: ${item.y}${item.type ? ` ${item.type}` : ''}`);
      
      analyticsService.trackEvent('chart_interaction', {
        type: 'bar',
        value: item.y,
        category: item.type,
        chartTitle: title
      });
    }
  }, [data, onBarClick, announceMessage, title]);

  useEffect(() => {
    const monitor = performanceMonitor.current;
    monitor.startOperation('barChartRender');

    const total = data.reduce((sum, item) => sum + item.y, 0);
    const max = Math.max(...data.map(d => d.y));
    const maxItem = data.find(d => d.y === max);
    
    announceMessage(
      `Bar chart showing ${data.length} items. ` +
      `Total value: ${total}. ` +
      `Highest value: ${maxItem?.y} at ${maxItem?.x}.`
    );

    return () => {
      monitor.endOperation('barChartRender');
      monitor.dispose();
    };
  }, [data, announceMessage]);

  const chartData: ChartData = grouped ? {
    labels: [...new Set(data.map(d => d.x))],
    datasets: [...new Set(data.map(d => d.type))].map(type => ({
      label: type,
      data: data.filter(d => d.type === type).map(d => d.y),
      backgroundColor: color,
      borderColor: 'rgba(255, 255, 255, 0.1)',
      borderWidth: 1,
      borderRadius: 4,
      barPercentage: barWidth,
      categoryPercentage: 0.8
    }))
  } : {
    labels: data.map(d => d.x),
    datasets: [{
      data: data.map(d => d.y),
      backgroundColor: color,
      borderColor: 'rgba(255, 255, 255, 0.1)',
      borderWidth: 1,
      borderRadius: 4,
      barPercentage: barWidth
    }]
  };

  const options: ChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    onClick: handleClick,
    plugins: {
      legend: {
        display: grouped,
        position: 'top' as const
      },
      tooltip: {
        callbacks: {
          label: (context: any) => {
            const value = context.raw;
            const type = grouped ? context.dataset.label : data[context.dataIndex].type;
            return onTooltip ? onTooltip(value, type) : `${value}`;
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
    }
  };

  return (
    <div style={{ height }}>
      <Bar
        ref={chartRef}
        data={chartData}
        options={options}
        aria-label={`Bar chart${title ? ` of ${title}` : ''}`}
      />
    </div>
  );
}); 
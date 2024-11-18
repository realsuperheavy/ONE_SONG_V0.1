import { BaseChart } from './BaseChart';
import { ChartData } from '@/types/charts';
import { getChartColors } from '@/utils/charts';
import { ChartConfiguration, ChartData as ChartJsData } from 'chart.js';

interface BarChartProps {
  data: any[];
  xLabel: string;
  yLabel: string;
  color?: string;
  barWidth?: number;
  grouped?: boolean;
  onTooltip?: (value: number, type: string) => string;
  height?: number;
  className?: string;
}

export const BarChart: React.FC<BarChartProps> = ({
  data,
  xLabel,
  yLabel,
  color = '#000',
  barWidth = 0.8,
  grouped = false,
  onTooltip,
  height = 250,
  className
}) => {
  const colors = getChartColors(data.length);

  const config: ChartConfiguration<'bar'> = {
    type: 'bar',
    data: {
      labels: data.map(item => item.label),
      datasets: [{
        label: yLabel,
        data: data.map(item => item.value),
        backgroundColor: colors as unknown as string[],
        borderColor: colors as unknown as string[],
        borderWidth: 1
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: !!yLabel
        },
        tooltip: {
          mode: 'index',
          intersect: false,
          formatter: onTooltip || ((value: number) => `${value}`)
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            precision: 0
          }
        }
      }
    }
  };

  return (
    <BaseChart 
      config={config} 
      className={`h-${height} ${className ?? ''}`}
    />
  );
}; 
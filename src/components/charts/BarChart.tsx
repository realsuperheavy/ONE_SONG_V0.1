import { BaseChart } from './BaseChart';
import { ChartData } from '@/types/charts';
import { getChartColors } from '@/utils/charts';
import { ChartConfiguration, ChartData as ChartJsData } from 'chart.js';

interface BarChartProps {
  data: ChartData[];
  xAxis: string;
  yAxis: string;
  color: string;
  height?: number;
  className?: string;
}

export const BarChart: React.FC<BarChartProps> = ({
  data,
  xAxis,
  yAxis,
  color,
  height = 250,
  className
}) => {
  const colors = getChartColors(data.length);

  const config: ChartConfiguration<'bar'> = {
    type: 'bar',
    data: {
      labels: data.map(item => item.label),
      datasets: [{
        label: yAxis,
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
          display: !!yAxis
        },
        tooltip: {
          mode: 'index',
          intersect: false
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
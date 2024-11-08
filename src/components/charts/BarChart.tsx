import { BaseChart } from './BaseChart';
import { ChartData } from '@/types/charts';
import { getChartColors } from '@/utils/charts';

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

  const config = {
    type: 'bar',
    data: {
      labels: data.map(item => item.label),
      datasets: [{
        label: xAxis,
        data: data.map(item => item.value),
        backgroundColor: colors.background,
        borderColor: colors.border,
        borderWidth: 1
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: !!xAxis
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
      className={`h-${height} ${className}`}
    />
  );
}; 
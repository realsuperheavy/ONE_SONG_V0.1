import { BaseChart } from './BaseChart';
import { ChartData } from '@/types/charts';
import { getChartColors } from '@/utils/charts';

interface LineChartProps {
  data: ChartData[];
  xAxis: string;
  yAxis: string;
  color: string;
  height?: number;
  className?: string;
}

export const LineChart: React.FC<LineChartProps> = ({
  data,
  xAxis,
  yAxis,
  color,
  height = 200,
  className
}) => {
  const colors = getChartColors(1)[0];

  const config = {
    type: 'line',
    data: {
      labels: data.map(item => item.label),
      datasets: [{
        label: xAxis,
        data: data.map(item => item.value),
        borderColor: colors.border,
        backgroundColor: colors.background,
        tension: 0.4,
        fill: true
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: true
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
      },
      interaction: {
        intersect: false,
        mode: 'index'
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
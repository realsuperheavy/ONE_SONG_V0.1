import { BaseChart } from './BaseChart';
import { ChartData } from '@/types/charts';
import { getChartColors } from '@/utils/charts';

interface BarChartProps {
  data: ChartData[];
  title?: string;
  className?: string;
}

export function BarChart({ data, title, className = '' }: BarChartProps) {
  const colors = getChartColors(data.length);

  const config = {
    type: 'bar',
    data: {
      labels: data.map(item => item.label),
      datasets: [{
        label: title || '',
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
          display: !!title
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
      className={`h-64 ${className}`}
    />
  );
} 
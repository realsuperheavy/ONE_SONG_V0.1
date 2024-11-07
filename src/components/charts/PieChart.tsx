import { BaseChart } from './BaseChart';
import { ChartData } from '@/types/charts';
import { getChartColors } from '@/utils/charts';

interface PieChartProps {
  data: ChartData[];
  title?: string;
  className?: string;
  doughnut?: boolean;
}

export function PieChart({ 
  data, 
  title, 
  className = '',
  doughnut = false 
}: PieChartProps) {
  const colors = getChartColors(data.length);

  const config = {
    type: doughnut ? 'doughnut' : 'pie',
    data: {
      labels: data.map(item => item.label),
      datasets: [{
        data: data.map(item => item.value),
        backgroundColor: colors.map(c => c.background),
        borderColor: colors.map(c => c.border),
        borderWidth: 1
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'right' as const,
          labels: {
            padding: 20,
            usePointStyle: true
          }
        },
        title: {
          display: !!title,
          text: title || ''
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
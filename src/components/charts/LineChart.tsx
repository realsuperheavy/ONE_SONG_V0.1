import { BaseChart } from './BaseChart';
import { ChartData } from '@/types/charts';
import { getChartColors } from '@/utils/charts';

interface LineChartProps {
  data: ChartData[];
  title?: string;
  className?: string;
  smooth?: boolean;
}

export function LineChart({ 
  data, 
  title, 
  className = '',
  smooth = true 
}: LineChartProps) {
  const colors = getChartColors(1)[0];

  const config = {
    type: 'line',
    data: {
      labels: data.map(item => item.label),
      datasets: [{
        label: title || '',
        data: data.map(item => item.value),
        borderColor: colors.border,
        backgroundColor: colors.background,
        tension: smooth ? 0.4 : 0,
        fill: true
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
      className={`h-64 ${className}`}
    />
  );
} 
import { BaseChart } from './BaseChart';
import { ChartData } from '@/types/charts';
import { getChartColors } from '@/utils/charts';
import { ChartConfiguration } from 'chart.js';

interface ChartDataWithKeys extends ChartData {
  [key: string]: string | number;
}

interface PieChartProps {
  data: ChartData[];
  labelKey: string;
  valueKey: string;
  colors: string[];
  height?: number;
  className?: string;
}

export const PieChart: React.FC<PieChartProps> = ({
  data,
  labelKey,
  valueKey,
  colors,
  height = 250,
  className
}) => {
  const config: ChartConfiguration<'pie'> = {
    type: 'pie',
    data: {
      labels: data.map(item => item[labelKey]),
      datasets: [{
        data: data.map(item => Number(item[valueKey])), // Convert to number
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
          display: true,
          text: 'Pie Chart'
        }
      }
    }
  };

  return (
    <BaseChart 
      config={config as ChartConfiguration} 
      className={`h-${height} ${className ?? ''}`}
    />
  );
};
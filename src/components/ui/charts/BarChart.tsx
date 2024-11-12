import { Bar } from 'react-chartjs-2';

export interface ChartDataPoint {
  label: string;
  value: number;
}

interface BarChartProps {
  data: any[];
  xLabel: string;
  yLabel: string;
  color: string;
  onTooltip: (value: number, type: string) => string;
  barWidth: number;
  grouped?: boolean;
}

export function BarChart({ 
  data, 
  xLabel, 
  yLabel, 
  color, 
  onTooltip, 
  barWidth, 
  grouped
}: BarChartProps) {
  const chartData = {
    labels: data.map(d => d.label),
    datasets: [{
      data: data.map(d => d.value),
      backgroundColor: color,
      borderColor: color,
      borderWidth: 1
    }]
  };

  return (
    <div className="w-full">
      <Bar 
        data={chartData}
        options={{
          scales: {
            x: { title: { display: !!xLabel, text: xLabel } },
            y: { title: { display: !!yLabel, text: yLabel } }
          }
        }} 
      />
    </div>
  );
} 
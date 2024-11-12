import { Line } from 'react-chartjs-2';

interface ChartData {
  x: string | number;
  y: number;
}

interface LineChartProps {
  data: ChartData[];
  title?: string;
  className?: string;
}

export function LineChart({ data, title, className }: LineChartProps) {
  const chartData = {
    labels: data.map(d => d.x),
    datasets: [{
      data: data.map(d => d.y),
      borderColor: '#F49620',
      tension: 0.1
    }]
  };

  return (
    <div className={className}>
      {title && <h3 className="text-lg font-medium mb-4">{title}</h3>}
      <Line data={chartData} />
    </div>
  );
} 
import { PieChart } from '@/components/ui/charts/PieChart';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { RequestAnalytics } from '@/types/analytics';

interface GenreDistributionChartProps {
  data: RequestAnalytics['popularGenres'];
}

export function GenreDistributionChart({ data }: GenreDistributionChartProps) {
  const chartData = Object.entries(data || {})
    .map(([genre, count]) => ({
      label: genre,
      value: count,
      color: getGenreColor(genre)
    }))
    .sort((a, b) => b.value - a.value);

  const total = chartData.reduce((sum, item) => sum + item.value, 0);

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium text-white">Popular Genres</h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="h-[300px]">
          <PieChart
            data={chartData}
            tooltipFormat={(value) => `${((value / total) * 100).toFixed(1)}%`}
          />
        </div>

        <div className="space-y-3">
          {chartData.map(({ label, value, color }) => (
            <div key={label} className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div 
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: color }}
                />
                <span className="text-white">{label}</span>
              </div>
              <Badge variant="secondary" className="bg-[#2E2F2E] text-white">
                {((value / total) * 100).toFixed(1)}%
              </Badge>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function getGenreColor(genre: string): string {
  // Define a consistent color mapping for genres
  const colorMap: Record<string, string> = {
    pop: '#F49620',
    rock: '#FF7200',
    hiphop: '#FF9A3C',
    electronic: '#FFB366',
    rnb: '#FFCC99',
    // Add more genre colors as needed
  };

  return colorMap[genre.toLowerCase()] || '#F49620';
} 
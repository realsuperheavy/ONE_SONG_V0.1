import type { ChartData } from "@/types/charts";

export const transformChartData = <T extends Record<string, any>>(
  data: T[],
  labelKey: keyof T,
  valueKey: keyof T
): ChartData[] => {
  return data.map((item) => ({
    label: String(item[labelKey]),
    value: Number(item[valueKey])
  }));
};

interface ChartColor {
  background: string;
  border: string;
}

const CHART_COLORS = [
  { background: 'rgba(99, 102, 241, 0.2)', border: 'rgb(99, 102, 241)' },
  { background: 'rgba(236, 72, 153, 0.2)', border: 'rgb(236, 72, 153)' },
  { background: 'rgba(34, 197, 94, 0.2)', border: 'rgb(34, 197, 94)' },
  { background: 'rgba(249, 115, 22, 0.2)', border: 'rgb(249, 115, 22)' },
  { background: 'rgba(168, 85, 247, 0.2)', border: 'rgb(168, 85, 247)' },
  { background: 'rgba(234, 179, 8, 0.2)', border: 'rgb(234, 179, 8)' }
];

export function getChartColors(count: number): ChartColor[] {
  // If we need more colors than available, repeat the array
  const repeatedColors = Array(Math.ceil(count / CHART_COLORS.length))
    .fill(CHART_COLORS)
    .flat()
    .slice(0, count);

  return repeatedColors;
}

export function formatChartValue(value: number): string {
  if (value >= 1000000) {
    return `${(value / 1000000).toFixed(1)}M`;
  }
  if (value >= 1000) {
    return `${(value / 1000).toFixed(1)}K`;
  }
  return value.toString();
} 
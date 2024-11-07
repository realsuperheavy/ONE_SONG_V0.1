export interface ChartData {
  label: string;
  value: number;
}

export interface ChartDataset {
  label: string;
  data: number[];
  backgroundColor?: string | string[];
  borderColor?: string | string[];
  borderWidth?: number;
  fill?: boolean;
  tension?: number;
}

export interface ChartOptions {
  responsive?: boolean;
  maintainAspectRatio?: boolean;
  plugins?: {
    legend?: {
      display?: boolean;
      position?: 'top' | 'right' | 'bottom' | 'left';
      labels?: {
        padding?: number;
        usePointStyle?: boolean;
      };
    };
    title?: {
      display?: boolean;
      text?: string;
    };
    tooltip?: {
      mode?: 'index' | 'point' | 'nearest';
      intersect?: boolean;
    };
  };
  scales?: {
    y?: {
      beginAtZero?: boolean;
      ticks?: {
        precision?: number;
      };
    };
  };
  interaction?: {
    intersect?: boolean;
    mode?: 'index' | 'point' | 'nearest';
  };
} 
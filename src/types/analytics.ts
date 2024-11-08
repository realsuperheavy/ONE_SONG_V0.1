export interface RealTimeMetrics {
  requestRate: Array<{time: string; requests: number}>;
  queueLength: Array<{time: string; length: number}>;
  activeUsers: Array<{time: string; users: number}>;
  responseTimes: Array<{endpoint: string; ms: number}>;
  errorRates: Array<{type: string; count: number}>;
  userActivity: Array<{timestamp: number; count: number}>;
  responseLatency: Array<{endpoint: string; ms: number}>;
}

export interface ChartData {
  label: string;
  value: number;
} 
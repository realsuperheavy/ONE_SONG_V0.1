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

export interface AnalyticsEvent {
  name: string;
  params?: Record<string, any>;
  timestamp: number;
}

export interface UserAction {
  action: string;
  userId: string;
  eventId?: string;
  metadata?: Record<string, any>;
  timestamp: number;
}

export interface ErrorEvent {
  error: Error;
  context?: Record<string, any>;
  userId?: string;
  eventId?: string;
  timestamp: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

export interface EventActivity {
  eventId: string;
  action: string;
  metadata?: Record<string, any>;
  timestamp: number;
}

export interface RequestActivity {
  eventId: string;
  requestId: string;
  action: string;
  metadata?: Record<string, any>;
  timestamp: number;
} 
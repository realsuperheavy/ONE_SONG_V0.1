// Base diagnostic types
export interface DiagnosisReport {
  timestamp: number;
  healthStatus: 'healthy' | 'degraded' | 'critical';
  connectivity: { isConnected: boolean };
  sync: { conflicts: string[] };
  operations: { failureRate: number };
  performance: { 
    responseTime: { 
      trend: 'stable' | 'degrading' | 'improving'
    } 
  };
  recommendations: string[];
  severity: 'low' | 'medium' | 'high' | 'critical';
}

export interface ConnectivityStatus {
  isConnected: boolean;
  lastConnected: number;
  connectionAttempts: number;
  latency: number;
}

export interface SyncStatus {
  isSynced: boolean;
  lastSync: number;
  operations: SyncOperation[];
  conflicts: string[];
}

export interface SyncOperation extends Operation {
  status: 'success' | 'failure';
}

export interface OperationsStatus {
  total: number;
  successful: number;
  failed: number;
  failureRate: number;
  recentFailures: Operation[];
  averageLatency: number;
}

export interface Operation {
  type: 'read' | 'write' | 'update' | 'delete';
  timestamp: number;
  duration: number;
}

export interface PerformanceStatus {
  responseTime: MetricTrend;
  memoryUsage: MetricTrend;
  networkLatency: MetricTrend;
}

export interface MetricTrend {
  current: number;
  average: number;
  trend: 'improving' | 'stable' | 'degrading';
  history: number[];
}

// Success tracking types
export interface MetricValue {
  value: number;
  timestamp: number;
}

export interface MetricThresholds {
  performance: {
    responseTime: number;
    memoryUsage: number;
    networkLatency: number;
  };
  reliability: {
    uptime: number;
    errorRate: number;
    syncSuccess: number;
  };
  userExperience: {
    loadTime: number;
    interactionDelay: number;
    errorRecovery: number;
  };
}

export interface MetricReport {
  performance: PerformanceMetrics;
  reliability: ReliabilityMetrics;
  userExperience: UXMetrics;
}

export interface PerformanceMetrics {
  responseTime: number;
  memoryUsage: number;
  networkLatency: number;
  averages: {
    last1m: number;
    last5m: number;
    last15m: number;
  };
}

export interface ReliabilityMetrics {
  uptime: number;
  errorRate: number;
  syncSuccess: number;
  incidents: {
    total: number;
    resolved: number;
    active: number;
  };
}

export interface UXMetrics {
  loadTime: number;
  interactionDelay: number;
  errorRecovery: number;
  satisfaction: {
    score: number;
    responses: number;
  };
}

// Resolution tracking types
export interface ResolutionResult {
  success: boolean;
  resolution?: Resolution;
  verification?: VerificationResult;
  duration?: number;
  attempts: number;
  escalated?: boolean;
  timestamp?: number;
}

export interface Resolution {
  strategy: string;
  steps: ResolutionStep[];
  timestamp: number;
  diagnosis: DiagnosisReport;
}

export interface ResolutionStep {
  action: string;
  success: boolean;
  timestamp: number;
  result?: any;
  error?: Error;
}

export interface VerificationResult {
  passed: boolean;
  checks: VerificationCheck[];
  systemHealth: DiagnosisReport;
  timestamp: number;
}

export interface VerificationCheck {
  step: string;
  passed: boolean;
  timestamp: number;
  details: any;
}

// Error tracking types
export interface ErrorReport {
  error: Error;
  context?: Record<string, any>;
  timestamp: number;
  metadata: {
    component: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    category: 'network' | 'database' | 'application' | 'user';
  };
}

export interface ErrorAnalysis {
  patterns: {
    frequency: Record<string, number>;
    timeDistribution: Record<string, number[]>;
    impactedUsers: string[];
  };
  recommendations: string[];
  severity: 'low' | 'medium' | 'high' | 'critical';
} 
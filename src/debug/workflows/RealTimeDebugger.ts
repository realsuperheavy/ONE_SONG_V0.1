export class RealTimeDebugger {
  private debugger: FirebaseDebugger;
  private monitor: PerformanceMonitor;

  constructor() {
    this.debugger = new FirebaseDebugger();
    this.monitor = new PerformanceMonitor();
  }

  async diagnoseRealTimeIssue(): Promise<DiagnosisReport> {
    const report: DiagnosisReport = {
      connectivity: await this.checkConnectivity(),
      sync: await this.checkDataSync(),
      operations: await this.checkOperations(),
      performance: await this.checkPerformance()
    };

    return this.analyzeReport(report);
  }

  private async checkConnectivity(): Promise<ConnectivityStatus> {
    const status = await this.debugger.connectivityCheck();
    return {
      isConnected: status.realtime,
      lastConnected: Date.now(),
      connectionAttempts: this.debugger.connectionAttempts,
      latency: await this.monitor.getLatency()
    };
  }

  private async checkDataSync(): Promise<SyncStatus> {
    const startTime = Date.now();
    const syncOperations: SyncOperation[] = [];

    try {
      // Check database sync status
      const dbStatus = await this.debugger.checkDatabaseSync();
      syncOperations.push({
        type: 'database',
        status: dbStatus.success,
        timestamp: Date.now(),
        duration: Date.now() - startTime
      });

      // Check cache sync status
      const cacheStatus = await this.debugger.checkCacheSync();
      syncOperations.push({
        type: 'cache',
        status: cacheStatus.success,
        timestamp: Date.now(),
        duration: Date.now() - startTime
      });

      return {
        isSynced: dbStatus.success && cacheStatus.success,
        lastSync: Math.max(...syncOperations.map(op => op.timestamp)),
        operations: syncOperations,
        conflicts: await this.detectSyncConflicts()
      };
    } catch (error) {
      this.monitor.trackError('sync_check_failed', error);
      throw error;
    }
  }

  private async checkOperations(): Promise<OperationsStatus> {
    const operations = await this.debugger.getRecentOperations();
    const failedOps = operations.filter(op => !op.success);

    return {
      total: operations.length,
      successful: operations.length - failedOps.length,
      failed: failedOps.length,
      failureRate: failedOps.length / operations.length,
      recentFailures: failedOps.slice(-5),
      averageLatency: this.calculateAverageLatency(operations)
    };
  }

  private async checkPerformance(): Promise<PerformanceStatus> {
    const metrics = await this.monitor.getMetrics();
    
    return {
      responseTime: {
        average: metrics.responseTime.average,
        p95: metrics.responseTime.p95,
        trend: this.calculateTrend(metrics.responseTime.history)
      },
      memoryUsage: {
        current: metrics.memoryUsage.current,
        peak: metrics.memoryUsage.peak,
        trend: this.calculateTrend(metrics.memoryUsage.history)
      },
      networkLatency: {
        current: metrics.networkLatency.current,
        average: metrics.networkLatency.average,
        trend: this.calculateTrend(metrics.networkLatency.history)
      }
    };
  }

  private async detectSyncConflicts(): Promise<SyncConflict[]> {
    const conflicts: SyncConflict[] = [];
    const dbData = await this.debugger.getDatabaseSnapshot();
    const cacheData = await this.debugger.getCacheSnapshot();

    for (const [key, value] of Object.entries(dbData)) {
      if (JSON.stringify(value) !== JSON.stringify(cacheData[key])) {
        conflicts.push({
          key,
          dbValue: value,
          cacheValue: cacheData[key],
          timestamp: Date.now()
        });
      }
    }

    return conflicts;
  }

  private calculateAverageLatency(operations: Operation[]): number {
    if (!operations.length) return 0;
    const totalLatency = operations.reduce((sum, op) => sum + op.duration, 0);
    return totalLatency / operations.length;
  }

  private calculateTrend(history: number[]): 'improving' | 'stable' | 'degrading' {
    if (history.length < 2) return 'stable';
    
    const recentAvg = this.average(history.slice(-5));
    const previousAvg = this.average(history.slice(-10, -5));
    
    const changePct = ((recentAvg - previousAvg) / previousAvg) * 100;
    
    if (changePct < -10) return 'improving';
    if (changePct > 10) return 'degrading';
    return 'stable';
  }

  private average(numbers: number[]): number {
    return numbers.reduce((a, b) => a + b, 0) / numbers.length;
  }

  private analyzeReport(report: DiagnosisReport): DiagnosisReport & RecommendedActions {
    const recommendations: string[] = [];

    // Analyze connectivity issues
    if (!report.connectivity.isConnected) {
      recommendations.push('Reconnect to real-time database');
    }
    if (report.connectivity.latency > 200) {
      recommendations.push('Investigate network latency issues');
    }

    // Analyze sync issues
    if (!report.sync.isSynced) {
      recommendations.push('Force data resync');
    }
    if (report.sync.conflicts.length > 0) {
      recommendations.push('Resolve data conflicts');
    }

    // Analyze operation issues
    if (report.operations.failureRate > 0.1) {
      recommendations.push('Investigate failed operations');
    }

    // Analyze performance issues
    if (report.performance.responseTime.trend === 'degrading') {
      recommendations.push('Optimize response times');
    }
    if (report.performance.memoryUsage.trend === 'degrading') {
      recommendations.push('Investigate memory usage');
    }

    return {
      ...report,
      recommendations,
      severity: this.calculateSeverity(report),
      timestamp: Date.now()
    };
  }

  private calculateSeverity(report: DiagnosisReport): 'low' | 'medium' | 'high' | 'critical' {
    let score = 0;

    // Connectivity issues are critical
    if (!report.connectivity.isConnected) score += 4;
    if (report.connectivity.latency > 500) score += 2;

    // Sync issues are high priority
    if (!report.sync.isSynced) score += 3;
    if (report.sync.conflicts.length > 0) score += 2;

    // Operation failures are concerning
    if (report.operations.failureRate > 0.2) score += 3;
    if (report.operations.failureRate > 0.1) score += 1;

    // Performance degradation
    if (report.performance.responseTime.trend === 'degrading') score += 1;
    if (report.performance.memoryUsage.trend === 'degrading') score += 1;

    if (score >= 6) return 'critical';
    if (score >= 4) return 'high';
    if (score >= 2) return 'medium';
    return 'low';
  }
} 
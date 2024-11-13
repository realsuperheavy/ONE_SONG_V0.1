'use client';

import { rtdb } from '@/lib/firebase/config';
import { ref, get, set } from 'firebase/database';
import { PerformanceMetricsCollector } from '@/lib/monitoring/PerformanceMetricsCollector';
import { analyticsService } from '@/lib/firebase/services/analytics';
import type { DiagnosisReport } from '@/debug/types';

export class FirebaseDebugger {
  private readonly eventId: string;
  private performanceMonitor: PerformanceMetricsCollector;
  private connectionAttempts: number = 0;
  private lastConnected: number | null = null;

  constructor(eventId: string) {
    this.eventId = eventId;
    this.performanceMonitor = new PerformanceMetricsCollector();
  }

  async diagnoseRealTimeIssue(): Promise<DiagnosisReport> {
    this.performanceMonitor.startOperation('diagnoseRealTime');
    const startTime = Date.now();
    let isConnected = false;
    let errors: Array<{code: string; message: string; timestamp: number}> = [];
    this.connectionAttempts++;

    try {
      const debugRef = ref(rtdb, `debug/${this.eventId}/status`);
      await set(debugRef, { timestamp: startTime });
      const snapshot = await get(debugRef);
      isConnected = snapshot.exists();

      if (isConnected) {
        this.lastConnected = Date.now();
      }

      this.performanceMonitor.endOperation('diagnoseRealTime');
      analyticsService.trackEvent('firebase_diagnosis', {
        eventId: this.eventId,
        status: 'success',
        latency: Date.now() - startTime,
        metrics: this.performanceMonitor.getMetrics()
      });
    } catch (error) {
      this.performanceMonitor.trackError('diagnoseRealTime');
      errors.push({
        code: error instanceof Error ? error.name : 'UNKNOWN_ERROR',
        message: error instanceof Error ? error.message : 'Unknown error occurred',
        timestamp: Date.now()
      });

      analyticsService.trackError(error as Error, {
        context: 'firebase_diagnosis',
        eventId: this.eventId,
        connectionAttempts: this.connectionAttempts
      });
    }

    const connectivity = {
      isConnected,
      latency: Date.now() - startTime,
      lastConnected: this.lastConnected || 0,
      connectionAttempts: this.connectionAttempts
    };

    const report: DiagnosisReport = {
      timestamp: Date.now(),
      connectivity,
      healthStatus: this.determineHealthStatus(connectivity),
      errors,
      performance: this.performanceMonitor.getMetrics(),
      recommendations: this.generateRecommendations(connectivity, errors)
    };

    await this.saveDiagnosisReport(report);
    return report;
  }

  private determineHealthStatus(connectivity: {
    isConnected: boolean;
    latency: number;
  }): 'healthy' | 'degraded' | 'critical' {
    if (!connectivity.isConnected) return 'critical';
    if (connectivity.latency > 3000) return 'degraded';
    return 'healthy';
  }

  private generateRecommendations(
    connectivity: { isConnected: boolean; latency: number },
    errors: Array<{ code: string }>
  ): string[] {
    const recommendations: string[] = [];

    if (!connectivity.isConnected) {
      recommendations.push('Check network connectivity');
    }

    if (connectivity.latency > 3000) {
      recommendations.push('Consider implementing local caching');
    }

    if (errors.length > 0) {
      recommendations.push('Review error patterns and implement retry logic');
    }

    return recommendations;
  }

  private async saveDiagnosisReport(report: DiagnosisReport): Promise<void> {
    try {
      const reportRef = ref(rtdb, `debug/${this.eventId}/reports/latest`);
      await set(reportRef, report);
      
      analyticsService.trackEvent('diagnosis_report_saved', {
        eventId: this.eventId,
        healthStatus: report.healthStatus,
        errorCount: report.errors.length
      });
    } catch (error) {
      analyticsService.trackError(error as Error, {
        context: 'save_diagnosis_report',
        eventId: this.eventId
      });
    }
  }

  dispose(): void {
    this.performanceMonitor.dispose();
  }
} 
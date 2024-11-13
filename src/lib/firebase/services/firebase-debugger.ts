'use client';

import { db, rtdb } from '@/lib/firebase/config';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  doc, 
  setDoc 
} from 'firebase/firestore';
import { ref, get, set } from 'firebase/database';
import { PerformanceMetricsCollector } from '@/lib/monitoring/PerformanceMetricsCollector';
import { analyticsService } from '@/lib/firebase/services/analytics';

interface DiagnosisReport {
  timestamp: number;
  connectivity: {
    isConnected: boolean;
    latency: number;
    lastConnected: number | null;
    connectionAttempts: number;
  };
  performance: {
    responseTime: number;
    memoryUsage: number;
    errorCount: number;
  };
  errors: Array<{
    code: string;
    message: string;
    timestamp: number;
  }>;
  healthStatus: 'healthy' | 'degraded' | 'critical';
  recommendations: string[];
}

export class FirebaseDebugger {
  private readonly eventId: string;
  private performanceMonitor: PerformanceMetricsCollector;
  private connectionAttempts: number = 0;
  private lastConnected: number | null = null;
  private errors: Array<{code: string; message: string; timestamp: number}> = [];

  constructor(eventId: string) {
    this.eventId = eventId;
    this.performanceMonitor = new PerformanceMetricsCollector();
  }

  async diagnoseRealTimeIssue(): Promise<DiagnosisReport> {
    this.performanceMonitor.startOperation('diagnoseRealTime');
    const startTime = Date.now();

    try {
      // Test Realtime Database connection
      const rtdbStatus = await this.checkRTDBConnection();
      
      // Test Firestore connection
      const firestoreStatus = await this.checkFirestoreConnection();
      
      // Get performance metrics
      const performance = await this.getPerformanceMetrics();

      const isConnected = rtdbStatus && firestoreStatus;
      if (isConnected) {
        this.lastConnected = Date.now();
      }

      const report: DiagnosisReport = {
        timestamp: Date.now(),
        connectivity: {
          isConnected,
          latency: Date.now() - startTime,
          lastConnected: this.lastConnected,
          connectionAttempts: ++this.connectionAttempts
        },
        performance,
        errors: this.errors.slice(-5), // Keep last 5 errors
        healthStatus: this.determineHealthStatus(isConnected, performance),
        recommendations: this.generateRecommendations(isConnected, performance)
      };

      await this.saveDiagnosisReport(report);
      this.performanceMonitor.endOperation('diagnoseRealTime');

      analyticsService.trackEvent('firebase_diagnosis_complete', {
        eventId: this.eventId,
        healthStatus: report.healthStatus,
        latency: report.connectivity.latency
      });

      return report;
    } catch (error) {
      this.performanceMonitor.trackError('diagnoseRealTime');
      this.handleError(error as Error);
      throw error;
    }
  }

  private async checkRTDBConnection(): Promise<boolean> {
    try {
      const pingRef = ref(rtdb, `debug/${this.eventId}/ping`);
      await set(pingRef, { timestamp: Date.now() });
      const snapshot = await get(pingRef);
      return snapshot.exists();
    } catch (error) {
      this.handleError(error as Error);
      return false;
    }
  }

  private async checkFirestoreConnection(): Promise<boolean> {
    try {
      const debugRef = doc(db, 'debug', this.eventId);
      await setDoc(debugRef, { timestamp: Date.now() }, { merge: true });
      return true;
    } catch (error) {
      this.handleError(error as Error);
      return false;
    }
  }

  private async getPerformanceMetrics() {
    const metrics = this.performanceMonitor.getMetrics();
    return {
      responseTime: metrics.responseTime || 0,
      memoryUsage: metrics.memoryUsage || 0,
      errorCount: this.errors.length
    };
  }

  private determineHealthStatus(
    isConnected: boolean,
    performance: { responseTime: number; errorCount: number }
  ): DiagnosisReport['healthStatus'] {
    if (!isConnected || performance.errorCount > 5) {
      return 'critical';
    }
    if (performance.responseTime > 1000 || performance.errorCount > 0) {
      return 'degraded';
    }
    return 'healthy';
  }

  private generateRecommendations(
    isConnected: boolean,
    performance: { responseTime: number; errorCount: number }
  ): string[] {
    const recommendations: string[] = [];

    if (!isConnected) {
      recommendations.push('Check network connectivity');
      recommendations.push('Verify Firebase configuration');
    }

    if (performance.responseTime > 1000) {
      recommendations.push('Implement local caching');
      recommendations.push('Optimize data queries');
    }

    if (performance.errorCount > 0) {
      recommendations.push('Review error patterns');
      recommendations.push('Implement retry logic');
    }

    return recommendations;
  }

  private handleError(error: Error) {
    this.errors.push({
      code: error.name,
      message: error.message,
      timestamp: Date.now()
    });

    analyticsService.trackError(error, {
      context: 'firebase_debugger',
      eventId: this.eventId,
      connectionAttempts: this.connectionAttempts
    });
  }

  private async saveDiagnosisReport(report: DiagnosisReport): Promise<void> {
    try {
      const reportRef = doc(db, 'debug', this.eventId, 'reports', Date.now().toString());
      await setDoc(reportRef, report);
    } catch (error) {
      this.handleError(error as Error);
    }
  }

  dispose(): void {
    this.performanceMonitor.dispose();
  }
} 
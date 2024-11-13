'use client';

import { FirebaseDebugger } from './FirebaseDebugger';
import { PerformanceMetricsCollector } from '@/lib/monitoring/PerformanceMetricsCollector';
import { analyticsService } from '@/lib/firebase/services/analytics';

interface DebugReport {
  timestamp: number;
  type: 'error' | 'warning' | 'info';
  context: string;
  message: string;
  metadata?: Record<string, any>;
}

export class DebugManager {
  private static instance: DebugManager;
  private debuggers: Map<string, FirebaseDebugger>;
  private performanceMonitor: PerformanceMetricsCollector;
  private reports: DebugReport[];
  private maxReports: number = 100;

  private constructor() {
    this.debuggers = new Map();
    this.performanceMonitor = new PerformanceMetricsCollector();
    this.reports = [];
  }

  static getInstance(): DebugManager {
    if (!DebugManager.instance) {
      DebugManager.instance = new DebugManager();
    }
    return DebugManager.instance;
  }

  getDebugger(eventId: string): FirebaseDebugger {
    if (!this.debuggers.has(eventId)) {
      this.debuggers.set(eventId, new FirebaseDebugger(eventId));
    }
    return this.debuggers.get(eventId)!;
  }

  async diagnoseAll(): Promise<Record<string, any>> {
    this.performanceMonitor.startOperation('diagnoseAll');
    const results: Record<string, any> = {};

    try {
      await Promise.all(
        Array.from(this.debuggers.entries()).map(async ([eventId, debugger]) => {
          try {
            results[eventId] = await debugger.diagnoseRealTimeIssue();
          } catch (error) {
            this.logReport({
              type: 'error',
              context: 'diagnose_all',
              message: `Failed to diagnose event ${eventId}`,
              metadata: { error }
            });
          }
        })
      );

      this.performanceMonitor.endOperation('diagnoseAll');
      
      analyticsService.trackEvent('debug_all_complete', {
        eventCount: this.debuggers.size,
        results: Object.keys(results).length
      });

      return results;
    } catch (error) {
      this.performanceMonitor.trackError('diagnoseAll');
      throw error;
    }
  }

  logReport(report: Omit<DebugReport, 'timestamp'>): void {
    const fullReport: DebugReport = {
      ...report,
      timestamp: Date.now()
    };

    this.reports.push(fullReport);
    
    // Keep only the latest reports
    if (this.reports.length > this.maxReports) {
      this.reports = this.reports.slice(-this.maxReports);
    }

    // Track severe issues
    if (report.type === 'error') {
      analyticsService.trackEvent('debug_error_logged', {
        context: report.context,
        message: report.message
      });
    }
  }

  getReports(
    filter?: { 
      type?: DebugReport['type']; 
      context?: string;
      startTime?: number;
      endTime?: number;
    }
  ): DebugReport[] {
    let filtered = this.reports;

    if (filter) {
      filtered = filtered.filter(report => {
        if (filter.type && report.type !== filter.type) return false;
        if (filter.context && report.context !== filter.context) return false;
        if (filter.startTime && report.timestamp < filter.startTime) return false;
        if (filter.endTime && report.timestamp > filter.endTime) return false;
        return true;
      });
    }

    return filtered;
  }

  clearReports(): void {
    this.reports = [];
  }

  dispose(): void {
    this.debuggers.forEach(debugger => debugger.dispose());
    this.debuggers.clear();
    this.performanceMonitor.dispose();
  }
}

export const debugManager = DebugManager.getInstance(); 
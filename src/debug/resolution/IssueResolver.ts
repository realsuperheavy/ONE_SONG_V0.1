import { RealTimeDebugger } from '../workflows/RealTimeDebugger';
import { SuccessTracker } from '../metrics/SuccessTracker';
import { FirebaseDebugger } from '@/lib/firebase/services/firebase-debugger';
import { analyticsService } from '@/lib/firebase/services/analytics';
import { DiagnosisReport } from '../types';

interface Issue {
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

interface ResolutionStep {
  action: string;
  success: boolean;
  timestamp: number;
  result?: any;
  error?: Error;
}

interface Resolution {
  strategy: string;
  steps: ResolutionStep[];
  timestamp: number;
  diagnosis: DiagnosisReport;
}

interface VerificationCheck {
  step: string;
  passed: boolean;
  timestamp: number;
  details: any;
}

interface VerificationResult {
  passed: boolean;
  checks: VerificationCheck[];
  systemHealth: DiagnosisReport;
  timestamp: number;
}

interface ResolutionResult {
  success: boolean;
  resolution?: Resolution;
  verification?: VerificationResult;
  attempts: number;
  timestamp: number;
  escalated?: boolean;
}

interface ResolutionStrategy {
  name: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  actions: string[];
}

export class IssueResolver {
  private readonly debugInstance: RealTimeDebugger;
  private readonly metricsInstance: SuccessTracker;
  private readonly firebaseDebuggerInstance: FirebaseDebugger;
  private readonly resolutionAttempts: Map<string, number>;
  private readonly MAX_ATTEMPTS = 3;

  constructor(
    debugInstance: RealTimeDebugger,
    metricsInstance: SuccessTracker,
    firebaseDebuggerInstance: FirebaseDebugger
  ) {
    this.debugInstance = debugInstance;
    this.metricsInstance = metricsInstance;
    this.firebaseDebuggerInstance = firebaseDebuggerInstance;
    this.resolutionAttempts = new Map();
  }

  async resolveIssue(issue: Issue): Promise<ResolutionResult> {
    const issueId = this.generateIssueId(issue);
    const attempts = this.resolutionAttempts.get(issueId) || 0;

    if (attempts >= this.MAX_ATTEMPTS) {
      return this.escalateIssue(issue);
    }

    try {
      // Start resolution tracking
      const startTime = Date.now();
      this.metricsInstance.trackMetric('resolution_attempt', attempts + 1);

      // Get diagnosis with conversion
      const diagnosis = this.convertToDiagnosisReport(
        await this.debugInstance.diagnoseRealTimeIssue()
      );
      
      // Apply resolution strategy
      const resolution = await this.applyResolutionStrategy(diagnosis);
      
      // Verify fix
      const verification = await this.verifyResolution(resolution);
      
      // Monitor stability
      await this.monitorStability(verification);

      // Track success
      const duration = Date.now() - startTime;
      this.metricsInstance.trackMetric('resolution_duration', duration);

      return {
        success: true,
        resolution,
        verification,
        attempts: attempts + 1,
        timestamp: Date.now()
      };
    } catch (error) {
      // Track failure
      this.metricsInstance.trackMetric('resolution_failure', 1);
      this.resolutionAttempts.set(issueId, attempts + 1);

      // Log error
      analyticsService.trackError(error as Error, {
        context: 'issue_resolution',
        issueId,
        attempts: attempts + 1
      });

      throw error;
    }
  }

  private async applyResolutionStrategy(diagnosis: DiagnosisReport): Promise<Resolution> {
    const strategy = this.determineStrategy(diagnosis);
    const steps: ResolutionStep[] = [];

    for (const action of strategy.actions) {
      try {
        const result = await this.executeAction(action);
        steps.push({
          action,
          success: true,
          timestamp: Date.now(),
          result
        });
      } catch (error) {
        steps.push({
          action,
          success: false,
          timestamp: Date.now(),
          error: error as Error
        });
        throw error;
      }
    }

    return {
      strategy: strategy.name,
      steps,
      timestamp: Date.now(),
      diagnosis
    };
  }

  private async verifyResolution(resolution: Resolution): Promise<VerificationResult> {
    const checks: VerificationCheck[] = [];
    let allPassed = true;

    for (const step of resolution.steps) {
      const check = await this.verifyStep(step);
      checks.push(check);
      if (!check.passed) allPassed = false;
    }

    const systemCheck = this.convertToDiagnosisReport(
      await this.debugInstance.diagnoseRealTimeIssue()
    );

    return {
      passed: allPassed && this.isSystemHealthy(systemCheck),
      checks,
      systemHealth: systemCheck,
      timestamp: Date.now()
    };
  }

  private async monitorStability(verification: VerificationResult): Promise<void> {
    const monitoringPeriod = 5 * 60 * 1000; // 5 minutes
    const checkInterval = 30 * 1000; // 30 seconds
    const startTime = Date.now();

    while (Date.now() - startTime < monitoringPeriod) {
      const rawHealth = await this.debugInstance.diagnoseRealTimeIssue();
      const health = this.convertToDiagnosisReport(rawHealth);
      
      if (!this.isSystemHealthy(health)) {
        throw new Error('System instability detected during monitoring');
      }

      await new Promise(resolve => setTimeout(resolve, checkInterval));
    }
  }

  private determineStrategy(diagnosis: DiagnosisReport): ResolutionStrategy {
    if (!diagnosis.connectivity.isConnected) {
      return {
        name: 'restore_connectivity',
        priority: 'critical',
        actions: ['forceReconnect', 'validateConnection']
      };
    }

    if (diagnosis.sync.conflicts.length > 0) {
      return {
        name: 'resolve_conflicts',
        priority: 'high',
        actions: ['resolveConflicts', 'validateData', 'syncData']
      };
    }

    if (diagnosis.performance.responseTime.trend === 'degrading') {
      return {
        name: 'optimize_performance',
        priority: 'medium',
        actions: ['clearCache', 'optimizeIndexes', 'validatePerformance']
      };
    }

    return {
      name: 'general_maintenance',
      priority: 'low',
      actions: ['cleanupResources', 'validateSystem']
    };
  }

  private async executeAction(action: string): Promise<any> {
    switch (action) {
      case 'forceReconnect':
        return this.firebaseDebuggerInstance.forceReconnect();
      case 'validateConnection':
        return this.firebaseDebuggerInstance.validateConnection();
      case 'syncData':
        return this.firebaseDebuggerInstance.forceReconnect();
      case 'resolveConflicts':
        return this.firebaseDebuggerInstance.resolveDataConflicts();
      case 'validateData':
        return this.firebaseDebuggerInstance.validateDataIntegrity();
      case 'clearCache':
        return this.firebaseDebuggerInstance.clearCache();
      case 'optimizeIndexes':
        return this.firebaseDebuggerInstance.optimizeIndexes();
      case 'validatePerformance':
        return this.debugInstance.checkPerformance();
      case 'cleanupResources':
        return this.firebaseDebuggerInstance.cleanupResources();
      case 'validateSystem':
        return this.debugInstance.diagnoseRealTimeIssue();
      default:
        throw new Error(`Unknown action: ${action}`);
    }
  }

  private async verifyStep(step: ResolutionStep): Promise<VerificationCheck> {
    try {
      // Map action to its corresponding validation action
      const validationAction = this.getValidationAction(step.action);
      const check = await this.executeAction(validationAction);
      
      return {
        step: step.action,
        passed: check.success || false,
        timestamp: Date.now(),
        details: check
      };
    } catch (error) {
      return {
        step: step.action,
        passed: false,
        timestamp: Date.now(),
        details: { error: error instanceof Error ? error.message : 'Unknown error' }
      };
    }
  }

  private getValidationAction(action: string): string {
    const validationMap: Record<string, string> = {
      'forceReconnect': 'validateConnection',
      'resolveConflicts': 'validateData',
      'clearCache': 'validatePerformance',
      'optimizeIndexes': 'validatePerformance',
      'cleanupResources': 'validateSystem'
    };
    
    return validationMap[action] || `validate${action.charAt(0).toUpperCase()}${action.slice(1)}`;
  }

  private isSystemHealthy(diagnosis: DiagnosisReport): boolean {
    return (
      diagnosis.connectivity.isConnected &&
      diagnosis.sync.conflicts.length === 0 &&
      diagnosis.operations.failureRate < 0.1 &&
      diagnosis.performance.responseTime.trend !== 'degrading'
    );
  }

  private generateIssueId(issue: Issue): string {
    return `${issue.type}_${issue.severity}_${Date.now()}`;
  }

  private async escalateIssue(issue: Issue): Promise<ResolutionResult> {
    analyticsService.trackEvent('issue_escalated', {
      issueId: this.generateIssueId(issue),
      type: issue.type,
      severity: issue.severity,
      attempts: this.MAX_ATTEMPTS
    });

    return {
      success: false,
      escalated: true,
      attempts: this.MAX_ATTEMPTS,
      timestamp: Date.now()
    };
  }

  // Update convertToDiagnosisReport to properly handle all required fields
  private convertToDiagnosisReport(report: any): DiagnosisReport {
    return {
      ...report,
      recommendations: report.recommendations || [],
      severity: report.severity || 'low',
      timestamp: report.timestamp || Date.now(),
      connectivity: report.connectivity || { isConnected: false },
      sync: report.sync || { conflicts: [] },
      performance: report.performance || { 
        responseTime: { trend: 'stable' } 
      },
      operations: report.operations || { failureRate: 0 },
      healthStatus: report.healthStatus || 'healthy',
      issues: report.issues || []
    } as DiagnosisReport;
  }
} 
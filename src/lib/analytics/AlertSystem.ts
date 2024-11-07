import { analyticsService } from '@/lib/firebase/services/analytics';
import { Cache } from '@/lib/cache';

interface AlertRule {
  id: string;
  name: string;
  description: string;
  condition: () => boolean;
  severity: 'info' | 'warning' | 'error' | 'critical';
  throttleMs?: number;
}

interface Alert {
  id: string;
  ruleId: string;
  name: string;
  description: string;
  severity: AlertRule['severity'];
  timestamp: number;
  context?: Record<string, any>;
}

export class AlertSystem {
  private rules: Map<string, AlertRule>;
  private alerts: Alert[];
  private subscribers: Set<(alerts: Alert[]) => void>;
  private cache: Cache<boolean>;
  private readonly MAX_ALERTS = 100;
  private readonly DEFAULT_THROTTLE = 5 * 60 * 1000; // 5 minutes

  constructor() {
    this.rules = new Map();
    this.alerts = [];
    this.subscribers = new Set();
    this.cache = new Cache({ maxSize: 1000, ttl: 60 * 60 * 1000 }); // 1 hour
    this.initializeDefaultRules();
  }

  addRule(rule: AlertRule): void {
    if (this.rules.has(rule.id)) {
      throw new Error(`Rule with ID ${rule.id} already exists`);
    }

    this.rules.set(rule.id, {
      ...rule,
      throttleMs: rule.throttleMs || this.DEFAULT_THROTTLE
    });

    analyticsService.trackEvent('alert_rule_added', {
      ruleId: rule.id,
      name: rule.name,
      severity: rule.severity
    });
  }

  subscribe(callback: (alerts: Alert[]) => void): () => void {
    this.subscribers.add(callback);
    return () => this.subscribers.delete(callback);
  }

  async checkRules(): Promise<void> {
    for (const rule of this.rules.values()) {
      try {
        const cacheKey = `rule_${rule.id}`;
        if (this.cache.get(cacheKey)) continue;

        if (rule.condition()) {
          await this.triggerAlert(rule);
          this.cache.set(cacheKey, true, rule.throttleMs);
        }
      } catch (error) {
        analyticsService.trackError(error as Error, {
          context: 'alert_rule_check',
          ruleId: rule.id
        });
      }
    }
  }

  private async triggerAlert(rule: AlertRule): Promise<void> {
    const alert: Alert = {
      id: `${rule.id}_${Date.now()}`,
      ruleId: rule.id,
      name: rule.name,
      description: rule.description,
      severity: rule.severity,
      timestamp: Date.now()
    };

    // Add alert to list
    this.alerts.unshift(alert);
    
    // Maintain max alerts
    if (this.alerts.length > this.MAX_ALERTS) {
      this.alerts.pop();
    }

    // Notify subscribers
    this.subscribers.forEach(callback => callback([...this.alerts]));

    // Track alert
    await analyticsService.trackEvent('alert_triggered', {
      alertId: alert.id,
      ruleId: rule.id,
      severity: rule.severity
    });
  }

  private initializeDefaultRules(): void {
    // High error rate rule
    this.addRule({
      id: 'high_error_rate',
      name: 'High Error Rate',
      description: 'Error rate exceeds 10%',
      severity: 'critical',
      condition: () => this.getErrorRate() > 0.1
    });

    // Response time rule
    this.addRule({
      id: 'slow_response_time',
      name: 'Slow Response Time',
      description: 'Average response time exceeds 1000ms',
      severity: 'warning',
      condition: () => this.getAverageResponseTime() > 1000
    });

    // Queue length rule
    this.addRule({
      id: 'long_queue',
      name: 'Long Queue',
      description: 'Queue length exceeds 50 items',
      severity: 'warning',
      condition: () => this.getQueueLength() > 50
    });
  }

  private getErrorRate(): number {
    // Implementation would get actual error rate from metrics
    return 0;
  }

  private getAverageResponseTime(): number {
    // Implementation would get actual response time from metrics
    return 0;
  }

  private getQueueLength(): number {
    // Implementation would get actual queue length from metrics
    return 0;
  }

  clearAlerts(): void {
    this.alerts = [];
    this.subscribers.forEach(callback => callback([]));
  }

  getActiveAlerts(): Alert[] {
    return [...this.alerts];
  }

  cleanup(): void {
    this.rules.clear();
    this.alerts = [];
    this.subscribers.clear();
    this.cache.clear();
  }
} 
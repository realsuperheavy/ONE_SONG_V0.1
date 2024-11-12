import { analyticsService } from '@/lib/firebase/services/analytics';
import { Cache } from '@/lib/cache';

export interface AlertRule {
  id: string;
  name: string;
  description: string;
  condition: () => Promise<boolean>;
  severity: 'info' | 'warning' | 'error';
  throttleMs?: number;
}

interface Alert {
  id: string;
  ruleId: string;
  message: string;
  severity: AlertRule['severity'];
  timestamp: number;
  metadata?: Record<string, any>;
}

export class AlertSystem {
  private rules: Map<string, AlertRule> = new Map();
  private alertCache: Cache<Alert>;
  private lastAlertTime: Map<string, number> = new Map();

  constructor() {
    this.alertCache = new Cache<Alert>({ maxSize: 100, ttl: 24 * 60 * 60 * 1000 }); // 24 hours
  }

  /**
   * Add a new alert rule
   */
  registerRule(rule: AlertRule): void {
    this.rules.set(rule.id, rule);
  }

  /**
   * Remove an alert rule
   */
  removeRule(ruleId: string): void {
    this.rules.delete(ruleId);
  }

  /**
   * Check all rules and generate alerts if conditions are met
   */
  async checkRules(ruleId: string): Promise<void> {
    const rule = this.rules.get(ruleId);
    if (!rule) return;
    
    if (await rule.condition()) {
      const alert = {
        id: `${rule.id}_${Date.now()}`,
        ruleId: rule.id,
        message: rule.description,
        severity: rule.severity,
        timestamp: Date.now()
      };

      await this.alertCache.set(alert.id, alert);
      this.lastAlertTime.set(rule.id, Date.now());

      // Track alert in analytics
      analyticsService.trackEvent('alert_triggered', {
        ruleId: rule.id,
        severity: rule.severity,
        timestamp: Date.now()
      });
    }
  }

  /**
   * Get recent alerts
   */
  async getRecentAlerts(limit: number = 50): Promise<Alert[]> {
    const alerts = await this.alertCache.getAll();
    return [...alerts.values()]
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, limit);
  }

  /**
   * Clear alerts for a specific rule
   */
  async clearAlerts(ruleId: string): Promise<void> {
    const alerts = await this.alertCache.getAll();
    for (const [key, alert] of alerts.entries()) {
      if (alert.ruleId === ruleId) {
        await this.alertCache.delete(key);
      }
    }
  }
} 
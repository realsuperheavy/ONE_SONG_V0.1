import { MetricsClient } from '../metrics/client';
import { Logger } from '../utils/logger';
import type { WebhookDeliveryDetails } from '../../types/webhooks';

export class WebhookMonitoring {
  private readonly logger = new Logger('WebhookMonitoring');
  private readonly metrics = new MetricsClient('webhooks');

  async trackDelivery(details: WebhookDeliveryDetails): Promise<void> {
    // Track performance metrics
    this.metrics.histogram('webhook_delivery_duration', details.duration);
    this.metrics.increment(`webhook_delivery_${details.success ? 'success' : 'failure'}`);
    
    if (details.attempt > 1) {
      this.metrics.increment('webhook_delivery_retry');
    }

    // Log delivery details
    this.logger.info('Webhook delivery tracked', {
      ...details,
      duration: `${details.duration}ms`
    });
  }
} 
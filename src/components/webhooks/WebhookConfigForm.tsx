import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/card';
import { Alert } from '@/components/ui/alert';
import { webhookService } from '@/lib/webhooks/config';
import { WebhookEventType } from '@/types/webhooks';
import { analyticsService } from '@/lib/firebase/services/analytics';
import type { WebhookConfig } from '@/types/webhooks';

interface WebhookConfigFormProps {
  existingConfig?: WebhookConfig;
  onSubmit: (config: WebhookConfig) => Promise<void>;
}

export const WebhookConfigForm: React.FC<WebhookConfigFormProps> = ({
  existingConfig,
  onSubmit
}) => {
  const [name, setName] = useState(existingConfig?.name || '');
  const [url, setUrl] = useState(existingConfig?.url || '');
  const [secret, setSecret] = useState(existingConfig?.secret || '');
  const [selectedEvents, setSelectedEvents] = useState<WebhookEventType[]>(
    existingConfig?.events || []
  );
  const [maxRequests, setMaxRequests] = useState(
    existingConfig?.rateLimit?.maxRequests || 100
  );
  const [windowMs, setWindowMs] = useState(
    existingConfig?.rateLimit?.windowMs || 60000
  );
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const config = {
        name,
        url,
        secret,
        events: selectedEvents,
        enabled: true,
        rateLimit: {
          maxRequests,
          windowMs
        }
      };

      await onSubmit(config);
      
      analyticsService.trackEvent('webhook_config_updated', {
        name,
        eventCount: selectedEvents.length
      });

    } catch (error) {
      const err = error as Error;
      setError(err.message);
      analyticsService.trackError(err, {
        context: 'webhook_config_update'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="p-6">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium">
              Webhook Name
            </label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder="My Webhook"
            />
          </div>

          <div>
            <label htmlFor="url" className="block text-sm font-medium">
              Endpoint URL
            </label>
            <Input
              id="url"
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              required
              placeholder="https://api.example.com/webhook"
            />
          </div>

          <div>
            <label htmlFor="secret" className="block text-sm font-medium">
              Secret Key
            </label>
            <Input
              id="secret"
              type="password"
              value={secret}
              onChange={(e) => setSecret(e.target.value)}
              required
              placeholder="••••••••"
            />
          </div>

          <EventTypeSelector
            selectedEvents={selectedEvents}
            onChange={setSelectedEvents}
          />

          <div className="space-y-4">
            <h3 className="text-lg font-medium">Rate Limiting</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="maxRequests" className="block text-sm font-medium">
                  Max Requests
                </label>
                <Input
                  id="maxRequests"
                  type="number"
                  min="1"
                  value={maxRequests}
                  onChange={(e) => setMaxRequests(parseInt(e.target.value))}
                  required
                />
              </div>
              <div>
                <label htmlFor="windowMs" className="block text-sm font-medium">
                  Time Window (ms)
                </label>
                <Input
                  id="windowMs"
                  type="number"
                  min="1000"
                  step="1000"
                  value={windowMs}
                  onChange={(e) => setWindowMs(parseInt(e.target.value))}
                  required
                />
              </div>
            </div>
          </div>
        </div>

        {error && (
          <Alert variant="error" className="mt-4">
            {error}
          </Alert>
        )}

        <div className="flex justify-end space-x-4">
          <Button
            type="submit"
            disabled={isSubmitting}
            loading={isSubmitting}
          >
            {existingConfig ? 'Update Webhook' : 'Create Webhook'}
          </Button>
        </div>
      </form>
    </Card>
  );
};

const EventTypeSelector: React.FC<{
  selectedEvents: WebhookEventType[];
  onChange: (events: WebhookEventType[]) => void;
}> = ({ selectedEvents, onChange }) => {
  const eventTypes: WebhookEventType[] = [
    'song.requested',
    'song.approved',
    'song.rejected',
    'song.played',
    'queue.updated',
    'event.started',
    'event.ended',
    'tip.received',
    'user.joined',
    'user.left'
  ];

  const toggleEvent = (event: WebhookEventType) => {
    if (selectedEvents.includes(event)) {
      onChange(selectedEvents.filter(e => e !== event));
    } else {
      onChange([...selectedEvents, event]);
    }
  };

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium">Event Types</label>
      <div className="grid grid-cols-2 gap-2">
        {eventTypes.map((event) => (
          <label
            key={event}
            className="flex items-center space-x-2 p-2 rounded border cursor-pointer hover:bg-gray-50"
          >
            <input
              type="checkbox"
              checked={selectedEvents.includes(event)}
              onChange={() => toggleEvent(event)}
              className="rounded border-gray-300"
            />
            <span className="text-sm">{event}</span>
          </label>
        ))}
      </div>
    </div>
  );
}; 
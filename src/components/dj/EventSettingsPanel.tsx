'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/useToast';
import { analyticsService } from '@/lib/firebase/services/analytics';

interface EventSettings {
  requestApproval: boolean;
  maxQueueSize: number;
  allowDuplicates: boolean;
  requestLimit: number;
  autoPlay: boolean;
  notifications: {
    newRequests: boolean;
    queueUpdates: boolean;
  };
  theme: 'light' | 'dark' | 'system';
}

export function EventSettingsPanel() {
  const [settings, setSettings] = useState<EventSettings>({
    requestApproval: true,
    maxQueueSize: 50,
    allowDuplicates: false,
    requestLimit: 3,
    autoPlay: false,
    notifications: {
      newRequests: true,
      queueUpdates: true
    },
    theme: 'system'
  });
  const { showToast } = useToast();

  const handleSave = async () => {
    try {
      // Save settings logic here
      analyticsService.trackEvent('event_settings_updated', {
        settings
      });

      showToast({
        title: 'Settings Saved',
        description: 'Your event settings have been updated.',
        variant: 'default'
      });
    } catch (error) {
      showToast({
        title: 'Error',
        description: 'Failed to save settings.',
        variant: 'destructive'
      });
    }
  };

  return (
    <Card className="p-6 space-y-8">
      <div>
        <h2 className="text-xl font-semibold mb-4">Event Settings</h2>
        <p className="text-sm text-gray-500">
          Configure your event preferences and restrictions
        </p>
      </div>

      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <label className="font-medium">Request Approval</label>
            <p className="text-sm text-gray-500">
              Manually approve song requests
            </p>
          </div>
          <Switch
            checked={settings.requestApproval}
            onCheckedChange={(checked) => 
              setSettings(s => ({ ...s, requestApproval: checked }))
            }
            aria-label="Toggle request approval"
          />
        </div>

        <div className="space-y-2">
          <label className="font-medium">Maximum Queue Size</label>
          <Input
            type="number"
            value={settings.maxQueueSize}
            onChange={(e) => 
              setSettings(s => ({ ...s, maxQueueSize: parseInt(e.target.value) }))
            }
            min={1}
            max={100}
            aria-label="Maximum queue size"
          />
        </div>

        <div className="space-y-2">
          <label className="font-medium">Theme</label>
          <RadioGroup
            value={settings.theme}
            onValueChange={(value: 'light' | 'dark' | 'system') => 
              setSettings(s => ({ ...s, theme: value }))
            }
            aria-label="Select theme"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="light" id="theme-light" />
              <label htmlFor="theme-light">Light</label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="dark" id="theme-dark" />
              <label htmlFor="theme-dark">Dark</label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="system" id="theme-system" />
              <label htmlFor="theme-system">System</label>
            </div>
          </RadioGroup>
        </div>

        <Button onClick={handleSave} className="w-full">
          Save Settings
        </Button>
      </div>
    </Card>
  );
} 
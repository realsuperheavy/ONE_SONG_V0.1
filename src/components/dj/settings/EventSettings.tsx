import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Loader2, Save } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Event } from '@/types/models';
import { EventManager } from '@/features/events/EventManagement';

interface EventSettingsProps {
  event: Event;
  onUpdate: (event: Event) => void;
}

export function EventSettings({ event, onUpdate }: EventSettingsProps) {
  const [loading, setLoading] = useState(false);
  const { showToast } = useToast();
  const [settings, setSettings] = useState({
    allowTips: event.settings.allowTips,
    requireApproval: event.settings.requireApproval,
    maxQueueSize: event.settings.maxQueueSize,
    blacklistedGenres: event.settings.blacklistedGenres.join(', ')
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const eventManager = new EventManager();
      await eventManager.updateEvent(event.id, {
        settings: {
          ...settings,
          blacklistedGenres: settings.blacklistedGenres
            .split(',')
            .map(genre => genre.trim())
            .filter(Boolean)
        }
      });

      showToast('Settings updated successfully', 'success');
      onUpdate(event);
    } catch (error) {
      showToast('Failed to update settings', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="p-6 space-y-6">
      <div className="space-y-2">
        <h2 className="text-2xl font-bold text-white">Event Settings</h2>
        <p className="text-gray-400">
          Configure your event preferences and restrictions
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label htmlFor="allowTips">Allow Tips</Label>
              <p className="text-sm text-gray-400">
                Enable tipping for song requests
              </p>
            </div>
            <Switch
              id="allowTips"
              checked={settings.allowTips}
              onCheckedChange={(checked) => setSettings(prev => ({
                ...prev,
                allowTips: checked
              }))}
              disabled={loading}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label htmlFor="requireApproval">Require Approval</Label>
              <p className="text-sm text-gray-400">
                Review requests before adding to queue
              </p>
            </div>
            <Switch
              id="requireApproval"
              checked={settings.requireApproval}
              onCheckedChange={(checked) => setSettings(prev => ({
                ...prev,
                requireApproval: checked
              }))}
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="maxQueueSize">Maximum Queue Size</Label>
            <Input
              id="maxQueueSize"
              type="number"
              min={1}
              max={100}
              value={settings.maxQueueSize}
              onChange={(e) => setSettings(prev => ({
                ...prev,
                maxQueueSize: parseInt(e.target.value)
              }))}
              disabled={loading}
            />
            <p className="text-sm text-gray-400">
              Set a limit for the number of songs in queue (1-100)
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="blacklistedGenres">Blacklisted Genres</Label>
            <Input
              id="blacklistedGenres"
              value={settings.blacklistedGenres}
              onChange={(e) => setSettings(prev => ({
                ...prev,
                blacklistedGenres: e.target.value
              }))}
              placeholder="Pop, Rock, Metal (comma separated)"
              disabled={loading}
            />
            <p className="text-sm text-gray-400">
              Enter genres you don't want to play, separated by commas
            </p>
          </div>
        </div>

        <Button
          type="submit"
          className="w-full bg-[#F49620] hover:bg-[#FF7200] text-white"
          disabled={loading}
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Save Settings
            </>
          )}
        </Button>
      </form>
    </Card>
  );
} 
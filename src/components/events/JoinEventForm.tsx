'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { analyticsService } from '@/lib/firebase/services/analytics';

interface JoinEventFormProps {
  onSubmit: (code: string) => Promise<void>;
}

export function JoinEventForm({ onSubmit }: JoinEventFormProps) {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) return;

    setLoading(true);
    try {
      await onSubmit(code.trim());
      analyticsService.trackEvent('event_code_submitted', {
        success: true
      });
    } catch (error) {
      analyticsService.trackEvent('event_code_submitted', {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex gap-2">
        <Input
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="Enter event code"
          disabled={loading}
          className="flex-1"
        />
        <Button type="submit" disabled={!code.trim() || loading}>
          {loading ? <LoadingSpinner size={16} /> : 'Join'}
        </Button>
      </div>
    </form>
  );
} 
'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/useToast';
import { useAuth } from '@/providers/auth-provider';
import { analyticsService } from '@/lib/firebase/services/analytics';

interface ProfileForm {
  displayName: string;
  email: string;
  phoneNumber: string;
  preferences: {
    notifications: boolean;
    theme: 'light' | 'dark';
  };
}

export function ProfileEditor() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [form, setForm] = useState<ProfileForm>({
    displayName: user?.displayName || '',
    email: user?.email || '',
    phoneNumber: user?.phoneNumber || '',
    preferences: {
      notifications: true,
      theme: 'dark'
    }
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Update profile logic here
      analyticsService.trackEvent('profile_updated', {
        userId: user?.uid,
        updatedFields: Object.keys(form)
      });

      showToast({
        title: 'Success',
        description: 'Profile updated successfully',
        variant: 'default'
      });
    } catch (error) {
      showToast({
        title: 'Error',
        description: 'Failed to update profile',
        variant: 'destructive'
      });
      analyticsService.trackError(error as Error, {
        context: 'profile_update'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="p-6 max-w-md mx-auto">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Display Name</label>
          <Input
            value={form.displayName}
            onChange={(e) => setForm({ ...form, displayName: e.target.value })}
            placeholder="Your display name"
            required
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Email</label>
          <Input
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            placeholder="Your email"
            required
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Phone Number</label>
          <Input
            type="tel"
            value={form.phoneNumber}
            onChange={(e) => setForm({ ...form, phoneNumber: e.target.value })}
            placeholder="Your phone number"
          />
        </div>

        <div className="flex items-center justify-between pt-4">
          <Button type="submit" loading={loading}>
            Save Changes
          </Button>
        </div>
      </form>
    </Card>
  );
} 
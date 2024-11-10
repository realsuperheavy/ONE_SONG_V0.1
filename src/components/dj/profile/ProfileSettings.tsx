import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Avatar } from '@/components/ui/avatar';
import { Camera, Loader2, Save } from 'lucide-react';
import { useToast } from '@/hooks/useToast';
import { useUser } from '@/hooks/useUser';
import { storage } from '@/lib/firebase/config';
import { ref, uploadBytes, getDownloadURL } from '@firebase/storage';

interface ProfileSettings {
  displayName: string;
  bio: string;
  email: string;
  notifications: {
    email: boolean;
    push: boolean;
    sms: boolean;
  };
  theme: 'light' | 'dark';
  language: string;
}

export function ProfileSettings() {
  const { user, updateProfile } = useUser();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [settings, setSettings] = useState<ProfileSettings>({
    displayName: user?.profile.displayName || '',
    bio: user?.profile.bio || '',
    email: user?.profile.email || '',
    notifications: {
      email: user?.settings?.notifications?.email || false,
      push: user?.settings?.notifications?.push || false,
      sms: user?.settings?.notifications?.sms || false
    },
    theme: user?.settings?.theme || 'dark',
    language: user?.settings?.language || 'en'
  });

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0]) return;

    setLoading(true);
    try {
      const file = e.target.files[0];
      const storageRef = ref(storage, `profile-photos/${user?.id}/${file.name}`);
      await uploadBytes(storageRef, file);
      const photoURL = await getDownloadURL(storageRef);
      
      await updateProfile({ photoURL });
      toast({
        title: 'Photo updated successfully',
        variant: 'success'
      });
    } catch (error) {
      toast({
        title: 'Failed to update photo',
        description: 'Please try again',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await updateProfile({
        profile: {
          displayName: settings.displayName,
          bio: settings.bio,
          email: settings.email
        },
        settings: {
          notifications: settings.notifications,
          theme: settings.theme,
          language: settings.language
        }
      });

      toast({
        title: 'Profile updated successfully',
        variant: 'success'
      });
    } catch (error) {
      toast({
        title: 'Failed to update profile',
        description: 'Please try again',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="p-6 space-y-6">
      <div className="space-y-2">
        <h2 className="text-2xl font-bold text-white">Profile Settings</h2>
        <p className="text-gray-400">
          Manage your profile information and preferences
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Photo Upload */}
        <div className="flex items-center space-x-4">
          <Avatar
            src={user?.profile.photoURL}
            fallback={settings.displayName[0] || '?'}
            className="w-16 h-16"
          />
          <div>
            <Label htmlFor="photo" className="cursor-pointer">
              <div className="flex items-center space-x-2 text-[#F49620] hover:text-[#FF7200]">
                <Camera className="w-4 h-4" />
                <span>Change photo</span>
              </div>
            </Label>
            <input
              id="photo"
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handlePhotoUpload}
              disabled={loading}
            />
          </div>
        </div>

        {/* Profile Fields */}
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="displayName">Display Name</Label>
            <Input
              id="displayName"
              value={settings.displayName}
              onChange={(e) => setSettings(prev => ({
                ...prev,
                displayName: e.target.value
              }))}
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="bio">Bio</Label>
            <Textarea
              id="bio"
              value={settings.bio}
              onChange={(e) => setSettings(prev => ({
                ...prev,
                bio: e.target.value
              }))}
              disabled={loading}
              rows={4}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={settings.email}
              onChange={(e) => setSettings(prev => ({
                ...prev,
                email: e.target.value
              }))}
              disabled={loading}
            />
          </div>

          {/* Notification Settings */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-white">Notifications</h3>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label htmlFor="emailNotifications">Email Notifications</Label>
                <Switch
                  id="emailNotifications"
                  checked={settings.notifications.email}
                  onCheckedChange={(checked) => setSettings(prev => ({
                    ...prev,
                    notifications: {
                      ...prev.notifications,
                      email: checked
                    }
                  }))}
                  disabled={loading}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="pushNotifications">Push Notifications</Label>
                <Switch
                  id="pushNotifications"
                  checked={settings.notifications.push}
                  onCheckedChange={(checked) => setSettings(prev => ({
                    ...prev,
                    notifications: {
                      ...prev.notifications,
                      push: checked
                    }
                  }))}
                  disabled={loading}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="smsNotifications">SMS Notifications</Label>
                <Switch
                  id="smsNotifications"
                  checked={settings.notifications.sms}
                  onCheckedChange={(checked) => setSettings(prev => ({
                    ...prev,
                    notifications: {
                      ...prev.notifications,
                      sms: checked
                    }
                  }))}
                  disabled={loading}
                />
              </div>
            </div>
          </div>

          {/* Theme & Language */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="theme">Theme</Label>
              <select
                id="theme"
                value={settings.theme}
                onChange={(e) => setSettings(prev => ({
                  ...prev,
                  theme: e.target.value as 'light' | 'dark'
                }))}
                className="w-full bg-[#1E1E1E] border border-white/20 rounded-lg px-4 py-2 text-white"
                disabled={loading}
              >
                <option value="light">Light</option>
                <option value="dark">Dark</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="language">Language</Label>
              <select
                id="language"
                value={settings.language}
                onChange={(e) => setSettings(prev => ({
                  ...prev,
                  language: e.target.value
                }))}
                className="w-full bg-[#1E1E1E] border border-white/20 rounded-lg px-4 py-2 text-white"
                disabled={loading}
              >
                <option value="en">English</option>
                <option value="es">Spanish</option>
                <option value="fr">French</option>
              </select>
            </div>
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
import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Avatar } from '@/components/ui/avatar';
import { Camera, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/useToast';
import { useUser } from '@/hooks/useUser';
import { storage } from '@/lib/firebase/config';
import { ref, uploadBytes, getDownloadURL } from '@firebase/storage';

interface ProfileData {
  displayName: string;
  bio: string;
  email: string;
  notifications: boolean;
  photoURL?: string;
}

export function SetupForm() {
  const { user, updateProfile } = useUser();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [profileData, setProfileData] = useState<ProfileData>({
    displayName: user?.profile.displayName || '',
    bio: user?.profile.bio || '',
    email: user?.profile.email || '',
    notifications: user?.settings?.notifications || false,
    photoURL: user?.profile.photoURL
  });

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0]) return;

    setLoading(true);
    try {
      const file = e.target.files[0];
      const storageRef = ref(storage, `profile-photos/${user?.id}/${file.name}`);
      await uploadBytes(storageRef, file);
      const photoURL = await getDownloadURL(storageRef);
      
      setProfileData(prev => ({ ...prev, photoURL }));
      toast({
        title: 'Photo uploaded successfully',
        variant: 'success'
      });
    } catch (error) {
      toast({
        title: 'Failed to upload photo',
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
      await updateProfile(profileData);
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
        <h2 className="text-2xl font-bold text-white">Profile Setup</h2>
        <p className="text-gray-400">
          Complete your profile to get started with OneSong
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Photo Upload */}
        <div className="flex items-center space-x-4">
          <Avatar
            src={profileData.photoURL}
            fallback={profileData.displayName?.[0] || '?'}
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
          <div>
            <Label htmlFor="displayName">Display Name</Label>
            <Input
              id="displayName"
              value={profileData.displayName}
              onChange={(e) => setProfileData(prev => ({
                ...prev,
                displayName: e.target.value
              }))}
              disabled={loading}
            />
          </div>

          <div>
            <Label htmlFor="bio">Bio</Label>
            <Textarea
              id="bio"
              value={profileData.bio}
              onChange={(e) => setProfileData(prev => ({
                ...prev,
                bio: e.target.value
              }))}
              disabled={loading}
              rows={4}
            />
          </div>

          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={profileData.email}
              onChange={(e) => setProfileData(prev => ({
                ...prev,
                email: e.target.value
              }))}
              disabled={loading}
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="notifications">Enable Notifications</Label>
            <Switch
              id="notifications"
              checked={profileData.notifications}
              onCheckedChange={(checked) => setProfileData(prev => ({
                ...prev,
                notifications: checked
              }))}
              disabled={loading}
            />
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
            'Save Profile'
          )}
        </Button>
      </form>
    </Card>
  );
}

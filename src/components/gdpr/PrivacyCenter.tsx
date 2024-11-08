import { useState } from 'react';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { GDPRDataManager } from '@/lib/gdpr/DataManager';
import { ConsentBanner } from './ConsentBanner';
import { useAuth } from '@/hooks/useAuth';
import { analyticsService } from '@/lib/firebase/services/analytics';
import { toast } from '../ui/toast';

export const PrivacyCenter: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [consent, setConsent] = useState<UserConsent | null>(null);

  const handleExportData = async () => {
    if (!user?.id) return;
    
    setLoading(true);
    try {
      const gdpr = new GDPRDataManager();
      const data = await gdpr.getUserData(user.id);
      
      // Create and download file
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `data-export-${new Date().toISOString()}.json`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success('Your data has been exported successfully');
      
      analyticsService.trackEvent('data_exported', { userId: user.id });
    } catch (error) {
      toast.error('Failed to export data. Please try again.');
      analyticsService.trackError(error as Error, {
        context: 'privacy_center',
        action: 'export_data',
        userId: user.id
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!user?.id || !window.confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
      return;
    }

    setLoading(true);
    try {
      const gdpr = new GDPRDataManager();
      await gdpr.deleteUserData(user.id);
      
      toast.success('Your account has been deleted successfully');
      analyticsService.trackEvent('account_deleted', { userId: user.id });
      
      // Redirect to home page or sign out
      window.location.href = '/';
    } catch (error) {
      toast.error('Failed to delete account. Please try again.');
      analyticsService.trackError(error as Error, {
        context: 'privacy_center',
        action: 'delete_account',
        userId: user.id
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <h1 className="text-2xl font-bold mb-6">Privacy Center</h1>

      <Card className="p-6 space-y-6">
        <section aria-labelledby="consent-heading">
          <h2 id="consent-heading" className="text-xl font-semibold mb-4">
            Cookie Preferences
          </h2>
          {user?.id && (
            <ConsentBanner 
              userId={user.id}
              onConsent={setConsent}
            />
          )}
        </section>

        <section aria-labelledby="data-heading">
          <h2 id="data-heading" className="text-xl font-semibold mb-4">
            Your Data
          </h2>
          <div className="space-y-4">
            <Button
              onClick={handleExportData}
              disabled={loading}
              aria-label="Export your data"
              className="w-full sm:w-auto"
            >
              Export Your Data
            </Button>
            <p className="text-sm text-gray-600">
              Download a copy of your personal data in JSON format.
            </p>
          </div>
        </section>

        <section aria-labelledby="account-heading">
          <h2 id="account-heading" className="text-xl font-semibold mb-4">
            Account Deletion
          </h2>
          <div className="space-y-4">
            <Button
              variant="destructive"
              onClick={handleDeleteAccount}
              disabled={loading}
              aria-label="Delete your account"
              className="w-full sm:w-auto"
            >
              Delete Account
            </Button>
            <p className="text-sm text-gray-600">
              Permanently delete your account and all associated data. This action cannot be undone.
            </p>
          </div>
        </section>
      </Card>
    </div>
  );
}; 
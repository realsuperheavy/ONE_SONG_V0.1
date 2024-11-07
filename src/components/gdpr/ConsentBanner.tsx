import { useState } from 'react';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { GDPRDataManager } from '@/lib/gdpr/DataManager';
import { analyticsService } from '@/lib/firebase/services/analytics';

interface ConsentBannerProps {
  userId: string;
  onConsent: (consent: UserConsent) => void;
}

export const ConsentBanner: React.FC<ConsentBannerProps> = ({ userId, onConsent }) => {
  const [expanded, setExpanded] = useState(false);
  const [consent, setConsent] = useState<UserConsent>({
    necessary: true, // Always required
    analytics: false,
    marketing: false,
    updatedAt: new Date().toISOString()
  });

  const handleAcceptAll = async () => {
    const fullConsent: UserConsent = {
      ...consent,
      analytics: true,
      marketing: true,
      updatedAt: new Date().toISOString()
    };
    
    try {
      await updateConsent(fullConsent);
    } catch (error) {
      analyticsService.trackError(error as Error, {
        context: 'consent_banner',
        action: 'accept_all'
      });
    }
  };

  const handleCustomize = () => {
    setExpanded(true);
  };

  const handleSavePreferences = async () => {
    try {
      await updateConsent(consent);
    } catch (error) {
      analyticsService.trackError(error as Error, {
        context: 'consent_banner',
        action: 'save_preferences'
      });
    }
  };

  const updateConsent = async (newConsent: UserConsent) => {
    const gdpr = new GDPRDataManager();
    await gdpr.updateConsent(userId, newConsent);
    onConsent(newConsent);
  };

  return (
    <Card className="fixed bottom-0 left-0 right-0 p-4 bg-background-light shadow-lg">
      <div className="max-w-4xl mx-auto">
        <div className="flex flex-col space-y-4">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-lg font-semibold mb-2">Cookie Preferences</h2>
              <p className="text-sm text-gray-600">
                We use cookies to enhance your experience and analyze our website traffic. 
                Please choose your preferences below.
              </p>
            </div>
            {!expanded && (
              <div className="flex space-x-4">
                <Button 
                  variant="outline" 
                  onClick={handleCustomize}
                  aria-label="Customize cookie preferences"
                >
                  Customize
                </Button>
                <Button 
                  variant="primary" 
                  onClick={handleAcceptAll}
                  aria-label="Accept all cookies"
                >
                  Accept All
                </Button>
              </div>
            )}
          </div>

          {expanded && (
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={consent.necessary}
                      disabled
                      className="form-checkbox"
                      aria-label="Necessary cookies (required)"
                    />
                    <span>Necessary (Required)</span>
                  </label>
                  <span className="text-sm text-gray-500">
                    Essential for website functionality
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={consent.analytics}
                      onChange={(e) => setConsent(prev => ({
                        ...prev,
                        analytics: e.target.checked
                      }))}
                      className="form-checkbox"
                      aria-label="Analytics cookies"
                    />
                    <span>Analytics</span>
                  </label>
                  <span className="text-sm text-gray-500">
                    Help us improve our website
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={consent.marketing}
                      onChange={(e) => setConsent(prev => ({
                        ...prev,
                        marketing: e.target.checked
                      }))}
                      className="form-checkbox"
                      aria-label="Marketing cookies"
                    />
                    <span>Marketing</span>
                  </label>
                  <span className="text-sm text-gray-500">
                    Personalized recommendations
                  </span>
                </div>
              </div>

              <div className="flex justify-end space-x-4">
                <Button 
                  variant="outline" 
                  onClick={() => setExpanded(false)}
                  aria-label="Cancel cookie preferences"
                >
                  Cancel
                </Button>
                <Button 
                  variant="primary" 
                  onClick={handleSavePreferences}
                  aria-label="Save cookie preferences"
                >
                  Save Preferences
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}; 
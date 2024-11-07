import { useEffect, useState } from 'react';
import { GDPRDataManager } from '@/lib/gdpr/DataManager';
import { ConsentBanner } from './ConsentBanner';
import { useAuth } from '@/hooks/useAuth';
import { analyticsService } from '@/lib/firebase/services/analytics';

export const ConsentManager: React.FC = () => {
  const { user } = useAuth();
  const [showBanner, setShowBanner] = useState(false);
  const [consentLoaded, setConsentLoaded] = useState(false);

  useEffect(() => {
    if (!user?.id) return;

    const checkConsent = async () => {
      try {
        const gdpr = new GDPRDataManager();
        const existingConsent = await gdpr.getConsent(user.id);
        
        // Show banner if no consent or consent is older than 6 months
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
        
        const consentDate = new Date(existingConsent.updatedAt);
        setShowBanner(consentDate < sixMonthsAgo);
        setConsentLoaded(true);

      } catch (error) {
        analyticsService.trackError(error as Error, {
          context: 'consent_manager',
          userId: user.id
        });
        // Show banner on error to be safe
        setShowBanner(true);
        setConsentLoaded(true);
      }
    };

    checkConsent();
  }, [user?.id]);

  const handleConsent = (consent: UserConsent) => {
    setShowBanner(false);
    analyticsService.trackEvent('consent_updated', {
      userId: user?.id,
      analytics: consent.analytics,
      marketing: consent.marketing
    });
  };

  if (!consentLoaded || !user?.id || !showBanner) {
    return null;
  }

  return (
    <ConsentBanner 
      userId={user.id}
      onConsent={handleConsent}
    />
  );
}; 
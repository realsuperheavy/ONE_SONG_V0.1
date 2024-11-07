import { ref, get, set, remove } from 'firebase/database';
import { rtdb } from '@/lib/firebase/config';
import { analyticsService } from '@/lib/firebase/services/analytics';
import { Cache } from '@/lib/cache';

interface UserConsent {
  analytics: boolean;
  marketing: boolean;
  thirdParty: boolean;
  essential: boolean;
  version: string;
  timestamp: number;
}

interface PrivacySettings {
  dataRetention: number; // days
  autoDelete: boolean;
  marketingPrefs: {
    email: boolean;
    push: boolean;
    inApp: boolean;
  };
  thirdPartySharing: string[];
}

export class GDPRDataManager {
  private cache: Cache<any>;
  private readonly CONSENT_VERSION = '1.0.0';
  private readonly RETENTION_PERIOD = 30 * 24 * 60 * 60 * 1000; // 30 days

  constructor() {
    this.cache = new Cache({ maxSize: 1000, ttl: 24 * 60 * 60 * 1000 }); // 24 hours
  }

  async getUserConsent(userId: string): Promise<UserConsent | null> {
    try {
      // Check cache first
      const cached = this.cache.get(`consent_${userId}`);
      if (cached) return cached;

      // Get from database
      const snapshot = await get(ref(rtdb, `users/${userId}/consent`));
      const consent = snapshot.val();

      if (consent) {
        this.cache.set(`consent_${userId}`, consent);
      }

      return consent;
    } catch (error) {
      analyticsService.trackError(error as Error, {
        context: 'gdpr_get_consent',
        userId
      });
      throw error;
    }
  }

  async updateUserConsent(userId: string, consent: Partial<UserConsent>): Promise<void> {
    try {
      const updatedConsent: UserConsent = {
        ...consent,
        version: this.CONSENT_VERSION,
        timestamp: Date.now()
      } as UserConsent;

      // Update database
      await set(ref(rtdb, `users/${userId}/consent`), updatedConsent);
      
      // Update cache
      this.cache.set(`consent_${userId}`, updatedConsent);

      // Track consent update
      analyticsService.trackEvent('consent_updated', {
        userId,
        consentVersion: this.CONSENT_VERSION,
        consentTypes: Object.keys(consent).filter(k => consent[k as keyof UserConsent])
      });

    } catch (error) {
      analyticsService.trackError(error as Error, {
        context: 'gdpr_update_consent',
        userId
      });
      throw error;
    }
  }

  async exportUserData(userId: string): Promise<Record<string, any>> {
    try {
      const data: Record<string, any> = {};

      // Collect user data
      const userSnapshot = await get(ref(rtdb, `users/${userId}`));
      data.profile = userSnapshot.val();

      // Collect requests
      const requestsSnapshot = await get(ref(rtdb, `requests`));
      data.requests = Object.values(requestsSnapshot.val() || {})
        .filter((req: any) => req.userId === userId);

      // Collect event participation
      const eventsSnapshot = await get(ref(rtdb, `events`));
      data.events = Object.values(eventsSnapshot.val() || {})
        .filter((event: any) => 
          event.attendees?.includes(userId) || event.djId === userId
        );

      // Track export
      analyticsService.trackEvent('data_exported', {
        userId,
        dataTypes: Object.keys(data)
      });

      return data;

    } catch (error) {
      analyticsService.trackError(error as Error, {
        context: 'gdpr_export_data',
        userId
      });
      throw error;
    }
  }

  async deleteUserData(userId: string): Promise<void> {
    try {
      // Start deletion process
      const deletionTasks: Promise<void>[] = [];

      // Delete user profile
      deletionTasks.push(remove(ref(rtdb, `users/${userId}`)));

      // Delete user requests
      const requestsSnapshot = await get(ref(rtdb, `requests`));
      const userRequests = Object.entries(requestsSnapshot.val() || {})
        .filter(([_, req]: [string, any]) => req.userId === userId)
        .map(([id]) => remove(ref(rtdb, `requests/${id}`)));
      
      deletionTasks.push(...userRequests);

      // Delete event associations
      const eventsSnapshot = await get(ref(rtdb, `events`));
      const userEvents = Object.entries(eventsSnapshot.val() || {})
        .filter(([_, event]: [string, any]) => event.djId === userId)
        .map(([id]) => remove(ref(rtdb, `events/${id}`)));
      
      deletionTasks.push(...userEvents);

      // Execute all deletions
      await Promise.all(deletionTasks);

      // Clear cache
      this.cache.delete(`consent_${userId}`);

      // Track deletion
      analyticsService.trackEvent('data_deleted', {
        userId,
        deletedItems: deletionTasks.length
      });

    } catch (error) {
      analyticsService.trackError(error as Error, {
        context: 'gdpr_delete_data',
        userId
      });
      throw error;
    }
  }

  async updatePrivacySettings(userId: string, settings: Partial<PrivacySettings>): Promise<void> {
    try {
      const currentSettings = await get(ref(rtdb, `users/${userId}/privacy`));
      const updatedSettings = {
        ...currentSettings.val(),
        ...settings,
        updatedAt: Date.now()
      };

      await set(ref(rtdb, `users/${userId}/privacy`), updatedSettings);

      // Track settings update
      analyticsService.trackEvent('privacy_settings_updated', {
        userId,
        updatedFields: Object.keys(settings)
      });

    } catch (error) {
      analyticsService.trackError(error as Error, {
        context: 'gdpr_update_settings',
        userId
      });
      throw error;
    }
  }

  async scheduleDataDeletion(userId: string, retentionPeriod?: number): Promise<void> {
    const deletionTime = Date.now() + (retentionPeriod || this.RETENTION_PERIOD);

    try {
      await set(ref(rtdb, `deletionQueue/${userId}`), {
        scheduledFor: deletionTime,
        createdAt: Date.now()
      });

      analyticsService.trackEvent('deletion_scheduled', {
        userId,
        scheduledTime: deletionTime
      });

    } catch (error) {
      analyticsService.trackError(error as Error, {
        context: 'gdpr_schedule_deletion',
        userId
      });
      throw error;
    }
  }

  async getDataRetentionInfo(userId: string): Promise<{
    createdAt: number;
    retentionPeriod: number;
    scheduledDeletion?: number;
  }> {
    try {
      const [userSnapshot, deletionSnapshot] = await Promise.all([
        get(ref(rtdb, `users/${userId}/createdAt`)),
        get(ref(rtdb, `deletionQueue/${userId}`))
      ]);

      return {
        createdAt: userSnapshot.val(),
        retentionPeriod: this.RETENTION_PERIOD,
        scheduledDeletion: deletionSnapshot.val()?.scheduledFor
      };

    } catch (error) {
      analyticsService.trackError(error as Error, {
        context: 'gdpr_retention_info',
        userId
      });
      throw error;
    }
  }
} 
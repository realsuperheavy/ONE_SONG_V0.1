import { 
  Event, 
  EventAccessError, 
  GeoCoordinates, 
  NearbyEvent 
} from '@/types/core';
import { EventService } from '@/services/event';
import { AuthService } from '@/services/auth';
import { LocationService } from '@/services/location';
import { AnalyticsService } from '@/services/analytics';
import { RealTimeService } from '@/services/realtime';

interface EventAccessResult {
  event: Event;
  currentSong?: Song;
  queueLength: number;
  requiresAuth: boolean;
}

export class EventAccessFlow {
  constructor(
    private readonly eventService: EventService,
    private readonly authService: AuthService,
    private readonly locationService: LocationService,
    private readonly analyticsService: AnalyticsService,
    private readonly realTimeService: RealTimeService
  ) {}

  async accessViaQR(qrCode: string): Promise<EventAccessResult> {
    try {
      // Decode and validate QR code
      const eventId = await this.eventService.validateQRCode(qrCode);
      return this.joinEvent(eventId);
    } catch (error) {
      this.analyticsService.trackError('qr_code_scan_failed', error);
      throw new EventAccessError('Invalid QR code', error);
    }
  }

  async accessViaCode(code: string): Promise<EventAccessResult> {
    try {
      // Validate event code
      const eventId = await this.eventService.validateEventCode(code);
      return this.joinEvent(eventId);
    } catch (error) {
      this.analyticsService.trackError('event_code_invalid', error);
      throw new EventAccessError('Invalid event code', error);
    }
  }

  async discoverNearbyEvents(
    coordinates: GeoCoordinates
  ): Promise<NearbyEvent[]> {
    try {
      // Get nearby events with geohashing
      const events = await this.locationService.findNearbyEvents(coordinates, {
        radius: 5000, // 5km radius
        limit: 20 // Max 20 events
      });

      this.analyticsService.trackEvent('nearby_events_discovered', {
        location: coordinates,
        eventCount: events.length
      });

      return events;
    } catch (error) {
      this.analyticsService.trackError('nearby_events_failed', error);
      throw error;
    }
  }

  private async joinEvent(eventId: string): Promise<EventAccessResult> {
    // Get event details
    const event = await this.eventService.getEvent(eventId);
    
    // Initialize real-time connection
    await this.realTimeService.connect(eventId);

    // Track analytics
    this.analyticsService.trackEvent('event_joined', {
      eventId,
      method: 'code',
      timestamp: Date.now()
    });

    return {
      event,
      currentSong: event.currentSong,
      queueLength: event.queueLength,
      requiresAuth: event.settings.requiresAuth
    };
  }
} 
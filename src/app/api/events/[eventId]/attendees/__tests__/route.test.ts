import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { GET, POST, PATCH } from '../route';
import { AttendeeManagementService } from '@/lib/firebase/services/attendee';
import { WebhookService } from '@/lib/webhooks/service';

vi.mock('@/lib/firebase/services/attendee');
vi.mock('@/lib/webhooks/service');
vi.mock('@/middleware/rate-limit', () => ({
  rateLimit: vi.fn().mockResolvedValue(null)
}));

describe('Attendee API Routes', () => {
  const mockParams = { eventId: 'test-event' };
  
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /api/events/[eventId]/attendees', () => {
    it('returns attendees successfully', async () => {
      const mockAttendees = [
        { userId: 'user-1', status: 'active' },
        { userId: 'user-2', status: 'active' }
      ];

      vi.mocked(AttendeeManagementService.prototype.getEventAttendees)
        .mockResolvedValue(mockAttendees);

      const response = await GET(
        new NextRequest('http://localhost'),
        { params: mockParams }
      );

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data).toEqual(mockAttendees);
    });
  });

  describe('POST /api/events/[eventId]/attendees', () => {
    it('joins event successfully', async () => {
      const request = new NextRequest('http://localhost', {
        headers: {
          'X-User-ID': 'test-user'
        }
      });

      const response = await POST(request, { params: mockParams });
      
      expect(response.status).toBe(200);
      expect(AttendeeManagementService.prototype.joinEvent)
        .toHaveBeenCalledWith('test-event', 'test-user');
      expect(WebhookService.prototype.deliverWebhook)
        .toHaveBeenCalled();
    });

    it('handles unauthorized requests', async () => {
      const request = new NextRequest('http://localhost');
      const response = await POST(request, { params: mockParams });
      
      expect(response.status).toBe(401);
    });
  });

  describe('PATCH /api/events/[eventId]/attendees', () => {
    it('updates attendee status successfully', async () => {
      const request = new NextRequest('http://localhost', {
        method: 'PATCH',
        body: JSON.stringify({
          userId: 'test-user',
          status: 'inactive'
        })
      });

      const response = await PATCH(request, { params: mockParams });
      
      expect(response.status).toBe(200);
      expect(AttendeeManagementService.prototype.updateAttendeeStatus)
        .toHaveBeenCalledWith('test-event', 'test-user', 'inactive');
    });
  });
}); 
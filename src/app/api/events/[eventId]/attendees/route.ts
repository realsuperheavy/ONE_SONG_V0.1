import { NextRequest, NextResponse } from 'next/server';
import { AttendeeManagementService } from '@/lib/firebase/services/attendee';
import { rateLimit } from '@/middleware/rate-limit';
import { errorHandler } from '@/middleware/error-handler';
import { createValidationMiddleware } from '@/middleware/validation';
import { ValidationService } from '@/lib/validation/ValidationService';
import { WebhookService } from '@/lib/webhooks/service';
import { z } from 'zod';

const attendeeService = new AttendeeManagementService();
const webhookService = new WebhookService();

const joinEventSchema = z.object({
  userId: z.string().min(1),
  metadata: z.object({
    deviceId: z.string().optional(),
    platform: z.string().optional()
  }).optional()
});

const validateJoinEvent = createValidationMiddleware(joinEventSchema);

export async function GET(
  request: NextRequest,
  { params }: { params: { eventId: string } }
) {
  try {
    const attendees = await attendeeService.getEventAttendees(params.eventId, {
      status: 'active',
      orderBy: 'lastActiveAt'
    });

    return NextResponse.json(attendees);
  } catch (error) {
    console.error('Failed to fetch attendees:', error);
    return NextResponse.json(
      { error: 'Failed to fetch attendees' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { eventId: string } }
) {
  try {
    // Rate limit check
    const rateLimitResponse = await rateLimit(request, 'attendee');
    if (rateLimitResponse) return rateLimitResponse;

    // Validation
    const validationResponse = await validateJoinEvent(request);
    if (validationResponse) return validationResponse;

    const userId = request.headers.get('X-User-ID');
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await attendeeService.joinEvent(params.eventId, userId);

    // Trigger webhook
    await webhookService.deliverWebhook('attendee-joined', {
      eventType: 'user.joined',
      timestamp: Date.now(),
      data: {
        eventId: params.eventId,
        userId,
        metadata: (request as any).validatedData?.metadata
      },
      signature: ''
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return errorHandler(request, error);
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { eventId: string } }
) {
  try {
    const { userId, status } = await request.json();
    
    if (!userId || !status) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    await attendeeService.updateAttendeeStatus(
      params.eventId,
      userId,
      status
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to update attendee status:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
} 
import { NextRequest, NextResponse } from 'next/server';
import { rateLimit } from '@/middleware/rate-limit';
import { EventRequestService } from '@/lib/firebase/services/event-request';

export async function POST(
  request: NextRequest,
  { params }: { params: { eventId: string } }
) {
  // Check rate limit
  const rateLimitResponse = await rateLimit(request, 'request');
  if (rateLimitResponse) return rateLimitResponse;

  try {
    const requestData = await request.json();
    const userId = request.headers.get('X-User-ID')!;
    const eventRequestService = new EventRequestService();

    await eventRequestService.createRequest(params.eventId, userId, requestData);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: error.message },
      { status: error.code === 'RATE_LIMIT_EXCEEDED' ? 429 : 500 }
    );
  }
} 
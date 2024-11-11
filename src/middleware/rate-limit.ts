import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { RateLimitService } from '@/lib/firebase/services/rate-limit';

export async function rateLimit(
  request: NextRequest,
  resourceType: 'request' | 'search' | 'attendee'
) {
  const userId = request.headers.get('X-User-ID');
  if (!userId) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  const rateLimiter = new RateLimitService();
  const canProceed = await rateLimiter.checkRateLimit(userId, resourceType);

  if (!canProceed) {
    return NextResponse.json(
      { error: 'Rate limit exceeded' },
      { status: 429 }
    );
  }

  return null; // Continue with request
} 
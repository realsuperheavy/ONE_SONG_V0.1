import { db } from '@/lib/firebase/config';
import { doc, getDoc, setDoc, Timestamp } from 'firebase/firestore';

interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
}

const DEFAULT_CONFIG: RateLimitConfig = {
  maxRequests: 5,
  windowMs: 60000 // 1 minute
};

export class RateLimitService {
  private readonly userId: string;
  private readonly eventId: string;

  constructor(userId: string, eventId: string) {
    this.userId = userId;
    this.eventId = eventId;
  }

  async checkRateLimit(): Promise<boolean> {
    const rateRef = doc(db, `events/${this.eventId}/rateLimits/${this.userId}`);
    const rateDoc = await getDoc(rateRef);

    const now = Timestamp.now();
    const windowStart = new Timestamp(
      now.seconds - (DEFAULT_CONFIG.windowMs / 1000),
      now.nanoseconds
    );

    if (!rateDoc.exists()) {
      await setDoc(rateRef, {
        requests: [now],
        lastRequest: now
      });
      return true;
    }

    const data = rateDoc.data();
    const requests = data.requests.filter((timestamp: Timestamp) => 
      timestamp.toMillis() > windowStart.toMillis()
    );

    if (requests.length >= DEFAULT_CONFIG.maxRequests) {
      return false;
    }

    requests.push(now);
    await setDoc(rateRef, {
      requests,
      lastRequest: now
    });

    return true;
  }
} 
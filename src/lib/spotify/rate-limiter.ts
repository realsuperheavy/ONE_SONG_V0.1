import { RateLimiter } from '@/lib/utils/rate-limiter';

export const spotifyRateLimiter = new RateLimiter({
  maxRequests: 100, // Spotify's rate limit per user
  timeWindow: 30000, // 30 seconds
  errorMessage: 'Rate limit exceeded for Spotify API'
}); 
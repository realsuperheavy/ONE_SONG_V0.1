import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { 
  formatPhoneNumber, 
  initializePhoneAuth, 
  sendVerificationCode,
  confirmVerificationCode,
  cleanup 
} from '../phone-auth';
import { auth } from '../config';
import { analyticsService } from '../services/analytics';
import { AppError } from '@/lib/error/AppError';

vi.mock('../config', () => ({
  auth: {
    currentUser: null
  }
}));

vi.mock('../services/analytics');

describe('Phone Authentication', () => {
  beforeEach(() => {
    cleanup();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('formatPhoneNumber', () => {
    it('formats US numbers correctly', () => {
      expect(formatPhoneNumber('1234567890')).toBe('+11234567890');
      expect(formatPhoneNumber('(123) 456-7890')).toBe('+11234567890');
    });

    it('preserves international numbers', () => {
      expect(formatPhoneNumber('+447123456789')).toBe('+447123456789');
    });
  });

  describe('initializePhoneAuth', () => {
    it('initializes recaptcha verifier', async () => {
      const containerId = 'recaptcha-container';
      const verifier = await initializePhoneAuth(containerId);
      
      expect(verifier).toBeDefined();
      expect(analyticsService.trackEvent).toHaveBeenCalledWith(
        'recaptcha_verified',
        expect.any(Object)
      );
    });

    it('handles initialization errors', async () => {
      const containerId = 'invalid-container';
      
      await expect(initializePhoneAuth(containerId))
        .rejects
        .toThrow(AppError);
      
      expect(analyticsService.trackError).toHaveBeenCalled();
    });
  });

  describe('confirmVerificationCode', () => {
    it('handles linking with Spotify account', async () => {
      vi.mocked(auth.currentUser).mockReturnValue({
        linkWithCredential: vi.fn().mockResolvedValue(true)
      } as any);

      await confirmVerificationCode('123456', true);
      
      expect(analyticsService.trackEvent).toHaveBeenCalledWith(
        expect.stringContaining('verification'),
        expect.any(Object)
      );
    });

    it('throws error when no verification ID exists', async () => {
      await expect(confirmVerificationCode('123456'))
        .rejects
        .toThrow('No verification ID found');
    });
  });
}); 
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { UserService } from '../user';
import { adminDb, adminAuth } from '../../admin';

vi.mock('../../admin', () => ({
  adminDb: {
    collection: vi.fn(),
    runTransaction: vi.fn()
  },
  adminAuth: {
    getUser: vi.fn()
  }
}));

describe('UserService', () => {
  let userService: UserService;

  beforeEach(() => {
    userService = new UserService();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('updateUserPreferences', () => {
    it('successfully updates user preferences', async () => {
      const mockTransaction = {
        get: vi.fn().mockResolvedValue({
          exists: true,
          data: () => ({
            preferences: { theme: 'light' }
          })
        }),
        update: vi.fn()
      };

      vi.mocked(adminDb.runTransaction).mockImplementation(async (fn) => {
        await fn(mockTransaction);
      });

      await userService.updateUserPreferences('test-user', {
        theme: 'dark'
      });

      expect(mockTransaction.update).toHaveBeenCalledWith(
        expect.any(Object),
        expect.objectContaining({
          preferences: expect.objectContaining({
            theme: 'dark'
          })
        })
      );
    });

    it('handles non-existent user', async () => {
      const mockTransaction = {
        get: vi.fn().mockResolvedValue({ exists: false }),
        update: vi.fn()
      };

      vi.mocked(adminDb.runTransaction).mockImplementation(async (fn) => {
        await fn(mockTransaction);
      });

      await expect(
        userService.updateUserPreferences('non-existent-user', { theme: 'dark' })
      ).rejects.toThrow('User not found');
    });

    it('handles transaction failures', async () => {
      vi.mocked(adminDb.runTransaction).mockRejectedValue(
        new Error('Transaction failed')
      );

      await expect(
        userService.updateUserPreferences('test-user', { theme: 'dark' })
      ).rejects.toThrow('Transaction failed');
    });
  });

  describe('getUserProfile', () => {
    it('successfully retrieves user profile', async () => {
      const mockUserDoc = {
        exists: true,
        data: () => ({
          id: 'test-user',
          preferences: { theme: 'light' },
          role: 'user',
          createdAt: new Date(),
          updatedAt: new Date()
        })
      };

      const mockAuthUser = {
        email: 'test@example.com',
        emailVerified: true,
        displayName: 'Test User',
        photoURL: 'https://example.com/photo.jpg'
      };

      vi.mocked(adminDb.collection).mockReturnValue({
        doc: vi.fn().mockReturnValue({
          get: vi.fn().mockResolvedValue(mockUserDoc)
        })
      } as any);

      vi.mocked(adminAuth.getUser).mockResolvedValue(mockAuthUser as any);

      const profile = await userService.getUserProfile('test-user');

      expect(profile).toEqual({
        ...mockUserDoc.data(),
        email: mockAuthUser.email,
        emailVerified: mockAuthUser.emailVerified,
        displayName: mockAuthUser.displayName,
        photoURL: mockAuthUser.photoURL
      });
    });

    it('handles non-existent user profile', async () => {
      vi.mocked(adminDb.collection).mockReturnValue({
        doc: vi.fn().mockReturnValue({
          get: vi.fn().mockResolvedValue({ exists: false })
        })
      } as any);

      await expect(
        userService.getUserProfile('non-existent-user')
      ).rejects.toThrow('User profile not found');
    });
  });
}); 
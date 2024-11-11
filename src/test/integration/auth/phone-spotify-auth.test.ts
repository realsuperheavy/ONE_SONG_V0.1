import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { 
  initializePhoneAuth, 
  sendVerificationCode,
  confirmVerificationCode 
} from '@/lib/firebase/phone-auth';
import { SpotifyAuthService } from '@/lib/spotify/auth';
import { firebaseAdmin } from '@/lib/firebase/admin';
import { generateTestUser } from '@/test/e2e/utils/test-data';

describe('Phone-Spotify Authentication Integration', () => {
  let testUser;
  let spotifyAuth;

  beforeEach(async () => {
    testUser = await generateTestUser('attendee');
    spotifyAuth = new SpotifyAuthService();
  });

  afterEach(async () => {
    await firebaseAdmin.auth().deleteUser(testUser.id);
  });

  it('completes full phone-spotify auth flow', async () => {
    // Initialize phone auth
    const verifier = await initializePhoneAuth('test-container');
    expect(verifier).toBeDefined();

    // Send verification code
    const testPhone = '+11234567890';
    await sendVerificationCode(testPhone);

    // Mock Spotify auth
    const spotifyToken = await spotifyAuth.getTestToken();
    expect(spotifyToken).toBeDefined();

    // Link accounts
    const result = await confirmVerificationCode('123456', true);
    expect(result.user).toBeDefined();
    expect(result.user.providerData).toContainEqual(
      expect.objectContaining({
        providerId: 'spotify.com'
      })
    );
  });
}); 
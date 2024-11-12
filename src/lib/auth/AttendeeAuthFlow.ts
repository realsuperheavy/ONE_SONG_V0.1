import { auth } from '@/lib/firebase/config';
import { spotifyAuthService } from '@/lib/spotify/services/auth';
import { analyticsService } from '@/lib/firebase/services/analytics';

export class AttendeeAuthFlow {
  async startAuth() {
    try {
      // Store that we're authenticating an attendee
      localStorage.setItem('auth_type', 'attendee');
      
      // First authenticate with Firebase
      const provider = new auth.GoogleAuthProvider();
      const result = await auth.signInWithPopup(provider);
      
      if (!result.user) {
        throw new Error('Firebase authentication failed');
      }

      // After Firebase auth, start Spotify auth
      const spotifyAuthUrl = spotifyAuthService.generateAuthUrl('attendee');
      window.location.href = spotifyAuthUrl;

      analyticsService.trackEvent('attendee_auth_started', {
        userId: result.user.uid
      });
    } catch (error) {
      analyticsService.trackError(error as Error, {
        context: 'attendee_auth_flow'
      });
      throw error;
    }
  }
} 
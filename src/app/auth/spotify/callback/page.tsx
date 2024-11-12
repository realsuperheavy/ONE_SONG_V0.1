'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { auth } from '@/lib/firebase/config';
import { spotifyAuthService } from '@/lib/spotify/services/auth';

export default function SpotifyCallback() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const handleCallback = async () => {
      // Verify Firebase auth state first
      const currentUser = auth.currentUser;
      if (!currentUser) {
        console.error('No authenticated user found');
        router.push('/auth/login');
        return;
      }

      const code = searchParams.get('code');
      const error = searchParams.get('error');

      if (error) {
        console.error('Spotify auth error:', error);
        router.push('/auth/error?source=spotify');
        return;
      }

      try {
        // Link Spotify account with Firebase user
        await spotifyAuthService.linkAccount(currentUser.uid, code!);
        
        // Check auth type and redirect accordingly
        const authType = localStorage.getItem('auth_type');
        if (authType === 'attendee') {
          router.push('/attendee/events');
        } else {
          router.push('/dashboard');
        }
        
        // Clean up
        localStorage.removeItem('auth_type');
      } catch (error) {
        console.error('Failed to handle Spotify callback:', error);
        router.push('/auth/error?source=spotify');
      }
    };

    handleCallback();
  }, [router, searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4">Connecting to Spotify...</h1>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto" />
      </div>
    </div>
  );
} 
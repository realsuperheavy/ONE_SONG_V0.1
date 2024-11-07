'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { spotifyAuthService } from '@/lib/spotify/services/auth';

export default function SpotifyCallback() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const handleCallback = async () => {
      const code = searchParams.get('code');
      const error = searchParams.get('error');

      if (error) {
        console.error('Spotify auth error:', error);
        router.push('/auth/error?source=spotify');
        return;
      }

      if (!code) {
        console.error('No code received from Spotify');
        router.push('/auth/error?source=spotify');
        return;
      }

      try {
        const { accessToken, refreshToken, expiresIn } = await spotifyAuthService.handleCallback(code);

        // Store tokens
        localStorage.setItem('spotify_access_token', accessToken);
        localStorage.setItem('spotify_refresh_token', refreshToken);
        localStorage.setItem('spotify_expires_at', (Date.now() + expiresIn * 1000).toString());

        // Redirect back to the app
        router.push('/dashboard');
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
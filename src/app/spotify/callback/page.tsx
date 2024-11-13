'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSpotifyAuth } from '@/hooks/useSpotifyAuth';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

export default function SpotifyCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { handleCallback } = useSpotifyAuth();

  useEffect(() => {
    const processCallback = async () => {
      try {
        const code = searchParams.get('code');
        const state = searchParams.get('state');

        if (!code || !state) {
          throw new Error('Missing code or state');
        }

        await handleCallback(code, state);
        router.push('/'); // Or wherever you want to redirect after auth
      } catch (error) {
        console.error('Spotify auth error:', error);
        router.push('/error?source=spotify');
      }
    };

    processCallback();
  }, [handleCallback, router, searchParams]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <LoadingSpinner size={40} />
      <p className="mt-4 text-gray-600">Connecting to Spotify...</p>
    </div>
  );
} 
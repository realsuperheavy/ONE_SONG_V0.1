'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { analyticsService } from '@/lib/firebase/services/analytics';

export default function EventPageError({
  error,
  reset
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    analyticsService.trackError(error, {
      context: 'event_page',
      digest: error.digest
    });
  }, [error]);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-xl mx-auto text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          Something went wrong
        </h2>
        <p className="text-gray-600 mb-6">
          {error.message || 'Failed to load event'}
        </p>
        <Button onClick={reset}>Try again</Button>
      </div>
    </div>
  );
} 
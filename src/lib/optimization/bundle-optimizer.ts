import dynamic from 'next/dynamic';
import { FC } from 'react';

interface DynamicComponents {
  QRScanner: FC;
  AnalyticsView: FC;
  PaymentFlow: FC;
  SpotifyPlayer: FC;
}

// Dynamic imports for route-based code splitting
export const dynamicImports: DynamicComponents = {
  // Guest Features
  QRScanner: dynamic(() => import('@/components/qr/QRScanner'), {
    ssr: false,
    loading: () => <div>Loading Scanner...</div>
  }),

  // DJ Features
  AnalyticsView: dynamic(() => import('@/components/analytics/AnalyticsView'), {
    loading: () => <div>Loading Analytics...</div>
  }),

  // Payment Features
  PaymentFlow: dynamic(() => import('@/components/payment/PaymentFlow'), {
    ssr: false,
    loading: () => <div>Loading Payment...</div>
  }),

  // Heavy Components
  SpotifyPlayer: dynamic(() => import('@/components/spotify/Player'), {
    ssr: false,
    loading: () => <div>Loading Player...</div>
  })
};

// Preload critical components
export const preloadCriticalComponents = (): void => {
  const preloadComponent = (path: string): void => {
    const link = document.createElement('link');
    link.rel = 'modulepreload';
    link.href = path;
    document.head.appendChild(link);
  };

  // Preload critical paths
  preloadComponent('/components/queue/QueueView');
  preloadComponent('/components/song-request/RequestForm');
};
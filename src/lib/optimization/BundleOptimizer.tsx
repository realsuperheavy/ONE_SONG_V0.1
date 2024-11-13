'use client';

import dynamic from 'next/dynamic';
import { useEffect } from 'react';
import { analyticsService } from '@/lib/firebase/services/analytics';

// Dynamic imports configuration
const dynamicComponents = {
  QRScanner: dynamic(() => import('@/components/qr/QRScanner'), {
    ssr: false,
    loading: () => <div>Loading Scanner...</div>
  }),
  
  AudioPlayer: dynamic(() => import('@/components/audio/Player'), {
    ssr: false,
    loading: () => <div>Loading Player...</div>
  }),

  Analytics: dynamic(() => import('@/components/analytics/AnalyticsView'), {
    loading: () => <div>Loading Analytics...</div>
  })
};

// Preload configuration
const preloadConfig = {
  critical: [
    '/components/queue/QueueView',
    '/components/song-request/RequestForm'
  ],
  secondary: [
    '/components/analytics/AnalyticsView',
    '/components/settings/SettingsPanel'
  ]
};

export function BundleOptimizer() {
  useEffect(() => {
    // Preload critical components
    const preloadComponent = (path: string) => {
      const link = document.createElement('link');
      link.rel = 'modulepreload';
      link.href = path;
      document.head.appendChild(link);
    };

    // Preload critical paths immediately
    preloadConfig.critical.forEach(preloadComponent);

    // Preload secondary paths after initial load
    const secondaryPreload = () => {
      preloadConfig.secondary.forEach(preloadComponent);
    };

    if (document.readyState === 'complete') {
      secondaryPreload();
    } else {
      window.addEventListener('load', secondaryPreload);
      return () => window.removeEventListener('load', secondaryPreload);
    }
  }, []);

  // Monitor bundle size in development
  if (process.env.NODE_ENV === 'development') {
    useEffect(() => {
      const reportBundleSize = async () => {
        const resources = performance.getEntriesByType('resource');
        const jsResources = resources.filter(r => r.name.endsWith('.js'));
        
        const totalSize = jsResources.reduce((acc, r) => acc + r.encodedBodySize, 0);
        
        analyticsService.trackEvent('bundle_size', {
          totalSize: totalSize / 1024, // Convert to KB
          numberOfChunks: jsResources.length
        });
      };

      reportBundleSize();
    }, []);
  }

  return null;
}

export { dynamicComponents }; 
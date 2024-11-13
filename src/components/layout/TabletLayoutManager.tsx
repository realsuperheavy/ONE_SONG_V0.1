'use client';

import { useEffect, useState } from 'react';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { analyticsService } from '@/lib/firebase/services/analytics';

interface TabletLayoutConfig {
  sidebarWidth: number;
  modalWidth: number;
  columnCount: number;
}

export function TabletLayoutManager({ children }: { children: React.ReactNode }) {
  const isTablet = useMediaQuery('(min-width: 768px) and (max-width: 1024px)');
  const [config, setConfig] = useState<TabletLayoutConfig>({
    sidebarWidth: 280,
    modalWidth: 600,
    columnCount: 2
  });

  useEffect(() => {
    if (isTablet) {
      // Apply tablet-specific layout adjustments
      document.documentElement.style.setProperty('--sidebar-width', `${config.sidebarWidth}px`);
      document.documentElement.style.setProperty('--modal-width', `${config.modalWidth}px`);
      document.documentElement.style.setProperty('--column-count', `${config.columnCount}`);
      
      // Add tablet-specific classes
      document.body.classList.add('tablet-layout');
      
      analyticsService.trackEvent('layout_adapted', {
        device: 'tablet',
        config
      });
    }

    return () => {
      document.body.classList.remove('tablet-layout');
    };
  }, [isTablet, config]);

  // Tablet-specific styles
  const tabletStyles = `
    .tablet-layout .sidebar {
      width: var(--sidebar-width);
      transform: translateX(calc(-1 * var(--sidebar-width)));
      transition: transform 0.3s ease-in-out;
    }

    .tablet-layout .sidebar.open {
      transform: translateX(0);
    }

    .tablet-layout .modal {
      width: var(--modal-width);
      max-width: 90vw;
      margin: 0 auto;
    }

    .tablet-layout .grid-layout {
      grid-template-columns: repeat(var(--column-count), 1fr);
    }
  `;

  return (
    <>
      <style>{tabletStyles}</style>
      {children}
    </>
  );
} 
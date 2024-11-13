'use client';

import { createContext, useContext, PropsWithChildren } from 'react';
import { QueueManager } from '@/lib/queue/QueueManager';
import { PerformanceMonitor } from '@/lib/monitoring/PerformanceMonitor';

interface ServiceContextType {
  queueManager: QueueManager | null;
  performanceMonitor: PerformanceMonitor | null;
}

const ServiceContext = createContext<ServiceContextType>({
  queueManager: null,
  performanceMonitor: null
});

export function ServiceProvider({ children }: PropsWithChildren) {
  const performanceMonitor = PerformanceMonitor.getInstance();

  return (
    <ServiceContext.Provider 
      value={{
        queueManager: null, // Will be initialized per event
        performanceMonitor
      }}
    >
      {children}
    </ServiceContext.Provider>
  );
}

export const useService = () => useContext(ServiceContext); 
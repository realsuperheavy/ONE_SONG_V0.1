import { useEffect, useCallback, useRef } from 'react';

export function usePerformanceOptimization() {
  const frameRef = useRef<number>();
  
  const debounce = useCallback((fn: Function, delay: number) => {
    let timeoutId: NodeJS.Timeout;
    return (...args: any[]) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => fn(...args), delay);
    };
  }, []);

  const throttle = useCallback((fn: Function, limit: number) => {
    let inThrottle: boolean;
    return (...args: any[]) => {
      if (!inThrottle) {
        fn(...args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  }, []);

  const requestAnimationFrameCallback = useCallback((callback: FrameRequestCallback) => {
    frameRef.current = requestAnimationFrame(callback);
  }, []);

  useEffect(() => {
    return () => {
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current);
      }
    };
  }, []);

  return { debounce, throttle, requestAnimationFrameCallback };
} 
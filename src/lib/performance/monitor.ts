'use client';

export class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private metrics: Map<string, number[]> = new Map();

  private constructor() {
    // Initialize core metrics
    this.metrics.set('fps', []);
    this.metrics.set('memoryUsage', []);
    this.metrics.set('responseTime', []);
    this.metrics.set('batteryLevel', []);
  }

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  startMeasure(name: string): void {
    performance.mark(`${name}-start`);
  }

  endMeasure(name: string): void {
    performance.mark(`${name}-end`);
    performance.measure(name, `${name}-start`, `${name}-end`);
    
    const entries = performance.getEntriesByName(name);
    const duration = entries[entries.length - 1].duration;
    
    if (!this.metrics.has(name)) {
      this.metrics.set(name, []);
    }
    this.metrics.get(name)?.push(duration);

    // Cleanup
    performance.clearMarks(`${name}-start`);
    performance.clearMarks(`${name}-end`);
    performance.clearMeasures(name);
  }

  trackFPS(): void {
    let frameCount = 0;
    let lastTime = performance.now();

    const countFrames = () => {
      frameCount++;
      const currentTime = performance.now();
      
      if (currentTime - lastTime >= 1000) {
        const fps = Math.round(frameCount * 1000 / (currentTime - lastTime));
        this.metrics.get('fps')?.push(fps);
        
        frameCount = 0;
        lastTime = currentTime;
      }
      
      requestAnimationFrame(countFrames);
    };

    requestAnimationFrame(countFrames);
  }

  async trackBattery(): Promise<void> {
    if ('getBattery' in navigator) {
      const battery = await (navigator as any).getBattery();
      
      const updateBattery = () => {
        this.metrics.get('batteryLevel')?.push(battery.level * 100);
      };

      battery.addEventListener('levelchange', updateBattery);
      updateBattery();
    }
  }

  getMetrics(): Record<string, number> {
    const result: Record<string, number> = {};
    
    this.metrics.forEach((values, key) => {
      if (values.length > 0) {
        result[key] = values.reduce((a, b) => a + b) / values.length;
      }
    });

    return result;
  }

  clearMetrics(): void {
    this.metrics.clear();
  }
} 
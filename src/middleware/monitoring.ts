import { NextApiRequest, NextApiResponse } from 'next';
import { productionMonitor } from '@/lib/monitoring/ProductionMonitor';

export function withMonitoring(
  handler: (req: NextApiRequest, res: NextApiResponse) => Promise<void>
) {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    const startTime = Date.now();

    try {
      await handler(req, res);
    } catch (error) {
      productionMonitor.trackError({
        error: error as Error,
        context: {
          path: req.url,
          method: req.method,
          query: req.query
        },
        severity: 'high'
      });
      throw error;
    } finally {
      const duration = Date.now() - startTime;
      productionMonitor.trackPerformance({
        ttfb: duration
      });
    }
  };
} 
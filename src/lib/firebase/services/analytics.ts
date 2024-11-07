import { ref, get, query, orderByChild, startAt, endAt } from '@firebase/database';
import { rtdb } from '../config';
import { SongRequest } from '@/types/models';

interface RequestAnalytics {
  totalRequests: number;
  totalTips: number;
  averageVotes: number;
  popularGenres: { [genre: string]: number };
  requestsByHour: { [hour: string]: number };
  approvalRate: number;
  averageResponseTime: number;
}

interface TimeRange {
  start: Date;
  end: Date;
}

export const analyticsService = {
  getRequestAnalytics: async (eventId: string, timeRange?: TimeRange): Promise<RequestAnalytics> => {
    const requestsRef = query(
      ref(rtdb, `requests/${eventId}`),
      orderByChild('metadata/requestTime'),
      ...(timeRange ? [
        startAt(timeRange.start.toISOString()),
        endAt(timeRange.end.toISOString())
      ] : [])
    );

    const snapshot = await get(requestsRef);
    const requests: SongRequest[] = [];
    snapshot.forEach((child) => {
      requests.push({
        id: child.key!,
        ...child.val()
      });
    });

    const totalRequests = requests.length;
    const totalTips = requests.reduce((sum, req) => sum + (req.metadata.tipAmount || 0), 0);
    const totalVotes = requests.reduce((sum, req) => sum + (req.metadata.votes || 0), 0);
    
    const approvedRequests = requests.filter(req => req.status === 'approved');
    const approvalRate = totalRequests > 0 ? approvedRequests.length / totalRequests : 0;

    // Calculate average response time (time between request and approval/rejection)
    const responseTimes = requests
      .filter(req => req.status !== 'pending')
      .map(req => {
        const requestTime = new Date(req.metadata.requestTime).getTime();
        const responseTime = new Date(req.metadata.statusUpdateTime || req.metadata.requestTime).getTime();
        return responseTime - requestTime;
      });

    const averageResponseTime = responseTimes.length > 0 
      ? responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length
      : 0;

    // Group requests by hour
    const requestsByHour = requests.reduce((acc, req) => {
      const hour = new Date(req.metadata.requestTime).getHours();
      acc[hour] = (acc[hour] || 0) + 1;
      return acc;
    }, {} as { [hour: string]: number });

    // Calculate popular genres (if available in song metadata)
    const popularGenres = requests.reduce((acc, req) => {
      const genre = req.song.genre || 'Unknown';
      acc[genre] = (acc[genre] || 0) + 1;
      return acc;
    }, {} as { [genre: string]: number });

    return {
      totalRequests,
      totalTips,
      averageVotes: totalRequests > 0 ? totalVotes / totalRequests : 0,
      popularGenres,
      requestsByHour,
      approvalRate,
      averageResponseTime
    };
  }
}; 
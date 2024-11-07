import { create } from 'zustand';
import { analyticsService } from '@/lib/firebase/services/analytics';

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

interface AnalyticsState {
  analytics: RequestAnalytics | null;
  loading: boolean;
  error: string | null;
  timeRange: TimeRange | null;
  setTimeRange: (range: TimeRange | null) => void;
  fetchAnalytics: (eventId: string) => Promise<void>;
}

export const useAnalyticsStore = create<AnalyticsState>((set, get) => ({
  analytics: null,
  loading: false,
  error: null,
  timeRange: null,

  setTimeRange: (range) => set({ timeRange: range }),

  fetchAnalytics: async (eventId) => {
    set({ loading: true, error: null });
    try {
      const analytics = await analyticsService.getRequestAnalytics(
        eventId,
        get().timeRange || undefined
      );
      set({ analytics });
    } catch (error: any) {
      set({ error: error.message });
    } finally {
      set({ loading: false });
    }
  }
})); 
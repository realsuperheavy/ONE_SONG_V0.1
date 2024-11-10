import { create } from 'zustand';
import { analyticsService } from '@/lib/firebase/services/analytics';
import { DateRange } from 'react-day-picker';

interface RequestAnalytics {
  totalRequests: number;
  totalTips: number;
  averageVotes: number;
  popularGenres: { [genre: string]: number };
  requestsByHour: { [hour: string]: number };
  approvalRate: number;
  averageResponseTime: number;
}

export interface AnalyticsState {
  analytics: RequestAnalytics | null;
  loading: boolean;
  error: string | null;
  timeRange: DateRange | undefined;
  setTimeRange: (range: DateRange | undefined) => void;
  fetchAnalytics: (eventId: string) => Promise<void>;
}

export const useAnalyticsStore = create<AnalyticsState>((set, get) => ({
  analytics: null,
  loading: false,
  error: null,
  timeRange: undefined,

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
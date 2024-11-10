import { create } from 'zustand';
import { SongRequest } from '@/types/models';
import { requestService } from '@/lib/firebase/services/request';

interface RequestState {
  requests: SongRequest[];
  loading: boolean;
  error: string | null;
  setRequests: (requests: SongRequest[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  createRequest: (request: Omit<SongRequest, 'id' | 'status'>) => Promise<void>;
  updateRequest: (requestId: string, eventId: string, updates: Partial<SongRequest>) => Promise<void>;
  deleteRequest: (requestId: string, eventId: string) => Promise<void>;
  voteRequest: (requestId: string, eventId: string, userId: string) => Promise<void>;
}

export const useRequestStore = create<RequestState>((set, get) => ({
  requests: [],
  loading: false,
  error: null,
  
  setRequests: (requests) => set({ requests }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),

  createRequest: async (request) => {
    set({ loading: true, error: null });
    try {
      await requestService.createRequest(request);
    } catch (error: any) {
      set({ error: error.message });
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  updateRequest: async (requestId, eventId, updates) => {
    set({ loading: true, error: null });
    try {
      await requestService.updateRequest(requestId, eventId, updates);
    } catch (error: any) {
      set({ error: error.message });
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  deleteRequest: async (requestId, eventId) => {
    set({ loading: true, error: null });
    try {
      await requestService.deleteRequest(requestId, eventId);
    } catch (error: any) {
      set({ error: error.message });
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  voteRequest: async (requestId, eventId, userId) => {
    set({ loading: true, error: null });
    try {
      await requestService.voteRequest(requestId, eventId, userId);
    } catch (error: any) {
      set({ error: error.message });
      throw error;
    } finally {
      set({ loading: false });
    }
  }
})); 
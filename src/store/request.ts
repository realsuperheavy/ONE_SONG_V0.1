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
  createRequest: (request: Partial<SongRequest>) => Promise<void>;
  updateRequest: (requestId: string, updates: Partial<SongRequest>) => Promise<void>;
  deleteRequest: (requestId: string) => Promise<void>;
  voteRequest: (requestId: string, userId: string) => Promise<void>;
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

  updateRequest: async (requestId, updates) => {
    set({ loading: true, error: null });
    try {
      await requestService.updateRequest(requestId, updates);
    } catch (error: any) {
      set({ error: error.message });
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  deleteRequest: async (requestId) => {
    set({ loading: true, error: null });
    try {
      await requestService.deleteRequest(requestId);
    } catch (error: any) {
      set({ error: error.message });
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  voteRequest: async (requestId, userId) => {
    set({ loading: true, error: null });
    try {
      await requestService.voteRequest(requestId, userId);
    } catch (error: any) {
      set({ error: error.message });
      throw error;
    } finally {
      set({ loading: false });
    }
  }
})); 
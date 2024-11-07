import { AdvancedPlaybackController } from '../AdvancedPlaybackController';
import { trackAnalysisService } from '@/lib/spotify/services/analysis';
import { analyticsService } from '@/lib/firebase/services/analytics';
import { QueueItem } from '@/lib/firebase/services/queue';

// Mock dependencies
vi.mock('@/lib/spotify/services/analysis');
vi.mock('@/lib/firebase/services/analytics');

describe('AdvancedPlaybackController', () => {
  let controller: AdvancedPlaybackController;
  let mockAudio: HTMLAudioElement;

  const mockTrack = {
    id: 'track1',
    title: 'Test Track',
    artist: 'Test Artist',
    previewUrl: 'https://test.com/preview.mp3'
  };

  const mockNextTrack = {
    id: 'track2',
    title: 'Next Track',
    artist: 'Next Artist',
    previewUrl: 'https://test.com/next.mp3'
  };

  const mockQueueItem: QueueItem = {
    id: 'request1',
    eventId: 'event1',
    userId: 'user1',
    song: mockTrack,
    status: 'approved',
    queuePosition: 0,
    metadata: {
      requestTime: new Date().toISOString(),
      votes: 0
    }
  };

  const mockNextQueueItem: QueueItem = {
    ...mockQueueItem,
    id: 'request2',
    song: mockNextTrack,
    queuePosition: 1
  };

  beforeEach(() => {
    // Mock Audio element
    mockAudio = {
      play: vi.fn(),
      pause: vi.fn(),
      load: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      volume: 1,
      currentTime: 0,
      duration: 30,
      src: ''
    } as unknown as HTMLAudioElement;

    window.Audio = vi.fn().mockImplementation(() => mockAudio);
    
    // Mock track analysis
    (trackAnalysisService.getAudioFeatures as jest.Mock).mockResolvedValue({
      bpm: 120,
      key: 1,
      mode: 1,
      energy: 0.8,
      danceability: 0.7
    });

    controller = new AdvancedPlaybackController();
  });

  afterEach(() => {
    controller.cleanup();
    vi.clearAllMocks();
  });

  describe('Track Preparation', () => {
    it('prepares next track with audio features', async () => {
      await controller.prepareNextTrack(mockQueueItem);

      expect(trackAnalysisService.getAudioFeatures).toHaveBeenCalledWith(mockTrack.id);
      expect(analyticsService.trackEvent).toHaveBeenCalledWith(
        'track_prepared',
        expect.objectContaining({
          trackId: mockTrack.id,
          eventId: mockQueueItem.eventId
        })
      );
    });

    it('handles preparation errors gracefully', async () => {
      const error = new Error('Analysis failed');
      (trackAnalysisService.getAudioFeatures as jest.Mock).mockRejectedValueOnce(error);

      await expect(controller.prepareNextTrack(mockQueueItem)).rejects.toThrow();
      expect(analyticsService.trackError).toHaveBeenCalledWith(error, {
        context: 'track_preparation',
        trackId: mockTrack.id
      });
    });
  });

  describe('Track Transitions', () => {
    beforeEach(async () => {
      await controller.playTrack(mockTrack);
      await controller.prepareNextTrack(mockNextQueueItem);
    });

    it('executes fade transition when energy difference is moderate', async () => {
      (trackAnalysisService.analyzeMixability as jest.Mock).mockResolvedValue({
        bpmDiff: 10,
        keyCompatibility: 0.5,
        energyTransition: 0.2
      });

      await controller.transitionToNext(mockNextQueueItem);

      // Verify fade transition
      expect(mockAudio.volume).toBe(1);
      expect(analyticsService.trackEvent).toHaveBeenCalledWith(
        'transition_complete',
        expect.objectContaining({
          trackId: mockNextTrack.id,
          transitionType: 'fade',
          success: true
        })
      );
    });

    it('executes cut transition when energy difference is high', async () => {
      (trackAnalysisService.analyzeMixability as jest.Mock).mockResolvedValue({
        bpmDiff: 20,
        keyCompatibility: 0.2,
        energyTransition: 0.5
      });

      await controller.transitionToNext(mockNextQueueItem);

      // Verify cut transition
      expect(mockAudio.play).toHaveBeenCalled();
      expect(analyticsService.trackEvent).toHaveBeenCalledWith(
        'transition_complete',
        expect.objectContaining({
          trackId: mockNextTrack.id,
          transitionType: 'cut',
          success: true
        })
      );
    });

    it('executes beatmatch transition when tracks are compatible', async () => {
      (trackAnalysisService.analyzeMixability as jest.Mock).mockResolvedValue({
        bpmDiff: 3,
        keyCompatibility: 0.9,
        energyTransition: 0.1
      });

      await controller.transitionToNext(mockNextQueueItem);

      expect(analyticsService.trackEvent).toHaveBeenCalledWith(
        'transition_complete',
        expect.objectContaining({
          trackId: mockNextTrack.id,
          transitionType: 'beatmatch',
          success: true
        })
      );
    });

    it('handles transition errors gracefully', async () => {
      const error = new Error('Transition failed');
      mockAudio.play.mockRejectedValueOnce(error);

      await controller.transitionToNext(mockNextQueueItem);

      expect(analyticsService.trackError).toHaveBeenCalledWith(
        expect.any(Error),
        expect.objectContaining({
          context: 'track_transition',
          fromTrackId: mockTrack.id,
          toTrackId: mockNextTrack.id
        })
      );
    });
  });

  describe('Volume Control', () => {
    it('adjusts volume smoothly during fade transition', async () => {
      const volumeChanges: number[] = [];
      Object.defineProperty(mockAudio, 'volume', {
        set: (v: number) => volumeChanges.push(v),
        get: () => volumeChanges[volumeChanges.length - 1] || 1
      });

      await controller.playTrack(mockTrack);
      await controller.prepareNextTrack(mockNextQueueItem);
      await controller.transitionToNext(mockNextQueueItem);

      expect(volumeChanges).toEqual(
        expect.arrayContaining([
          expect.any(Number)
        ])
      );
      expect(Math.min(...volumeChanges)).toBeGreaterThanOrEqual(0);
      expect(Math.max(...volumeChanges)).toBeLessThanOrEqual(1);
    });
  });

  describe('Cleanup', () => {
    it('cleans up resources properly', () => {
      const mockTimeout = vi.spyOn(window, 'clearTimeout');
      
      controller.cleanup();

      expect(mockTimeout).toHaveBeenCalled();
      expect(mockAudio.removeEventListener).toHaveBeenCalled();
    });
  });
}); 
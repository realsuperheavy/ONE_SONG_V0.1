import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AdvancedQueueOptimizer } from '../AdvancedQueueOptimizer';
import { trackAnalysisService } from '@/lib/spotify/services/analysis';
import { Cache } from '@/lib/cache';

// Mock dependencies
vi.mock('@/lib/spotify/services/analysis');
vi.mock('@/lib/cache');

describe('AdvancedQueueOptimizer', () => {
  let optimizer: AdvancedQueueOptimizer;
  const mockQueue = [
    {
      id: '1',
      song: { id: 'song1' },
      eventId: 'event1',
      queuePosition: 0
    },
    {
      id: '2',
      song: { id: 'song2' },
      eventId: 'event1',
      queuePosition: 1
    }
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    optimizer = new AdvancedQueueOptimizer();
    
    // Setup mock responses
    vi.mocked(trackAnalysisService.analyzeMixability).mockResolvedValue({
      bpmDiff: 5,
      keyCompatibility: 0.8,
      energyTransition: 0.2
    });
  });

  it('optimizes queue based on track analysis', async () => {
    vi.mocked(trackAnalysisService.getAudioFeatures).mockResolvedValueOnce({
      bpm: 120,
      key: 1,
      mode: 1,
      timeSignature: 4,
      danceability: 0.8,
      energy: 0.7,
      acousticness: 0.2,
      instrumentalness: 0.1,
      liveness: 0.1,
      valence: 0.6
    });

    const result = await optimizer.optimizeQueueOrder('event1');
    
    expect(trackAnalysisService.analyzeMixability).toHaveBeenCalled();
    expect(result).toBeDefined();
  });

  it('handles empty queue gracefully', async () => {
    const result = await optimizer.optimizeQueueOrder('event1');
    expect(result).toEqual([]);
  });

  it('maintains queue integrity during optimization', async () => {
    const originalIds = mockQueue.map(item => item.id);
    const result = await optimizer.optimizeQueueOrder('event1');
    const resultIds = result.map(item => item.id);
    
    expect(resultIds.sort()).toEqual(originalIds.sort());
  });

  it('optimizes transitions between tracks', async () => {
    vi.mocked(trackAnalysisService.analyzeMixability).mockResolvedValueOnce({
      bpmDiff: 2,
      keyCompatibility: 0.9,
      energyTransition: 0.1
    });

    const result = await optimizer.optimizeQueueOrder('event1');
    const transitions = await optimizer['calculateTransitionScores'](
      result.map(item => item.song.id)
    );
    
    expect(Math.max(...transitions.flat())).toBeLessThanOrEqual(1);
    expect(Math.min(...transitions.flat())).toBeGreaterThanOrEqual(0);
  });

  it('handles analysis service failures', async () => {
    vi.mocked(trackAnalysisService.analyzeMixability).mockRejectedValueOnce(
      new Error('API Error')
    );

    await expect(optimizer.optimizeQueueOrder('event1')).rejects.toThrow();
  });

  it('respects transition score weights', async () => {
    const transitions = await optimizer['calculateTransitionScores']([
      'song1',
      'song2'
    ]);
    
    expect(transitions).toBeDefined();
    expect(transitions[0][1]).toBeGreaterThanOrEqual(0);
    expect(transitions[0][1]).toBeLessThanOrEqual(1);
  });
}); 
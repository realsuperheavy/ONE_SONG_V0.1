import { QueueOptimizer } from './QueueOptimizer';
import { trackAnalysisService } from '@/lib/spotify/services/analysis';

export class AdvancedQueueOptimizer extends QueueOptimizer {
  async optimizeQueueOrder(eventId: string): Promise<void> {
    const currentQueue = await this.getCurrentQueue(eventId);
    const optimizedQueue = await this.calculateOptimalOrder(currentQueue);
    await this.reorderQueue(eventId, optimizedQueue.map(item => item.id));
  }

  private async calculateOptimalOrder(queue: QueueItem[]): Promise<QueueItem[]> {
    // Early returns
    if (queue.length <= 1) return queue;
    
    // Get all track IDs for analysis
    const trackIds = queue.map(item => item.song.id);
    
    // Calculate transition scores matrix
    const transitionScores = await this.calculateTransitionScores(trackIds);
    
    // Dynamic programming approach for optimal ordering
    const n = queue.length;
    const dp: number[][] = Array(n).fill(0).map(() => Array(1 << n).fill(-1));
    const prev: number[][] = Array(n).fill(0).map(() => Array(1 << n).fill(-1));
    
    // Find optimal path using TSP-like approach
    const findBestPath = (current: number, mask: number): number => {
      if (mask === (1 << n) - 1) return 0;
      if (dp[current][mask] !== -1) return dp[current][mask];
      
      let bestScore = -Infinity;
      let bestNext = -1;
      
      for (let next = 0; next < n; next++) {
        if ((mask & (1 << next)) === 0) {
          const score = transitionScores[current][next] + 
            findBestPath(next, mask | (1 << next));
          
          if (score > bestScore) {
            bestScore = score;
            bestNext = next;
          }
        }
      }
      
      dp[current][mask] = bestScore;
      prev[current][mask] = bestNext;
      return bestScore;
    };
    
    // Find best starting point
    let bestStart = 0;
    let bestScore = -Infinity;
    
    for (let i = 0; i < n; i++) {
      const score = findBestPath(i, 1 << i);
      if (score > bestScore) {
        bestScore = score;
        bestStart = i;
      }
    }
    
    // Reconstruct optimal order
    const optimizedOrder: QueueItem[] = [];
    let current = bestStart;
    let mask = 1 << bestStart;
    
    optimizedOrder.push(queue[current]);
    
    while (optimizedOrder.length < n) {
      const next = prev[current][mask];
      if (next === -1) break;
      
      optimizedOrder.push(queue[next]);
      mask |= (1 << next);
      current = next;
    }
    
    return optimizedOrder;
  }

  private async calculateTransitionScores(trackIds: string[]): Promise<number[][]> {
    const scores: number[][] = [];
    for (let i = 0; i < trackIds.length; i++) {
      scores[i] = [];
      for (let j = 0; j < trackIds.length; j++) {
        if (i !== j) {
          const { bpmDiff, keyCompatibility, energyTransition } = 
            await trackAnalysisService.analyzeMixability(trackIds[i], trackIds[j]);
          
          scores[i][j] = this.calculateTransitionScore(
            bpmDiff,
            keyCompatibility,
            energyTransition
          );
        }
      }
    }
    return scores;
  }

  private calculateTransitionScore(
    bpmDiff: number,
    keyCompatibility: number,
    energyTransition: number
  ): number {
    // Weight factors for different components
    const weights = {
      bpm: 0.4,      // 40% importance
      key: 0.35,     // 35% importance
      energy: 0.25   // 25% importance
    };

    // BPM scoring (inverse relationship - lower difference is better)
    // Optimal BPM difference is within 5 BPM
    const bpmScore = Math.max(0, 1 - (bpmDiff / 20));

    // Key compatibility is already normalized 0-1 from calculateKeyCompatibility

    // Energy transition scoring
    // We want smooth energy transitions, penalize big jumps
    // Ideal energy change is between -0.3 and +0.3
    const energyScore = 1 - Math.min(1, Math.abs(energyTransition) / 0.3);

    // Weighted average of all components
    return (
      weights.bpm * bpmScore +
      weights.key * keyCompatibility +
      weights.energy * energyScore
    );
  }
} 
import { PlaybackController } from './PlaybackController';
import { trackAnalysisService } from '@/lib/spotify/services/analysis';
import { analyticsService } from '@/lib/firebase/services/analytics';
import { QueueItem } from '@/lib/firebase/services/queue';

export class AdvancedPlaybackController extends PlaybackController {
  private crossfadeDuration: number = 3000; // 3 seconds
  private currentAnalysis: AudioFeatures | null = null;
  private nextAnalysis: AudioFeatures | null = null;
  private transitionTimer: NodeJS.Timeout | null = null;

  async prepareNextTrack(queueItem: QueueItem): Promise<void> {
    try {
      // Get audio features for next track
      this.nextAnalysis = await trackAnalysisService.getAudioFeatures(queueItem.song.id);
      
      // Preload audio
      await this.preloadAudio(queueItem.song.previewUrl);
      
      // Track preparation analytics
      analyticsService.trackEvent('track_prepared', {
        trackId: queueItem.song.id,
        eventId: queueItem.eventId,
        queuePosition: queueItem.queuePosition
      });
    } catch (error) {
      analyticsService.trackError(error as Error, {
        context: 'track_preparation',
        trackId: queueItem.song.id
      });
      throw error;
    }
  }

  async transitionToNext(nextItem: QueueItem): Promise<void> {
    if (!this.nextAnalysis || !this.currentTrack) return;

    try {
      const transitionType = await this.determineTransitionType(
        this.currentAnalysis!,
        this.nextAnalysis
      );

      // Track transition start
      analyticsService.trackEvent('transition_start', {
        fromTrackId: this.currentTrack.id,
        toTrackId: nextItem.song.id,
        transitionType
      });

      await this.executeTransition(transitionType, nextItem);
      
      // Update current track analysis
      this.currentAnalysis = this.nextAnalysis;
      this.nextAnalysis = null;

      // Track transition complete
      analyticsService.trackEvent('transition_complete', {
        trackId: nextItem.song.id,
        transitionType,
        success: true
      });
    } catch (error) {
      analyticsService.trackError(error as Error, {
        context: 'track_transition',
        fromTrackId: this.currentTrack.id,
        toTrackId: nextItem.song.id
      });
      
      // Fallback to immediate switch on error
      await this.playTrack(nextItem.song);
    }
  }

  private async determineTransitionType(
    current: AudioFeatures,
    next: AudioFeatures
  ): Promise<'cut' | 'fade' | 'beatmatch'> {
    const bpmDiff = Math.abs(current.bpm - next.bpm);
    const energyDiff = Math.abs(current.energy - next.energy);
    const keyCompatibility = await trackAnalysisService.analyzeMixability(
      this.currentTrack!.id,
      this.nextTrack!.id
    );

    // Determine best transition type based on musical analysis
    if (bpmDiff < 5 && keyCompatibility.keyCompatibility > 0.8) {
      return 'beatmatch';
    } else if (energyDiff > 0.3) {
      return 'cut';
    } else {
      return 'fade';
    }
  }

  private async executeTransition(
    type: 'cut' | 'fade' | 'beatmatch',
    nextItem: QueueItem
  ): Promise<void> {
    switch (type) {
      case 'cut':
        await this.executeCutTransition(nextItem);
        break;
      case 'fade':
        await this.executeFadeTransition(nextItem);
        break;
      case 'beatmatch':
        await this.executeBeatmatchTransition(nextItem);
        break;
    }
  }

  private async executeCutTransition(nextItem: QueueItem): Promise<void> {
    await this.playTrack(nextItem.song);
  }

  private async executeFadeTransition(nextItem: QueueItem): Promise<void> {
    const steps = 30; // Number of volume adjustment steps
    const stepDuration = this.crossfadeDuration / steps;
    const volumeStep = 1 / steps;

    // Start playing next track at 0 volume
    await this.playTrack(nextItem.song, 0);

    for (let i = 0; i <= steps; i++) {
      const currentVolume = 1 - (i * volumeStep);
      const nextVolume = i * volumeStep;

      this.setVolume(currentVolume, 'current');
      this.setVolume(nextVolume, 'next');

      await new Promise(resolve => setTimeout(resolve, stepDuration));
    }

    // Ensure clean switch
    this.stopCurrent();
    this.setVolume(1, 'next');
  }

  private async executeBeatmatchTransition(nextItem: QueueItem): Promise<void> {
    // Implementation would require more complex beat detection and matching
    // Fallback to fade transition for now
    await this.executeFadeTransition(nextItem);
  }

  cleanup(): void {
    if (this.transitionTimer) {
      clearTimeout(this.transitionTimer);
    }
    super.cleanup();
  }
} 
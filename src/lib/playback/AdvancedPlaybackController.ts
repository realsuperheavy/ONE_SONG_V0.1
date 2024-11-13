'use client';

import { analyticsService } from '@/lib/firebase/services/analytics';
import { PerformanceMetricsCollector } from '@/lib/monitoring/PerformanceMetricsCollector';

interface PlaybackState {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  buffered: TimeRanges | null;
}

export class AdvancedPlaybackController {
  private audio: HTMLAudioElement | null = null;
  private performanceMonitor: PerformanceMetricsCollector;
  private eventListeners: Array<{
    target: EventTarget;
    type: string;
    listener: EventListener;
  }> = [];
  private state: PlaybackState;

  constructor() {
    this.performanceMonitor = new PerformanceMetricsCollector();
    this.state = {
      isPlaying: false,
      currentTime: 0,
      duration: 0,
      volume: 1,
      buffered: null
    };
  }

  private addEventListenerWithCleanup(
    target: EventTarget,
    type: string,
    listener: EventListener
  ): void {
    target.addEventListener(type, listener);
    this.eventListeners.push({ target, type, listener });
  }

  private setupEventListeners(): void {
    if (!this.audio) return;

    // Time update
    this.addEventListenerWithCleanup(
      this.audio,
      'timeupdate',
      () => {
        this.state.currentTime = this.audio?.currentTime || 0;
        this.performanceMonitor.trackMetric('playbackProgress', this.state.currentTime);
      }
    );

    // Duration change
    this.addEventListenerWithCleanup(
      this.audio,
      'durationchange',
      () => {
        this.state.duration = this.audio?.duration || 0;
      }
    );

    // Buffer progress
    this.addEventListenerWithCleanup(
      this.audio,
      'progress',
      () => {
        this.state.buffered = this.audio?.buffered || null;
        this.checkBuffering();
      }
    );

    // Error handling
    this.addEventListenerWithCleanup(
      this.audio,
      'error',
      (error) => {
        this.handlePlaybackError(error);
      }
    );
  }

  private handlePlaybackError(error: Event): void {
    const mediaError = (error.target as HTMLMediaElement).error;
    
    analyticsService.trackError(new Error(mediaError?.message || 'Playback error'), {
      context: 'audio_playback',
      code: mediaError?.code?.toString(),
      details: {
        currentTime: this.state.currentTime,
        duration: this.state.duration,
        isPlaying: this.state.isPlaying
      }
    });

    this.performanceMonitor.trackError('playback');
  }

  private cleanup(): void {
    // Remove all event listeners
    this.eventListeners.forEach(({ target, type, listener }) => {
      target.removeEventListener(type, listener);
    });
    this.eventListeners = [];

    // Clear audio element
    if (this.audio) {
      this.audio.pause();
      this.audio.src = '';
      this.audio.load();
      this.audio = null;
    }

    // Reset state
    this.state = {
      isPlaying: false,
      currentTime: 0,
      duration: 0,
      volume: 1,
      buffered: null
    };
  }

  dispose(): void {
    this.cleanup();
    this.performanceMonitor.dispose();
  }

  // ... rest of the implementation
}
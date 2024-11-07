import { SpotifyTrack } from '@/lib/spotify/services/track';
import { QueueItem } from '@/lib/firebase/services/queue';
import { analyticsService } from '@/lib/firebase/services/analytics';

interface PlaybackState {
  currentTrack: SpotifyTrack | null;
  isPlaying: boolean;
  progress: number;
  duration: number;
  volume: number;
}

export class PlaybackController {
  private state: PlaybackState;
  private audio: HTMLAudioElement | null = null;
  private queue: QueueItem[];
  private eventId: string;

  constructor(eventId: string) {
    this.eventId = eventId;
    this.queue = [];
    this.state = {
      currentTrack: null,
      isPlaying: false,
      progress: 0,
      duration: 0,
      volume: 1
    };
  }

  async initialize(): Promise<void> {
    if (typeof window === 'undefined') return;
    
    this.audio = new Audio();
    this.setupAudioListeners();
  }

  private setupAudioListeners(): void {
    if (!this.audio) return;

    this.audio.addEventListener('timeupdate', () => {
      this.state.progress = this.audio?.currentTime || 0;
    });

    this.audio.addEventListener('ended', () => {
      this.playNext();
    });

    this.audio.addEventListener('error', (error) => {
      analyticsService.trackError(error as any, {
        context: 'playback',
        trackId: this.state.currentTrack?.id
      });
    });
  }

  async playTrack(track: SpotifyTrack): Promise<void> {
    if (!this.audio || !track.previewUrl) return;

    try {
      this.audio.src = track.previewUrl;
      this.state.currentTrack = track;
      await this.audio.play();
      this.state.isPlaying = true;

      analyticsService.trackEvent('track_play', {
        trackId: track.id,
        eventId: this.eventId
      });
    } catch (error) {
      analyticsService.trackError(error as Error, {
        context: 'playback_start',
        trackId: track.id
      });
      throw error;
    }
  }

  pause(): void {
    if (!this.audio) return;
    this.audio.pause();
    this.state.isPlaying = false;
  }

  resume(): void {
    if (!this.audio) return;
    this.audio.play();
    this.state.isPlaying = true;
  }

  setVolume(volume: number): void {
    if (!this.audio) return;
    this.audio.volume = Math.max(0, Math.min(1, volume));
    this.state.volume = this.audio.volume;
  }

  seek(time: number): void {
    if (!this.audio) return;
    this.audio.currentTime = Math.max(0, Math.min(time, this.audio.duration));
  }

  updateQueue(queue: QueueItem[]): void {
    this.queue = queue;
  }

  private async playNext(): Promise<void> {
    const nextTrack = this.queue[0];
    if (nextTrack) {
      await this.playTrack(nextTrack.song);
      // Remove played track from queue
      this.queue = this.queue.slice(1);
    }
  }

  getState(): PlaybackState {
    return { ...this.state };
  }

  cleanup(): void {
    if (this.audio) {
      this.audio.pause();
      this.audio.src = '';
      this.audio = null;
    }
  }
} 
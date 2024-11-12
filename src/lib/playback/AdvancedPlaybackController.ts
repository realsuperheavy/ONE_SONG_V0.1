import { PlaybackController } from './PlaybackController';
import { trackAnalysisService } from '@/lib/spotify/services/analysis';
import { analyticsService } from '@/lib/firebase/services/analytics';
import { QueueItem } from '@/lib/firebase/services/queue';
import { SpotifyTrack } from '@/lib/spotify/services/track';

interface AudioFeatures {
  bpm: number;
  energy: number;
  keyCompatibility?: number;
}

interface AudioPlayers {
  current: HTMLAudioElement | null;
  next: HTMLAudioElement | null;
}

export class AdvancedPlaybackController extends PlaybackController {
  private crossfadeDuration: number = 3000;
  private currentAnalysis: AudioFeatures | null = null;
  private nextAnalysis: AudioFeatures | null = null;
  private transitionTimer: NodeJS.Timeout | null = null;
  private players: AudioPlayers = {
    current: null,
    next: null
  };
  protected currentTrack: SpotifyTrack | null = null;
  protected nextTrack: SpotifyTrack | null = null;

  constructor(eventId: string) {
    super(eventId);
    this.initialize();
  }

  getCurrentTime(): number {
    return this.players.current?.currentTime || 0;
  }

  getDuration(): number {
    return this.players.current?.duration || 0;
  }

  async play(): Promise<void> {
    if (this.players.current) {
      await this.players.current.play();
    }
  }

  async pause(): Promise<void> {
    if (this.players.current) {
      await this.players.current.pause();
    }
  }

  seek(time: number): void {
    if (this.players.current) {
      this.players.current.currentTime = Math.max(0, Math.min(time, this.players.current.duration));
    }
  }

  setVolume(volume: number, target: 'current' | 'next' = 'current'): void {
    const player = this.players[target];
    if (player) {
      player.volume = Math.max(0, Math.min(1, volume));
    }
  }

  protected async preloadAudio(url: string | undefined): Promise<void> {
    if (!url) return;
    
    this.players.next = new Audio(url);
    await new Promise((resolve, reject) => {
      if (!this.players.next) return reject(new Error('No audio player'));
      
      this.players.next.addEventListener('canplaythrough', resolve, { once: true });
      this.players.next.addEventListener('error', reject, { once: true });
      this.players.next.load();
    });
  }

  public async playTrack(track: SpotifyTrack, initialVolume: number = 1): Promise<void> {
    if (!track.previewUrl) return;

    const newPlayer = new Audio(track.previewUrl);
    newPlayer.volume = initialVolume;

    try {
      await newPlayer.play();
      
      // Update players
      if (this.players.current) {
        this.players.current.pause();
        this.players.current = null;
      }
      this.players.current = newPlayer;
      this.players.next = null;
      
      // Update track info
      this.currentTrack = track;
    } catch (error) {
      analyticsService.trackError(error as Error, {
        context: 'playback_start',
        trackId: track.id
      });
      throw error;
    }
  }

  protected stopCurrent(): void {
    if (this.players.current) {
      this.players.current.pause();
      this.players.current.currentTime = 0;
      this.players.current = null;
    }
  }

  private convertToSpotifyTrack(song: QueueItem['song']): SpotifyTrack {
    return {
      id: song.id,
      title: song.title,
      artist: song.artist,
      albumArt: song.albumArt,
      duration: song.duration,
      previewUrl: song.previewUrl,
      popularity: 0,
      explicit: false
    };
  }

  async prepareNextTrack(track: QueueItem): Promise<void> {
    try {
      // Get audio features for next track
      this.nextAnalysis = await trackAnalysisService.getAudioFeatures(track.song.id);
      this.nextTrack = this.convertToSpotifyTrack(track.song);
      
      // Preload audio
      await this.preloadAudio(this.nextTrack.previewUrl);
      
      // Track preparation analytics
      analyticsService.trackEvent('track_prepared', {
        trackId: track.song.id,
        eventId: track.eventId,
        queuePosition: track.queuePosition
      });
    } catch (error) {
      analyticsService.trackError(error as Error, {
        context: 'track_preparation',
        trackId: track.song.id
      });
      throw error;
    }
  }

  async transitionToNext(track: QueueItem): Promise<void> {
    if (!this.nextAnalysis || !this.currentTrack) return;

    try {
      const transitionType = await this.determineTransitionType(
        this.currentAnalysis!,
        this.nextAnalysis
      );

      // Track transition start
      analyticsService.trackEvent('transition_start', {
        fromTrackId: this.currentTrack.id,
        toTrackId: track.song.id,
        transitionType
      });

      await this.executeTransition(transitionType, track);
      
      // Update current track analysis
      this.currentAnalysis = this.nextAnalysis;
      this.nextAnalysis = null;

      // Track transition complete
      analyticsService.trackEvent('transition_complete', {
        trackId: track.song.id,
        transitionType,
        success: true
      });
    } catch (error) {
      analyticsService.trackError(error as Error, {
        context: 'track_transition',
        fromTrackId: this.currentTrack.id,
        toTrackId: track.song.id
      });
      
      // Fallback to immediate switch on error
      await this.playTrack(this.convertToSpotifyTrack(track.song));
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
    const track = this.convertToSpotifyTrack(nextItem.song);
    await this.playTrack(track);
  }

  private async executeFadeTransition(nextItem: QueueItem): Promise<void> {
    const steps = 30; // Number of volume adjustment steps
    const stepDuration = this.crossfadeDuration / steps;
    const volumeStep = 1 / steps;

    // Start playing next track at 0 volume
    const track = this.convertToSpotifyTrack(nextItem.song);
    await this.playTrack(track, 0);

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
    if (this.players.current) {
      this.players.current.pause();
      this.players.current = null;
    }
    if (this.players.next) {
      this.players.next.pause();
      this.players.next = null;
    }
    super.cleanup();
  }
}
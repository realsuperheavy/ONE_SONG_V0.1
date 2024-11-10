import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { useSpotifyPlayback } from '@/hooks/useSpotifyPlayback';
import { SongRequest } from '@/types/models';
import {
  Play,
  Pause,
  SkipForward,
  SkipBack,
  Volume2,
  VolumeX,
  Music2,
  Repeat,
  Shuffle
} from 'lucide-react';

interface DJControlPanelProps {
  currentSong: SongRequest | null;
  onNext: () => void;
  onPrevious: () => void;
}

export function DJControlPanel({ currentSong, onNext, onPrevious }: DJControlPanelProps) {
  const [volume, setVolume] = useState(100);
  const [isMuted, setIsMuted] = useState(false);
  const [isRepeat, setIsRepeat] = useState(false);
  const [isShuffle, setIsShuffle] = useState(false);

  const {
    isPlaying,
    togglePlay,
    seek,
    duration,
    progress,
    setVolume: setPlaybackVolume
  } = useSpotifyPlayback(currentSong?.song.id);

  // Sync volume changes with Spotify playback
  useEffect(() => {
    setPlaybackVolume(isMuted ? 0 : volume);
  }, [volume, isMuted, setPlaybackVolume]);

  const toggleMute = () => {
    setIsMuted(!isMuted);
    setPlaybackVolume(isMuted ? volume : 0);
  };

  const formatTime = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  return (
    <Card className="p-6 bg-gradient-to-r from-[#1E1E1E] to-[#2E2F2E]">
      {/* Now Playing Info */}
      <div className="flex items-center gap-4 mb-4">
        {currentSong?.song.albumArt && (
          <img
            src={currentSong.song.albumArt}
            alt={`${currentSong.song.title} album art`}
            className="w-16 h-16 rounded-lg"
          />
        )}
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-semibold text-white truncate">
            {currentSong?.song.title || 'No song playing'}
          </h3>
          <p className="text-sm text-gray-400 truncate">
            {currentSong?.song.artist || 'Select a song to play'}
          </p>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="space-y-2 mb-4">
        <Slider
          value={[progress]}
          max={duration}
          step={1}
          onValueChange={([value]) => seek(value)}
          className="w-full"
        />
        <div className="flex justify-between text-sm text-gray-400">
          <span>{formatTime(progress)}</span>
          <span>{formatTime(duration)}</span>
        </div>
      </div>

      {/* Playback Controls */}
      <div className="flex items-center justify-center gap-4 mb-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsShuffle(!isShuffle)}
          className={isShuffle ? 'text-[#F49620]' : 'text-white'}
        >
          <Shuffle className="w-5 h-5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={onPrevious}
          disabled={!currentSong}
        >
          <SkipBack className="w-6 h-6" />
        </Button>
        <Button
          size="icon"
          variant="ghost"
          onClick={togglePlay}
          className="w-12 h-12 bg-[#F49620] hover:bg-[#FF7200] text-white rounded-full"
          disabled={!currentSong}
        >
          {isPlaying ? (
            <Pause className="w-6 h-6" />
          ) : (
            <Play className="w-6 h-6" />
          )}
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={onNext}
          disabled={!currentSong}
        >
          <SkipForward className="w-6 h-6" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsRepeat(!isRepeat)}
          className={isRepeat ? 'text-[#F49620]' : 'text-white'}
        >
          <Repeat className="w-5 h-5" />
        </Button>
      </div>

      {/* Volume Control */}
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleMute}
          className="text-white"
        >
          {isMuted || volume === 0 ? (
            <VolumeX className="w-5 h-5" />
          ) : (
            <Volume2 className="w-5 h-5" />
          )}
        </Button>
        <Slider
          value={[isMuted ? 0 : volume]}
          max={100}
          step={1}
          onValueChange={([value]) => setVolume(value)}
          className="w-32"
        />
      </div>
    </Card>
  );
} 
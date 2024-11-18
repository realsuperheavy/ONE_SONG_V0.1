import { useCurrentTrack } from "../../hooks/useCurrentTrack";
import { Card } from "../ui/card";
import { Progress } from "../ui/progress";
import { formatTime } from "../../lib/utils";
import { CurrentlyPlayingSkeleton } from "@/components/attendee/CurrentlyPlayingSkeleton";
import Image from "next/image";

interface CurrentlyPlayingProps {
  eventId: string;
}

export function CurrentlyPlaying({ eventId }: CurrentlyPlayingProps) {
  const { 
    currentTrack, 
    progress, 
    isLoading 
  } = useCurrentTrack(eventId);

  if (isLoading) {
    return <CurrentlyPlayingSkeleton />;
  }

  if (!currentTrack) {
    return null;
  }

  const progressPercent = (progress / currentTrack.duration) * 100;

  return (
    <Card className="p-4">
      <h2 className="text-lg font-semibold mb-4">Now Playing</h2>
      <div className="flex items-center gap-4">
        {currentTrack.albumArt && (
          <Image
            src={currentTrack.albumArt}
            alt={currentTrack.title}
            className="w-16 h-16 rounded-md"
            width={64}
            height={64}
            layout="fixed"
          />
        )}
        <div className="flex-1">
          <p className="font-medium">{currentTrack.title}</p>
          <p className="text-sm text-muted-foreground">
            {currentTrack.artist}
          </p>
          <div className="mt-2 space-y-1">
            <Progress value={progressPercent} />
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>{formatTime(progress)}</span>
              <span>{formatTime(currentTrack.duration)}</span>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
} 
// src/components/landing/user-selection.tsx
import { useState } from 'react';
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Users, Headphones } from "lucide-react";
import { cn } from "@/lib/utils";
import { DJAuthForm } from '@/components/dj/auth/dj-auth-form';
import { useRouter } from 'next/navigation';
import { useTouchInteraction } from '@/hooks/useTouchInteraction';
import { TouchEvent as ReactTouchEvent } from 'react';

interface UserSelectionProps {
  selectedType: 'attendee' | 'dj' | null;
  onSelect: (type: 'attendee' | 'dj') => void;
}

export function UserSelection({ selectedType, onSelect }: UserSelectionProps) {
  const [showDJAuth, setShowDJAuth] = useState(false);
  const router = useRouter();

  const { touchHandlers } = useTouchInteraction({
    onSwipe: (direction) => {
      if (direction === 'left' && selectedType === 'attendee') {
        handleDJCardClick();
      } else if (direction === 'right' && selectedType === 'dj') {
        onSelect('attendee');
      }
    }
  }) as {
    touchHandlers: {
      onTouchStart: (e: ReactTouchEvent<Element>) => void;
      onTouchEnd: (e: ReactTouchEvent<Element>) => void;
      onTouchCancel: () => void;
    }
  };

  const handleDJCardClick = () => {
    onSelect('dj');
    setShowDJAuth(true);
  };

  const handleDJAuthSuccess = () => {
    setShowDJAuth(false);
    router.push('/dj/dashboard');
  };

  return (
    <>
      <div 
        className="grid gap-4 animate-in fade-in-50 duration-500"
        {...touchHandlers}
      >
        <Card
          className={cn(
            "p-6 cursor-pointer transition-all duration-300",
            "hover:bg-secondary/50 hover:scale-[1.02]",
            "hover:shadow-[0_0_30px_-5px_hsl(var(--primary))]",
            "active:scale-[0.98]",
            selectedType === 'attendee' ? 'ring-2 ring-primary shadow-lg' : '',
            "group"
          )}
          onClick={() => onSelect('attendee')}
        >
          <div className="flex items-center gap-4">
            <div className={cn(
              "h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center",
              "transition-all duration-300",
              "group-hover:bg-primary/20",
              selectedType === 'attendee' && "bg-primary/20"
            )}>
              <Users className={cn(
                "h-6 w-6 text-primary",
                "transition-transform duration-300",
                "group-hover:scale-110",
                selectedType === 'attendee' && "scale-110"
              )} />
            </div>
            <div>
              <h2 className="font-semibold">Join an Event</h2>
              <p className="text-sm text-muted-foreground">
                Request songs and vote on the playlist
              </p>
            </div>
          </div>
        </Card>

        <Card
          className={cn(
            "p-6 cursor-pointer transition-all duration-300",
            "hover:bg-secondary/50 hover:scale-[1.02]",
            "hover:shadow-[0_0_30px_-5px_hsl(var(--primary))]",
            "active:scale-[0.98]",
            selectedType === 'dj' ? 'ring-2 ring-primary shadow-lg' : '',
            "group"
          )}
          onClick={handleDJCardClick}
        >
          <div className="flex items-center gap-4">
            <div className={cn(
              "h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center",
              "transition-all duration-300",
              "group-hover:bg-primary/20",
              selectedType === 'dj' && "bg-primary/20"
            )}>
              <Headphones className={cn(
                "h-6 w-6 text-primary",
                "transition-transform duration-300",
                "group-hover:scale-110",
                selectedType === 'dj' && "scale-110"
              )} />
            </div>
            <div>
              <h2 className="font-semibold">Login as DJ</h2>
              <p className="text-sm text-muted-foreground">
                Manage your events and control the music
              </p>
            </div>
          </div>
        </Card>
      </div>

      <Dialog open={showDJAuth} onOpenChange={setShowDJAuth}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>DJ Authentication</DialogTitle>
          </DialogHeader>
          <DJAuthForm onSuccess={handleDJAuthSuccess} />
        </DialogContent>
      </Dialog>
    </>
  );
}

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Music2, User, List, LogOut } from 'lucide-react';
import { useAuthStore } from '@/store/auth';

interface AttendeeNavProps {
  eventId: string;
}

export function AttendeeNav({ eventId }: AttendeeNavProps) {
  const router = useRouter();
  const { signOut } = useAuthStore();

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-background border-t">
      <div className="container mx-auto px-4 py-2">
        <div className="flex justify-around items-center">
          <Button 
            variant="ghost" 
            onClick={() => router.push(`/events/${eventId}/queue`)}
          >
            <Music2 className="h-5 w-5" />
          </Button>
          <Button 
            variant="ghost" 
            onClick={() => router.push(`/events/${eventId}/my-requests`)}
          >
            <List className="h-5 w-5" />
          </Button>
          <Button 
            variant="ghost" 
            onClick={() => router.push('/profile')}
          >
            <User className="h-5 w-5" />
          </Button>
          <Button 
            variant="ghost" 
            onClick={async () => {
              await signOut();
              router.push('/');
            }}
          >
            <LogOut className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </nav>
  );
} 
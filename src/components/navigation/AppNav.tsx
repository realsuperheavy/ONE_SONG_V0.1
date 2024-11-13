import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Music2, User, LogOut } from 'lucide-react';
import { useAuthStore } from '@/store/auth';

interface AppNavProps {
  eventId?: string;
}

export function AppNav({ eventId }: AppNavProps) {
  const router = useRouter();
  const { signOut } = useAuthStore();

  const handleLogout = async () => {
    await signOut();
    router.push('/');
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-background border-t">
      <div className="container mx-auto px-4 py-2">
        <div className="flex justify-around items-center">
          {eventId && (
            <Button 
              variant="ghost" 
              onClick={() => router.push(`/events/${eventId}/queue`)}
            >
              <Music2 className="h-5 w-5" />
            </Button>
          )}
          <Button 
            variant="ghost" 
            onClick={() => router.push('/profile')}
          >
            <User className="h-5 w-5" />
          </Button>
          <Button 
            variant="ghost" 
            onClick={handleLogout}
          >
            <LogOut className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </nav>
  );
} 
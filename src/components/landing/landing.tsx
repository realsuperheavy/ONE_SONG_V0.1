import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Music2, QrCode, ArrowRight, MapPin, Users, Clock } from 'lucide-react';
import { QRScannerDialog } from '@/components/qr/qr-scanner-dialog';
import { cn } from '@/lib/utils';
import { HeroSection } from './hero-section';
import { FeatureSection } from './feature-section';
import { UserSelection } from './user-selection';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { PhoneAuthForm } from '@/components/auth/phone-auth-form';

interface LiveEvent {
  id: string;
  name: string;
  venue: string;
  status: 'active' | 'ending' | 'full';
  attendeeCount: number;
  distance?: string;
}

export function LandingPage() {
  const [selectedUserType, setSelectedUserType] = useState<'attendee' | 'dj' | null>(null);
  const [showScanner, setShowScanner] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [nearbyEvents, setNearbyEvents] = useState<LiveEvent[]>([]);
  const backgroundRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const { showToast } = useToast();
  const [eventCode, setEventCode] = useState('');

  // Mouse tracking effect for interactive background
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (backgroundRef.current) {
        const { left, top } = backgroundRef.current.getBoundingClientRect();
        setMousePosition({
          x: e.clientX - left,
          y: e.clientY - top,
        });
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // Simulated nearby events data
  useEffect(() => {
    if (selectedUserType === 'attendee') {
      setNearbyEvents([
        {
          id: '1',
          name: 'Summer Vibes Party',
          venue: 'The Grand Club',
          status: 'active',
          attendeeCount: 156,
          distance: '0.5 miles'
        },
        {
          id: '2',
          name: 'Night Bass',
          venue: 'Club Echo',
          status: 'ending',
          attendeeCount: 89,
          distance: '1.2 miles'
        },
        {
          id: '3',
          name: 'Club Vibes',
          venue: 'Neon Nightclub',
          status: 'full',
          attendeeCount: 200,
          distance: '2.1 miles'
        }
      ]);
    }
  }, [selectedUserType]);

  const handleUserTypeSelect = (type: 'attendee' | 'dj') => {
    setSelectedUserType(type);
    if (type === 'dj') {
      router.push('/auth/phone');
    }
  };

  const handleJoinEvent = async (code: string) => {
    setIsSubmitting(true);
    try {
      router.push(`/event/${code}`);
    } catch (error) {
      showToast("Error message", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (eventCode.trim()) {
      handleJoinEvent(eventCode.trim().toUpperCase());
    }
  };

  return (
    <div 
      ref={backgroundRef}
      className="min-h-screen bg-background flex flex-col"
      style={{
        backgroundImage: `radial-gradient(
          600px at ${mousePosition.x}px ${mousePosition.y}px,
          rgba(var(--primary-rgb), 0.15),
          transparent 80%
        )`
      }}
    >
      {/* Navbar */}
      <div className="w-full border-b bg-background/95 backdrop-blur-sm supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Music2 className="h-4 w-4 text-primary" />
            </div>
            <span className="font-bold tracking-tight">OneSong</span>
          </div>
        </div>
      </div>

      {/* Hero Section */}
      <HeroSection />

      {/* Main Content */}
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-md mx-auto space-y-8">
          {/* User Type Selection */}
          <UserSelection 
            selectedType={selectedUserType}
            onSelect={handleUserTypeSelect}
          />

          {/* Event Code Input */}
          {selectedUserType === 'attendee' && (
            <div className="space-y-4 animate-in fade-in-50 slide-in-from-bottom-5">
              <PhoneAuthForm 
                onSuccess={(userId) => {
                  router.push(`/attendee/${userId}`);
                }}
              />

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-border" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">
                    or
                  </span>
                </div>
              </div>

              <Button
                variant="outline"
                className="w-full h-14 text-lg font-medium gap-2"
                onClick={() => setShowScanner(true)}
              >
                <QrCode className="h-5 w-5" />
                Scan QR Code
              </Button>
            </div>
          )}

          {/* Live Events Section */}
          {selectedUserType === 'attendee' && nearbyEvents.length > 0 && (
            <div className="space-y-4 animate-in fade-in-50 slide-in-from-bottom-5">
              <h2 className="text-lg font-semibold">Events Near You</h2>
              <div className="space-y-3">
                {nearbyEvents.map((event) => (
                  <Card 
                    key={event.id}
                    className="p-4 hover:bg-secondary/50 transition-colors cursor-pointer"
                  >
                    <div className="flex items-center justify-between gap-4">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-medium truncate">{event.name}</h3>
                          <Badge
                            variant={
                              event.status === 'active' ? 'default' :
                              event.status === 'ending' ? 'secondary' :
                              'destructive'
                            }
                          >
                            {event.status === 'active' && (
                              <span className="flex items-center gap-1">
                                <span className="w-1 h-1 rounded-full bg-current animate-pulse" />
                                Live
                              </span>
                            )}
                            {event.status === 'ending' && 'Ending Soon'}
                            {event.status === 'full' && 'Full'}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <MapPin className="h-4 w-4" />
                            <span className="truncate">{event.venue}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Users className="h-4 w-4" />
                            <span>{event.attendeeCount}</span>
                          </div>
                          {event.distance && (
                            <div className="flex items-center gap-1">
                              <Clock className="h-4 w-4" />
                              <span>{event.distance}</span>
                            </div>
                          )}
                        </div>
                      </div>
                      <Button
                        onClick={() => handleJoinEvent(event.id)}
                        disabled={event.status === 'full'}
                      >
                        Join
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Features Section */}
      <FeatureSection />

      {/* QR Scanner Dialog */}
      <QRScannerDialog
        open={showScanner}
        onOpenChange={setShowScanner}
        onScan={handleJoinEvent}
      />
    </div>
  );
}
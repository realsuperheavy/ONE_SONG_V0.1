'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { JoinEventForm } from '@/components/events/JoinEventForm';
import { NearbyEvents } from '@/components/events/NearbyEvents';
import { useToast } from '@/hooks/useToast';
import { eventService } from '@/lib/firebase/services/event';
import { analyticsService } from '@/lib/firebase/services/analytics';
import { PerformanceMetricsCollector } from '@/lib/monitoring/PerformanceMetricsCollector';
import { StatusIndicator } from '@/components/ui/status/StatusSystem';
import { useAccessibility } from '@/providers/accessibility/AccessibilityProvider';
import { motion, AnimatePresence } from 'framer-motion';

export function Landing() {
  const [showNearbyEvents, setShowNearbyEvents] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { showToast } = useToast();
  const { announceMessage } = useAccessibility();
  const performanceMonitor = new PerformanceMetricsCollector();

  useEffect(() => {
    performanceMonitor.startOperation('landingPageLoad');
    analyticsService.trackEvent('page_view', { page: 'landing' });

    return () => {
      performanceMonitor.endOperation('landingPageLoad');
      performanceMonitor.dispose();
    };
  }, []);

  const handleJoinEvent = async (code: string) => {
    setLoading(true);
    performanceMonitor.startOperation('joinEvent');

    try {
      const event = await eventService.getEventByCode(code);
      
      // Announce for screen readers
      announceMessage(`Joining event ${event.name}`);

      analyticsService.trackEvent('event_join_attempt', {
        method: 'code',
        eventId: event.id,
        success: true,
        duration: performanceMonitor.getMetrics().responseTime
      });

      router.push(`/events/${event.id}/queue`);
    } catch (error) {
      showToast({
        title: "Error",
        description: "Invalid event code. Please try again.",
        variant: "destructive"
      });

      // Announce error for screen readers
      announceMessage('Error joining event. Invalid code.');

      analyticsService.trackEvent('event_join_attempt', {
        method: 'code',
        code,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      performanceMonitor.trackError('joinEvent');
    } finally {
      setLoading(false);
      performanceMonitor.endOperation('joinEvent');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className="min-h-screen bg-gradient-to-b from-[#1E1E1E] to-[#2E2F2E]"
    >
      <div className="container mx-auto px-4 py-8 md:py-16">
        <div className="max-w-md mx-auto space-y-8">
          {/* Hero Section */}
          <div className="text-center space-y-4">
            <h1 className="text-4xl md:text-5xl font-bold text-white">
              OneSong
            </h1>
            <p className="text-lg text-white/80">
              Join the party, request your song
            </p>
          </div>

          {/* Join Event Card */}
          <Card className="p-6 bg-white/5 backdrop-blur-sm border border-white/10">
            <h2 className="text-2xl font-bold text-white mb-6 text-center">
              Join an Event
            </h2>
            
            <JoinEventForm 
              onSubmit={handleJoinEvent}
              disabled={loading}
            />

            {loading && (
              <div className="mt-4">
                <StatusIndicator
                  type="loading"
                  message="Joining event..."
                />
              </div>
            )}
            
            <div className="mt-6 pt-6 border-t border-white/10">
              <Button
                variant="secondary"
                className="w-full bg-white/5 hover:bg-white/10 text-white"
                onClick={() => {
                  setShowNearbyEvents(!showNearbyEvents);
                  analyticsService.trackEvent('nearby_events_toggled', {
                    action: showNearbyEvents ? 'hide' : 'show'
                  });
                }}
                aria-expanded={showNearbyEvents}
              >
                {showNearbyEvents ? 'Hide Nearby Events' : 'Show Nearby Events'}
              </Button>
            </div>
          </Card>

          {/* Nearby Events Section */}
          <AnimatePresence>
            {showNearbyEvents && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
              >
                <NearbyEvents />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Features Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-white/80">
            <Card className="p-4 bg-white/5 backdrop-blur-sm border border-white/10">
              <h3 className="font-semibold mb-2">Request Songs</h3>
              <p className="text-sm">Choose your favorite tracks and add them to the queue</p>
            </Card>
            <Card className="p-4 bg-white/5 backdrop-blur-sm border border-white/10">
              <h3 className="font-semibold mb-2">Real-time Updates</h3>
              <p className="text-sm">See the queue update instantly as songs are added</p>
            </Card>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { QueueManager } from '../queue/QueueManager';
import { RequestList } from '../requests/RequestList';
import { AnalyticsPanel } from '@/components/analytics/AnalyticsPanel';
import { EventSettings } from './settings/EventSettings';
import { useEventData } from '@/hooks/useEventData';
import { 
  ListMusic, 
  MessageSquare, 
  BarChart,
  Settings,
  Users 
} from 'lucide-react';
import type { Event } from '@/types/models';

interface DJDashboardProps {
  eventId: string;
}

export function Dashboard({ eventId }: DJDashboardProps) {
  const { event, isLoading, updateEvent } = useEventData(eventId);
  const [activeTab, setActiveTab] = useState('queue');

  if (isLoading || !event) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="min-h-screen bg-[#1E1E1E]">
      <header className="fixed top-0 left-0 right-0 h-[60px] bg-[#1E1E1E] border-b border-white/10 z-50">
        <div className="container h-full flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h1 className="text-xl font-bold text-white">{event.details.name}</h1>
            <Badge variant="secondary" className="bg-[#2E2F2E]">
              {event.details.status}
            </Badge>
          </div>
          <div className="flex items-center space-x-2">
            <div className="flex items-center space-x-1 text-gray-400">
              <Users size={16} />
              <span>{event.stats.attendeeCount}</span>
            </div>
          </div>
        </div>
      </header>

      <div className="pt-[60px] container">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <div className="sticky top-[60px] bg-[#1E1E1E] border-b border-white/10 z-40">
            <TabsList className="p-0">
              <TabsTrigger value="queue" className="flex items-center space-x-2">
                <ListMusic size={16} />
                <span>Queue</span>
              </TabsTrigger>
              <TabsTrigger value="requests" className="flex items-center space-x-2">
                <MessageSquare size={16} />
                <span>Requests</span>
              </TabsTrigger>
              <TabsTrigger value="analytics" className="flex items-center space-x-2">
                <BarChart size={16} />
                <span>Analytics</span>
              </TabsTrigger>
              <TabsTrigger value="settings" className="flex items-center space-x-2">
                <Settings size={16} />
                <span>Settings</span>
              </TabsTrigger>
            </TabsList>
          </div>

          <div className="py-6">
            <TabsContent value="queue">
              <QueueManager eventId={eventId} />
            </TabsContent>
            <TabsContent value="requests">
              <RequestList eventId={eventId} />
            </TabsContent>
            <TabsContent value="analytics">
              <AnalyticsPanel eventId={eventId} />
            </TabsContent>
            <TabsContent value="settings">
              <EventSettings event={event} onUpdate={updateEvent} />
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="min-h-screen bg-[#1E1E1E] animate-pulse">
      <div className="h-[60px] bg-[#2E2F2E]" />
      <div className="container py-6">
        <div className="h-10 bg-[#2E2F2E] rounded-lg w-[200px] mb-6" />
        <div className="grid gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 bg-[#2E2F2E] rounded-lg" />
          ))}
        </div>
      </div>
    </div>
  );
} 
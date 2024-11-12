import { useState } from 'react';
import { useEventData } from '@/hooks/useEventData';
import { QueueManager } from '../queue/QueueManager';
import { RequestManager } from '../requests/RequestManager';
import { AnalyticsPanel } from '../analytics/AnalyticsPanel';
import { ResponsiveContainer } from '../ui/ResponsiveContainer';
import { NavItem } from '../ui/NavItem';
import { QueueIcon, RequestIcon, AnalyticsIcon } from 'lucide-react';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { cn } from '@/lib/utils';

interface DJDashboardProps {
  eventId: string;
}

export const DJDashboard: React.FC<DJDashboardProps> = ({ eventId }) => {
  const [activeView, setActiveView] = useState<'queue' | 'requests' | 'analytics'>('queue');
  const { event, requests, queue } = useEventData(eventId);
  const isMobile = useMediaQuery('(max-width: 768px)');

  const handleViewChange = (view: typeof activeView) => {
    setActiveView(view);
  };

  return (
    <ResponsiveContainer maxWidth="2xl" className="min-h-screen">
      <div className={cn(
        'grid gap-4',
        isMobile ? 'grid-cols-1' : 'grid-cols-12'
      )}>
        {/* Navigation */}
        <nav
          className={cn(
            'flex space-x-2 md:space-x-0 md:space-y-2',
            isMobile ? 'col-span-1 overflow-x-auto pb-2' : 'col-span-2 flex-col'
          )}
          role="navigation"
          aria-label="Main navigation"
        >
          <NavItem
            active={activeView === 'queue'}
            onClick={() => handleViewChange('queue')}
            icon={<QueueIcon aria-hidden="true" />}
            label="Queue"
            aria-current={activeView === 'queue' ? 'page' : undefined}
          />
          <NavItem
            active={activeView === 'requests'}
            onClick={() => handleViewChange('requests')}
            icon={<RequestIcon aria-hidden="true" />}
            label="Requests"
            aria-current={activeView === 'requests' ? 'page' : undefined}
          />
          <NavItem
            active={activeView === 'analytics'}
            onClick={() => handleViewChange('analytics')}
            icon={<AnalyticsIcon aria-hidden="true" />}
            label="Analytics"
            aria-current={activeView === 'analytics' ? 'page' : undefined}
          />
        </nav>

        {/* Main Content */}
        <main
          className={cn(
            'bg-background-light rounded-lg p-4',
            isMobile ? 'col-span-1' : 'col-span-10'
          )}
          role="main"
          aria-live="polite"
        >
          {activeView === 'queue' && (
            <section aria-label="Queue Management">
              <QueueManager 
                queue={queue} 
                onReorder={handleQueueReorder}
                aria-label="Song queue"
              />
            </section>
          )}
          {activeView === 'requests' && (
            <section aria-label="Request Management">
              <RequestManager
                requests={requests}
                onApprove={handleRequestApproval}
                onReject={handleRequestRejection}
                aria-label="Song requests"
              />
            </section>
          )}
          {activeView === 'analytics' && (
            <section aria-label="Analytics Dashboard">
              <AnalyticsPanel 
                eventId={eventId}
                aria-label="Event analytics"
              />
            </section>
          )}
        </main>
      </div>
    </ResponsiveContainer>
  );
}; 
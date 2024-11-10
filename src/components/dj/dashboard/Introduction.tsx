import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowRight, Music2, Users, Settings } from 'lucide-react';
import { useRouter } from 'next/router';

export function Introduction() {
  const router = useRouter();

  return (
    <Card className="p-6 space-y-6">
      <div className="space-y-2">
        <h2 className="text-2xl font-bold text-white">Welcome to OneSong</h2>
        <p className="text-gray-400">
          Get started with your DJ journey. Create events, manage song requests, and engage with your audience in real-time.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <FeatureCard
          icon={<Music2 className="w-6 h-6 text-[#F49620]" />}
          title="Create Events"
          description="Set up and manage your events with customizable settings"
        />
        <FeatureCard
          icon={<Users className="w-6 h-6 text-[#F49620]" />}
          title="Handle Requests"
          description="Manage song requests and keep your audience engaged"
        />
        <FeatureCard
          icon={<Settings className="w-6 h-6 text-[#F49620]" />}
          title="Real-time Analytics"
          description="Track performance and audience engagement metrics"
        />
      </div>

      <div className="flex justify-end">
        <Button 
          onClick={() => router.push('/events/create')}
          className="bg-[#F49620] hover:bg-[#FF7200] text-white"
        >
          Create Your First Event
          <ArrowRight className="ml-2 w-4 h-4" />
        </Button>
      </div>
    </Card>
  );
}

interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
}

function FeatureCard({ icon, title, description }: FeatureCardProps) {
  return (
    <div className="p-4 rounded-lg bg-[#2E2F2E] border border-white/10 hover:border-[#F49620]/20 transition-all">
      <div className="mb-3">{icon}</div>
      <h3 className="font-semibold text-white mb-1">{title}</h3>
      <p className="text-sm text-gray-400">{description}</p>
    </div>
  );
}

import { Music, Users, Radio, Sparkles, ThumbsUp, Clock } from "lucide-react";
import { Card, } from "../ui/card";
import { cn } from "@/lib/utils";

const features = [
  {
    name: 'Real-Time Requests',
    description: 'Request your favorite songs during live events with instant updates and voting',
    icon: Music,
    delay: 0
  },
  {
    name: 'Interactive Events',
    description: 'Join events easily with unique codes or QR scanning, and connect with the crowd',
    icon: Users,
    delay: 100
  },
  {
    name: 'DJ Controls',
    description: 'Full control over your event playlist with real-time audience feedback',
    icon: Radio,
    delay: 200
  },
  {
    name: 'Smart Suggestions',
    description: 'Get personalized song recommendations based on crowd preferences',
    icon: Sparkles,
    delay: 300
  },
  {
    name: 'Live Voting',
    description: 'Let the crowd influence the playlist by voting on upcoming songs',
    icon: ThumbsUp,
    delay: 400
  },
  {
    name: 'Queue Management',
    description: 'Efficient playlist management with smart queuing and timing features',
    icon: Clock,
    delay: 500
  }
];

export function FeatureSection() {
  return (
    <div className="py-24 relative overflow-hidden">
      {/* Animated Background Pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:14px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />

      <div className="relative">
        {/* Section Header */}
        <div className="text-center space-y-4 mb-16">
          <h2 className={cn(
            "text-3xl font-bold tracking-tight",
            "bg-gradient-to-b from-foreground to-foreground/70 bg-clip-text text-transparent"
          )}>
            Everything you need for interactive music events
          </h2>
          <p className="text-muted-foreground max-w-[42rem] mx-auto leading-normal">
            Connect with your audience in real-time and create unforgettable experiences
            with our comprehensive set of features.
          </p>
        </div>

        {/* Features Grid */}
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <Card 
                key={feature.name}
                className={cn(
                  "group p-6 hover:bg-secondary/40 transition-all duration-300",
                  "hover:shadow-[0_0_20px_-3px_rgba(0,0,0,0.15)]",
                  "rounded-xl border border-muted",
                  "animate-in fade-in-50 slide-in-from-bottom-3",
                  "data-[state=open]:bg-secondary/40"
                )}
                style={{
                  animationDelay: `${feature.delay}ms`,
                  boxShadow: "0px 4px 12px rgba(0, 0, 0, 0.1)",
                }}
              >
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <div className={cn(
                      "h-12 w-12 rounded-xl bg-primary/15 flex items-center justify-center",
                      "transition-colors duration-300 group-hover:bg-primary/25"
                    )}>
                      <feature.icon className="h-6 w-6 text-primary" />
                    </div>
                    <h3 className="text-lg font-semibold tracking-tight">
                      {feature.name}
                    </h3>
                  </div>
                  <p className="text-muted-foreground leading-relaxed">
                    {feature.description}
                  </p>
                </div>

                {/* Hover Effect Overlay */}
                <div className={cn(
                  "absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100",
                  "transition-opacity duration-300",
                  "bg-gradient-to-br from-primary/5 via-transparent to-transparent"
                )} />
              </Card>
            ))}
          </div>

          {/* Bottom Gradient */}
          <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent" />
        </div>
      </div>
    </div>
  );
}
import React from 'react'
import { Music, Users, Radio, Lightbulb, ThumbsUp, ListMusic } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#292428] text-white/90">
      <div className="max-w-[1280px] mx-auto px-8 py-12">
        {/* Hero Section */}
        <header className="text-center mb-32">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-[#F49620]/10 mb-6">
            <Music className="w-6 h-6 text-[#F49620]" />
          </div>
          <h1 className="font-inter font-bold text-[48px] leading-[1.2] tracking-[-0.02em] text-[#F49620] mb-4">
            The Party Starts Here
          </h1>
          <p className="font-inter text-[18px] leading-[1.5] text-white/60 max-w-2xl mx-auto mb-12">
            Connect with the DJ Live and shape the playlist in real-time. Request
            your favorite songs and be more a part of the party.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4 max-w-md mx-auto">
            <Button 
              className="rounded-lg px-4 py-6 font-medium transition-all duration-200 bg-[#F49620] hover:bg-[#FF7200] active:bg-[#E08010] disabled:bg-[#3E2E1B] text-white w-full flex items-center gap-2"
            >
              <Users className="w-5 h-5" />
              <div className="flex flex-col items-start text-left">
                <span className="text-sm font-semibold">Join an Event</span>
                <span className="text-xs text-white/60">Request songs and vote on the playlist</span>
              </div>
            </Button>
            <Button 
              variant="outline"
              className="rounded-lg px-4 py-6 font-medium transition-all duration-200 border-2 border-[#F49620] text-[#F49620] hover:bg-[#F49620]/10 active:bg-[#F49620]/20 w-full flex items-center gap-2"
            >
              <Radio className="w-5 h-5" />
              <div className="flex flex-col items-start text-left">
                <span className="text-sm font-semibold">Login as DJ</span>
                <span className="text-xs text-white/60">Manage your events and control the music</span>
              </div>
            </Button>
          </div>
        </header>

        {/* Features Section */}
        <section className="text-center mb-16">
          <h2 className="font-inter font-bold text-[32px] leading-[1.2] tracking-[-0.02em] text-white mb-4">
            Everything you need for interactive music events
          </h2>
          <p className="font-inter text-[16px] leading-[1.5] text-white/60 max-w-2xl mx-auto mb-16">
            Connect with your audience in real-time and create unforgettable experiences with our
            comprehensive set of features.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: <Music className="w-6 h-6" />,
                title: 'Real-Time Requests',
                description: 'Request your favorite songs during live events with instant updates and voting'
              },
              {
                icon: <Users className="w-6 h-6" />,
                title: 'Interactive Events',
                description: 'Join events easily with unique codes or QR scanning, and connect with the crowd'
              },
              {
                icon: <Radio className="w-6 h-6" />,
                title: 'DJ Controls',
                description: 'Full control over your event playlist with real-time audience feedback'
              },
              {
                icon: <Lightbulb className="w-6 h-6" />,
                title: 'Smart Suggestions',
                description: 'Get personalized song recommendations based on crowd preferences'
              },
              {
                icon: <ThumbsUp className="w-6 h-6" />,
                title: 'Live Voting',
                description: 'Let the crowd influence the playlist by voting on upcoming songs'
              },
              {
                icon: <ListMusic className="w-6 h-6" />,
                title: 'Queue Management',
                description: 'Efficient playlist management with smart queuing and timing features'
              }
            ].map((feature, index) => (
              <Card 
                key={index} 
                className="bg-gradient-to-b from-[#1E1E1E] to-[#2E2F2E] rounded-xl p-6 transition-all duration-200 hover:scale-105 text-left"
              >
                <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-[#F49620]/10 mb-4">
                  <div className="text-[#F49620]">{feature.icon}</div>
                </div>
                <h3 className="font-inter font-bold text-[20px] leading-[1.2] tracking-[-0.02em] text-white mb-2">
                  {feature.title}
                </h3>
                <p className="font-inter text-[14px] leading-[1.5] text-white/60">
                  {feature.description}
                </p>
              </Card>
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}
import { AnimatedStat } from "./animated-stat";

export function HeroSection() {
  return (
    <section className="relative overflow-hidden">
      {/* Gradient Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-primary/10 via-background to-background" />
      
      <div className="container mx-auto px-4 py-24 relative">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight">
            <span className="text-gradient-primary">Transform</span> Your DJ Experience
          </h1>
          
          <p className="text-xl md:text-2xl text-muted-foreground">
            Real-time song requests, seamless queue management, 
            <br className="hidden md:block" />
            all in one powerful platform.
          </p>
          
          {/* Animated Stats */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-8 py-12">
            <AnimatedStat value="10K+" label="Active DJs" />
            <AnimatedStat value="1M+" label="Songs Played" />
            <AnimatedStat value="98%" label="Satisfaction" />
          </div>
        </div>
      </div>
      
      {/* Decorative Elements */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-0 w-72 h-72 bg-primary/30 rounded-full filter blur-3xl" />
        <div className="absolute top-1/2 right-0 w-72 h-72 bg-primary/20 rounded-full filter blur-3xl" />
      </div>
    </section>
  );
} 
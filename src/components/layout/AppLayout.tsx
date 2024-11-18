'use client';

import { useState, useEffect } from 'react';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { Navigation } from '@/components/navigation/Navigation';
import { Button } from '@/components/ui/button';
import { Menu, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const isMobile = useMediaQuery('(max-width: 768px)');

  useEffect(() => {
    if (isMobile) {
      setIsCollapsed(true);
    }
  }, [isMobile]);

  return (
    <div className="relative min-h-screen">
      {/* Mobile Navigation Toggle */}
      {isMobile && (
        <Button
          variant="ghost"
          size="icon"
          className="fixed top-4 left-4 z-50"
          onClick={() => setIsMobileOpen(!isMobileOpen)}
        >
          {isMobileOpen ? <X /> : <Menu />}
        </Button>
      )}

      {/* Navigation Sidebar */}
      <div className={cn(
        "fixed top-0 left-0 z-40 h-full w-[240px] border-r bg-background transition-all duration-300",
        isCollapsed && !isMobileOpen && "w-[70px]",
        isMobile && !isMobileOpen && "-translate-x-full"
      )}>
        <Navigation isCollapsed={isCollapsed && !isMobileOpen} />
        
        {!isMobile && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute bottom-4 right-4"
            onClick={() => setIsCollapsed(!isCollapsed)}
          >
            <Menu />
          </Button>
        )}
      </div>

      {/* Main Content */}
      <main className={cn(
        "transition-all duration-300",
        !isCollapsed && !isMobile && "ml-[240px]",
        isCollapsed && !isMobile && "ml-[70px]"
      )}>
        <div className="container mx-auto p-4">
          {children}
        </div>
      </main>
    </div>
  );
} 
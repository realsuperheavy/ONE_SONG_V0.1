'use client';

import { useState } from 'react';
import { Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Music2, Radio, List, BarChart2, User, Settings, LogOut } from 'lucide-react';

interface MobileNavigationProps {
  className?: string;
}

export function MobileNavigation({ className }: MobileNavigationProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className={cn('lg:hidden', className)}>
      {/* Hamburger Button - Increased touch target */}
      <Button
        variant="ghost"
        className="touch-target p-3"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-controls="mobile-menu"
      >
        {isOpen ? (
          <X className="h-6 w-6" aria-hidden="true" />
        ) : (
          <Menu className="h-6 w-6" aria-hidden="true" />
        )}
        <span className="sr-only">
          {isOpen ? 'Close menu' : 'Open menu'}
        </span>
      </Button>

      {/* Mobile Menu */}
      <div
        id="mobile-menu"
        className={cn(
          'fixed inset-0 z-50 bg-background/95 backdrop-blur-sm',
          'transform transition-transform duration-300 ease-in-out',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <nav className="h-full p-6 touch-spacing">
          {/* Navigation Items - Properly spaced for touch */}
          <div className="space-y-4">
            {/* Primary Navigation */}
            <div className="space-y-2">
              <a
                href="/dashboard"
                className="flex items-center p-3 rounded-lg hover:bg-background/10 touch-target"
                aria-current={pathname === '/dashboard' ? 'page' : undefined}
              >
                <Music2 className="w-5 h-5 mr-3 text-[#F49620]" />
                <span>Dashboard</span>
              </a>

              <a
                href="/events"
                className="flex items-center p-3 rounded-lg hover:bg-background/10 touch-target"
                aria-current={pathname === '/events' ? 'page' : undefined}
              >
                <Radio className="w-5 h-5 mr-3 text-[#F49620]" />
                <span>Events</span>
              </a>

              <a
                href="/requests"
                className="flex items-center p-3 rounded-lg hover:bg-background/10 touch-target"
                aria-current={pathname === '/requests' ? 'page' : undefined}
              >
                <List className="w-5 h-5 mr-3 text-[#F49620]" />
                <span>Requests</span>
              </a>

              <a
                href="/analytics"
                className="flex items-center p-3 rounded-lg hover:bg-background/10 touch-target"
                aria-current={pathname === '/analytics' ? 'page' : undefined}
              >
                <BarChart2 className="w-5 h-5 mr-3 text-[#F49620]" />
                <span>Analytics</span>
              </a>
            </div>

            {/* Secondary Navigation */}
            <div className="pt-4 border-t border-white/10">
              <a
                href="/profile"
                className="flex items-center p-3 rounded-lg hover:bg-background/10 touch-target"
                aria-current={pathname === '/profile' ? 'page' : undefined}
              >
                <User className="w-5 h-5 mr-3 text-[#F49620]" />
                <span>Profile</span>
              </a>

              <a
                href="/settings"
                className="flex items-center p-3 rounded-lg hover:bg-background/10 touch-target"
                aria-current={pathname === '/settings' ? 'page' : undefined}
              >
                <Settings className="w-5 h-5 mr-3 text-[#F49620]" />
                <span>Settings</span>
              </a>

              <button
                onClick={signOut}
                className="flex items-center w-full p-3 rounded-lg hover:bg-background/10 touch-target text-left"
              >
                <LogOut className="w-5 h-5 mr-3 text-[#F49620]" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        </nav>
      </div>
    </div>
  );
} 
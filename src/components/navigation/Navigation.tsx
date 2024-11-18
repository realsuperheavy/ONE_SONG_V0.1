'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { navigationConfig } from '@/config/navigation';
import { useAuthStore } from '@/store/auth';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';

interface NavigationProps {
  isCollapsed?: boolean;
  isMobile?: boolean;
}

export function Navigation({ isCollapsed, isMobile }: NavigationProps) {
  const pathname = usePathname();
  const { user } = useAuthStore();

  const navItems = [...navigationConfig.main, ...navigationConfig.secondary]
    .filter(item => {
      if (item.requiresAuth && !user) return false;
      if (item.roles && !item.roles.includes((user as any)?.type || '')) return false;
      return true;
    });

  return (
    <ScrollArea className="h-full py-2">
      <div className="space-y-1 p-2">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center gap-x-2 rounded-lg px-3 py-2 text-sm font-medium",
              "hover:bg-accent hover:text-accent-foreground",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              pathname === item.href && "bg-accent text-accent-foreground",
              isCollapsed && "justify-center"
            )}
          >
            <item.icon className={cn(
              "h-5 w-5",
              isCollapsed ? "w-5 h-5" : "w-4 h-4"
            )} />
            {!isCollapsed && <span>{item.label}</span>}
          </Link>
        ))}
      </div>
    </ScrollArea>
  );
} 
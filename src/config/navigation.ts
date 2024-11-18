import { Music2, Radio, List, BarChart2, User, Settings } from 'lucide-react';
import { type NavItem } from '../types/navigation';

export const navigationConfig: Record<'main' | 'secondary', NavItem[]> = {
  main: [
    {
      label: 'Dashboard',
      href: '/dashboard',
      icon: Music2,
      requiresAuth: true
    },
    {
      label: 'Events',
      href: '/events',
      icon: Radio,
      requiresAuth: true
    },
    {
      label: 'Requests',
      href: '/requests',
      icon: List,
      requiresAuth: true
    },
    {
      label: 'Analytics',
      href: '/analytics',
      icon: BarChart2,
      requiresAuth: true,
      roles: ['dj']
    }
  ],
  secondary: [
    {
      label: 'Profile',
      href: '/profile',
      icon: User,
      requiresAuth: true
    },
    {
      label: 'Settings',
      href: '/settings',
      icon: Settings,
      requiresAuth: true
    }
  ]
}; 
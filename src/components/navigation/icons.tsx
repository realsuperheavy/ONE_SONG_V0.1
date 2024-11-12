import Link from 'next/link';

export { Menu as MenuIcon, X as CloseIcon, Sun as SunIcon, Moon as MoonIcon } from 'lucide-react';

export function Logo() {
  return <div className="text-xl font-bold">OneSong</div>;
}

export function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link 
      href={href}
      className="text-sm font-medium transition-colors hover:text-primary"
    >
      {children}
    </Link>
  );
} 
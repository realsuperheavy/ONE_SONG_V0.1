import { useState } from 'react';
import { ANIMATIONS, EFFECTS } from '@/design/tokens';
import { useTheme } from '@/providers/ThemeProvider';
import { Button } from '../ui/Button';

export const MobileNav: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();

  return (
    <>
      <Button
        variant="ghost"
        className="md:hidden"
        onClick={() => setIsOpen(true)}
        aria-label="Open menu"
      >
        <MenuIcon className="h-6 w-6" />
      </Button>

      {isOpen && (
        <div
          className={`
            fixed inset-0 z-50
            ${EFFECTS.glass}
            ${ANIMATIONS.transitions.default}
          `}
        >
          <div className="h-full w-[80vw] max-w-sm bg-background p-6">
            <div className="flex justify-between items-center mb-8">
              <Logo />
              <Button
                variant="ghost"
                onClick={() => setIsOpen(false)}
                aria-label="Close menu"
              >
                <CloseIcon className="h-6 w-6" />
              </Button>
            </div>

            <nav className="space-y-6">
              <NavLink href="/dashboard">Dashboard</NavLink>
              <NavLink href="/events">Events</NavLink>
              <NavLink href="/requests">Requests</NavLink>
              <NavLink href="/analytics">Analytics</NavLink>
            </nav>

            <div className="mt-auto pt-8">
              <Button onClick={toggleTheme} variant="ghost">
                {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}; 
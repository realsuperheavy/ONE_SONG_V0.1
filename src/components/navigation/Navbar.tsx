import { useStore } from '@/store';
import { Button } from '@/components/ui/Button';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { UserMenu } from '@/components/user/UserMenu';

export const Navbar = () => {
  const user = useStore(state => state.user);

  return (
    <nav className="fixed top-0 left-0 right-0 h-[60px] bg-background border-b border-border z-50">
      <div className="h-full px-4 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Logo />
          {user && <EventSelector />}
        </div>
        
        <div className="flex items-center space-x-4">
          <ThemeToggle />
          {user ? (
            <UserMenu user={user} />
          ) : (
            <Button variant="primary" href="/login">
              Sign In
            </Button>
          )}
        </div>
      </div>
    </nav>
  );
}; 
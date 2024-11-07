import { SPACING, GRID } from '@/design/tokens';
import { Header } from './Header';
import { Footer } from './Footer';
import { Sidebar } from './Sidebar';

interface BaseLayoutProps {
  children: React.ReactNode;
  showSidebar?: boolean;
}

export const BaseLayout: React.FC<BaseLayoutProps> = ({ 
  children, 
  showSidebar = false 
}) => {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />
      
      <main className={SPACING.layout.container}>
        <div className={showSidebar ? GRID.dashboard.layout : ''}>
          {showSidebar && (
            <aside className={GRID.dashboard.sidebar}>
              <Sidebar />
            </aside>
          )}
          
          <div className={showSidebar ? GRID.dashboard.main : 'w-full'}>
            {children}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}; 
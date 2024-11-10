import { ReactNode } from 'react';
import { ThemeProvider } from '@/providers/ThemeProvider';
import { Navbar } from '@/components/navigation/Navbar';
import { Sidebar } from '@/components/navigation/Sidebar';
import { useStore } from '@/store';

interface MainLayoutProps {
  children: ReactNode;
  showSidebar?: boolean;
}

export const MainLayout = ({ children, showSidebar = true }: MainLayoutProps) => {
  const theme = useStore(state => state.theme);

  return (
    <ThemeProvider theme={theme}>
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex">
          {showSidebar && <Sidebar />}
          <main className={`flex-1 p-6 ${showSidebar ? 'ml-[280px]' : ''}`}>
            {children}
          </main>
        </div>
      </div>
    </ThemeProvider>
  );
}; 
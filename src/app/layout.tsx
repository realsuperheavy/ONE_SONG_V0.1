import { ThemeProvider } from '@/providers/ThemeProvider';
import { Inter } from 'next/font/google';
import './globals.css';
import { useEffect } from 'react';
import { registerServiceWorker } from '@/lib/serviceWorker/register';

const inter = Inter({ subsets: ['latin'] });

export default function RootLayout({
  children,
}: {
  children: any;
}) {
  useEffect(() => {
    registerServiceWorker();
  }, []);

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          src="https://sdk.scdn.co/spotify-player.js"
          async
        />
      </head>
      <body className={inter.className}>
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
} 
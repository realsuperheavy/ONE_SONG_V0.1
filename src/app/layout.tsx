import { FirebaseProvider } from '@/lib/firebase/FirebaseContext';
import { AuthProvider } from '@/components/auth/AuthProvider';
import { SpotifyProvider } from '@/lib/spotify/SpotifyContext';
import './globals.css';

export const metadata = {
  title: 'OneSong',
  description: 'Real-time DJ song request platform',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <FirebaseProvider>
          <AuthProvider>
            <SpotifyProvider>
              {children}
            </SpotifyProvider>
          </AuthProvider>
        </FirebaseProvider>
      </body>
    </html>
  );
} 
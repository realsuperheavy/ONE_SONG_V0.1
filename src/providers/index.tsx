'use client';

import { PropsWithChildren } from 'react';
import { AuthProvider } from './auth-provider';
import { ServiceProvider } from './service-provider';
import { FirebaseProvider } from './firebase-provider';

export function Providers({ children }: PropsWithChildren) {
  return (
    <FirebaseProvider>
      <AuthProvider>
        <ServiceProvider>
          {children}
        </ServiceProvider>
      </AuthProvider>
    </FirebaseProvider>
  );
} 
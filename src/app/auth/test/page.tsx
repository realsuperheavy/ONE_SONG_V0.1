'use client';

import React, { useEffect } from 'react';
import { useAuthStore } from '@/store/auth';
import { AuthForm } from '@/components/auth/AuthForm';
import { useRouter } from 'next/navigation';
import { useFirebase } from '@/lib/firebase/FirebaseContext';

export default function TestAuthPage() {
  const router = useRouter();
  const { auth } = useFirebase();
  const { user, setUser } = useAuthStore();

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((firebaseUser) => {
      if (firebaseUser) {
        setUser({
          id: firebaseUser.uid,
          email: firebaseUser.email!,
          type: 'user',
          settings: {
            theme: 'light',
            notifications: true,
            language: 'en'
          },
          stats: {
            eventsCreated: 0,
            requestsMade: 0,
            tipsGiven: 0
          },
          profile: {
            displayName: firebaseUser.displayName || firebaseUser.email!.split('@')[0],
            email: firebaseUser.email!,
            photoURL: firebaseUser.photoURL
          },
          createdAt: new Date().toISOString()
        });
      } else {
        setUser(null);
      }
    });

    return () => unsubscribe();
  }, [auth, setUser]);

  const handleAuthSuccess = () => {
    router.push('/dashboard');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Auth Test Page
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            {user ? `Logged in as ${user.email}` : 'Not logged in'}
          </p>
        </div>

        <AuthForm 
          mode="login"
          onSuccess={handleAuthSuccess}
        />
      </div>
    </div>
  );
}
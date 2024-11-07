'use client';

import { useEffect } from 'react';
import { useAuthStore } from '@/store/auth';

export default function TestAuth() {
  const { user, loading } = useAuthStore();

  useEffect(() => {
    console.log('Auth State:', { user, loading });
  }, [user, loading]);

  return (
    <div className="p-4">
      <h1>Auth Test Page</h1>
      <pre>{JSON.stringify({ user, loading }, null, 2)}</pre>
    </div>
  );
}

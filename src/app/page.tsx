'use client';

import React from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black text-white">
      <main className="container mx-auto px-4 py-16">
        <div className="text-center">
          <h1 className="text-6xl font-bold mb-4">
            One<span className="text-purple-500">Song</span>
          </h1>
          <p className="text-xl text-gray-300 mb-8">
            Connect DJs and audiences through music
          </p>
          
          <div className="space-y-4">
            <button 
              onClick={() => router.push('/auth/register?type=dj')}
              className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-6 rounded-full transition-colors"
            >
              Join as DJ
            </button>
            <div className="inline-block mx-4">or</div>
            <button 
              onClick={() => router.push('/auth/register?type=guest')}
              className="bg-transparent border-2 border-purple-600 hover:bg-purple-600/10 text-white font-bold py-2 px-6 rounded-full transition-colors"
            >
              Join as Guest
            </button>
          </div>
        </div>
      </main>
    </div>
  );
} 
'use client';

import { AuthForm } from '@/components/auth/AuthForm';
import { useRouter } from 'next/navigation';
import { FC } from 'react';

const RegisterPage: FC = () => {
  const router = useRouter();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Create your account
          </h2>
        </div>
        <AuthForm 
          mode="register" 
          onSuccess={() => router.push('/dashboard')} 
        />
      </div>
    </div>
  );
}

export default RegisterPage;

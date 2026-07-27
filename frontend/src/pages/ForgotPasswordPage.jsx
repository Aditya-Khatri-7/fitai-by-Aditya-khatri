import React from 'react';
import { ForgotPassword } from '../components/forgot-password/ForgotPassword';

export function ForgotPasswordPage() {
  return (
    <div className="min-h-screen bg-[var(--bg-primary)] p-6 text-[var(--text-primary)] flex items-center justify-center font-sans transition-colors">
      <div className="w-full max-w-md">
        <ForgotPassword />
      </div>
    </div>
  );
}

import React from 'react';
import { ResetPassword } from '../components/forgot-password/ResetPassword';

export function ResetPasswordPage() {
  return (
    <div className="min-h-screen bg-[var(--bg-primary)] p-6 text-[var(--text-primary)] flex items-center justify-center font-sans transition-colors">
      <div className="w-full max-w-md">
        <ResetPassword />
      </div>
    </div>
  );
}

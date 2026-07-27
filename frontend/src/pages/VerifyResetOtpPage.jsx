import React from 'react';
import { VerifyResetOtp } from '../components/forgot-password/VerifyResetOtp';

export function VerifyResetOtpPage() {
  return (
    <div className="min-h-screen bg-[var(--bg-primary)] p-6 text-[var(--text-primary)] flex items-center justify-center font-sans transition-colors">
      <div className="w-full max-w-md">
        <VerifyResetOtp />
      </div>
    </div>
  );
}

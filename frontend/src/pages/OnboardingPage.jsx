import React from 'react';
import { GamifiedOnboarding } from '../components/profile/GamifiedOnboarding';
import { ThemeSwitcher } from '../components/ui/ThemeSwitcher';

export function OnboardingPage() {
  return (
    <div className="min-h-screen bg-[var(--bg-primary)] p-6 text-[var(--text-primary)] flex items-center justify-center font-sans transition-colors">
      <GamifiedOnboarding />
      <ThemeSwitcher />
    </div>
  );
}

import React from 'react';
import { useSelector } from 'react-redux';
import { DashboardLayout } from '../components/layout/DashboardLayout';
import { CoachScene } from '../three/CoachScene';
import { CoachChat } from '../components/ai-coach/CoachChat';
import { AIExplanation } from '../components/ai-coach/AIExplanation';

export function AICoachPage() {
  const { isSpeaking, isThinking } = useSelector(state => state.ai);

  return (
    <DashboardLayout>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {/* Left 3D Canvas & Explanation */}
        <div className="space-y-6">
          <CoachScene height="420px" isSpeaking={isSpeaking} isThinking={isThinking} />
          <AIExplanation />
        </div>

        {/* Right Chat Interface */}
        <div className="h-full">
          <CoachChat />
        </div>
      </div>
    </DashboardLayout>
  );
}

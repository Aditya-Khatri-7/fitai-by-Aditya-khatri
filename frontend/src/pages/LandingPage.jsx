import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { loginUser } from '../redux/slices/authSlice';
import { DEMO_CREDENTIALS } from '../data/demoCredentials';
import { CoachScene } from '../three/CoachScene';
import { Flame, Sparkles, ArrowRight, Play } from 'lucide-react';
import toast from 'react-hot-toast';

export function LandingPage() {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const launchDemo = async (key) => {
    const demo = DEMO_CREDENTIALS[key];
    const result = await dispatch(loginUser({ email: demo.email, password: demo.password }));
    if (loginUser.fulfilled.match(result)) {
      toast.success(`Welcome, ${result.payload.user.name}!`);
      navigate('/dashboard');
    } else {
      toast.error(result.payload || 'Could not start demo — try the Login page.');
    }
  };

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] font-sans selection:bg-[var(--accent-primary)] selection:text-black transition-colors duration-300">
      {/* Top Header */}
      <header className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between border-b border-[var(--border-color)]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[var(--accent-primary)] text-slate-950 flex items-center justify-center font-black shadow-lg shadow-[var(--accent-glow)]">
            <Flame className="w-6 h-6 fill-current" />
          </div>
          <span className="text-2xl font-extrabold tracking-tight text-[var(--text-primary)]">
            FitAI
          </span>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/login')}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
          >
            Log In
          </button>
          <button
            onClick={() => launchDemo('raj')}
            className="px-5 py-2.5 rounded-xl bg-[var(--accent-primary)] text-slate-950 hover:opacity-90 font-bold text-xs shadow-lg shadow-[var(--accent-glow)] transition-all flex items-center gap-1.5"
          >
            <Sparkles className="w-4 h-4" /> Try Live Demo Mode
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-6 py-16 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        <div className="space-y-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[var(--accent-glow)] border border-[var(--border-color)] text-[var(--accent-primary)] text-xs font-bold">
            <Sparkles className="w-4 h-4 animate-pulse" /> AI-POWERED ADAPTIVE FITNESS INTELLIGENCE
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-tight">
            Your Fitness Coach That <span className="text-[var(--accent-primary)]">Rethinks Every Day</span>
          </h1>

          <p className="text-[var(--text-secondary)] text-base leading-relaxed">
            FitAI continuous-learns from wearable biometric telemetry, adapts training for active injuries and chronic medical conditions, plans custom DASH/low-glycemic nutrition, and coaches you through an interactive 3D AI avatar.
          </p>

          <div className="flex flex-wrap gap-4 pt-2">
            <button
              onClick={() => launchDemo('raj')}
              className="px-6 py-3.5 rounded-xl bg-[var(--accent-primary)] text-slate-950 hover:opacity-90 font-extrabold text-sm shadow-xl transition-all flex items-center gap-2"
            >
              Explore Demo Experience <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => navigate('/register')}
              className="px-6 py-3.5 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-color)] text-[var(--text-primary)] hover:border-[var(--accent-primary)] font-bold text-sm transition-all"
            >
              Create Account
            </button>
          </div>
        </div>

        {/* 3D AI Coach Character Hero Preview */}
        <div className="relative">
          <CoachScene isSpeaking={false} height="440px" />
        </div>
      </section>

      {/* Preset Demo Profiles Section */}
      <section className="max-w-7xl mx-auto px-6 py-12 border-t border-[var(--border-color)] space-y-6">
        <div className="text-center space-y-2 max-w-2xl mx-auto">
          <h2 className="text-2xl font-extrabold text-[var(--text-primary)]">Select A Demo Scenario Profile</h2>
          <p className="text-xs text-[var(--text-secondary)]">Launch directly into pre-seeded clinical and adaptive scenarios — real accounts, real backend.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Raj */}
          <div className="p-6 rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border-color)] hover:border-[var(--accent-primary)] transition-all space-y-4 shadow-xl">
            <div className="flex items-center gap-3">
              <img src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=250&q=80" alt="Raj" className="w-12 h-12 rounded-full object-cover ring-2 ring-[var(--accent-primary)]" />
              <div>
                <h3 className="font-extrabold text-[var(--text-primary)] text-base">Raj Sharma</h3>
                <span className="text-xs text-[var(--accent-primary)] font-semibold">Muscle Gain • Knee Strain</span>
              </div>
            </div>
            <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
              Demonstrates automatic knee strain avoidance (swapping heavy barbell squats for machine leg press) and high-protein hypertrophy meal planning.
            </p>
            <button
              onClick={() => launchDemo('raj')}
              className="w-full py-2.5 rounded-xl bg-[var(--accent-glow)] hover:bg-[var(--accent-primary)] text-[var(--accent-primary)] hover:text-slate-950 font-bold text-xs border border-[var(--border-color)] transition-all flex items-center justify-center gap-1.5"
            >
              <Play className="w-3.5 h-3.5 fill-current" /> Launch Raj's Demo
            </button>
          </div>

          {/* Priya */}
          <div className="p-6 rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border-color)] hover:border-purple-500/50 transition-all space-y-4 shadow-xl">
            <div className="flex items-center gap-3">
              <img src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=250&q=80" alt="Priya" className="w-12 h-12 rounded-full object-cover ring-2 ring-purple-400" />
              <div>
                <h3 className="font-extrabold text-[var(--text-primary)] text-base">Priya Patel</h3>
                <span className="text-xs text-purple-400 font-semibold">Weight Loss • Hypertension</span>
              </div>
            </div>
            <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
              Demonstrates strict DASH low-sodium diet constraints (&lt;1400mg Na) and non-Valsalva moderate HIIT cardio workouts for blood pressure control.
            </p>
            <button
              onClick={() => launchDemo('priya')}
              className="w-full py-2.5 rounded-xl bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 font-bold text-xs border border-purple-500/30 transition-all flex items-center justify-center gap-1.5"
            >
              <Play className="w-3.5 h-3.5 fill-current" /> Launch Priya's Demo
            </button>
          </div>

          {/* Arjun */}
          <div className="p-6 rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border-color)] hover:border-emerald-500/50 transition-all space-y-4 shadow-xl">
            <div className="flex items-center gap-3">
              <img src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=250&q=80" alt="Arjun" className="w-12 h-12 rounded-full object-cover ring-2 ring-emerald-400" />
              <div>
                <h3 className="font-extrabold text-[var(--text-primary)] text-base">Arjun Mehta</h3>
                <span className="text-xs text-emerald-400 font-semibold">Marathon Training • Outdoor</span>
              </div>
            </div>
            <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
              Demonstrates high-volume endurance periodization, long-run carb loading, and low resting heart rate recovery analysis.
            </p>
            <button
              onClick={() => launchDemo('arjun')}
              className="w-full py-2.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 font-bold text-xs border border-emerald-500/30 transition-all flex items-center justify-center gap-1.5"
            >
              <Play className="w-3.5 h-3.5 fill-current" /> Launch Arjun's Demo
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="max-w-7xl mx-auto px-6 py-8 border-t border-[var(--border-color)] text-center text-xs text-[var(--text-secondary)]">
        FitAI — AI-Powered Adaptive Fitness Intelligence Platform • Academic Internship Demo Build
      </footer>
    </div>
  );
}

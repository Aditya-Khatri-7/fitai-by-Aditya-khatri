import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { loginUser } from '../redux/slices/authSlice';
import { DEMO_CREDENTIALS } from '../data/demoCredentials';
import { CoachScene } from '../three/CoachScene';
import { Flame, Sparkles, ArrowRight, Play, Zap, Brain, Shield } from 'lucide-react';
import toast from 'react-hot-toast';

const FEATURES = [
  { icon: Zap, label: 'Adaptive Training', desc: 'Plans evolve with your biometrics daily' },
  { icon: Brain, label: 'AI Medical Intake', desc: 'Adapts around injuries & chronic conditions' },
  { icon: Shield, label: 'Local-First AI', desc: 'ML recommender runs 100% offline' },
];

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

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-40 bg-[var(--bg-primary)]/95 backdrop-blur-md border-b border-[var(--border-color)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 sm:h-16 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-[var(--accent-primary)] text-slate-950 flex items-center justify-center font-black shadow-lg shadow-[var(--accent-glow)] shrink-0">
              <Flame className="w-4 h-4 sm:w-6 sm:h-6 fill-current" />
            </div>
            <span className="text-xl sm:text-2xl font-extrabold tracking-tight text-[var(--text-primary)]">FitAI</span>
          </div>

          {/* Nav actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate('/login')}
              className="px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl text-xs font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
            >
              Log In
            </button>
            <button
              onClick={() => launchDemo('raj')}
              className="flex items-center gap-1.5 px-3 py-1.5 sm:px-5 sm:py-2.5 rounded-xl bg-[var(--accent-primary)] text-slate-950 hover:opacity-90 font-bold text-xs shadow-lg shadow-[var(--accent-glow)] transition-all"
            >
              <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
              <span className="hidden sm:inline">Try Live Demo</span>
              <span className="sm:hidden">Demo</span>
            </button>
          </div>
        </div>
      </header>

      {/* ── Hero ───────────────────────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 pt-8 pb-6 lg:py-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-12 items-center">

          {/* Text block (always visible at top on mobile) */}
          <div className="space-y-4 lg:space-y-6 text-center lg:text-left">
            <div className="flex justify-center lg:justify-start">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[var(--accent-glow)] border border-[var(--border-color)] text-[var(--accent-primary)] text-[10px] sm:text-xs font-bold">
                <Sparkles className="w-3.5 h-3.5 animate-pulse shrink-0" />
                AI-POWERED ADAPTIVE FITNESS INTELLIGENCE
              </div>
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-extrabold tracking-tight leading-tight">
              Your Fitness Coach That{' '}
              <span className="text-[var(--accent-primary)]">Rethinks Every Day</span>
            </h1>

            {/* Full desc on desktop; shorter teaser on mobile */}
            <p className="hidden lg:block text-[var(--text-secondary)] text-base leading-relaxed">
              FitAI continuous-learns from wearable biometric telemetry, adapts training for active injuries and chronic medical conditions, plans custom DASH/low-glycemic nutrition, and coaches you through an interactive 3D AI avatar.
            </p>
            <p className="lg:hidden text-[var(--text-secondary)] text-sm leading-relaxed max-w-sm mx-auto lg:mx-0">
              Adapts to your injuries, biometrics, and goals — powered by a local ML engine and a 3D AI coach.
            </p>

            {/* CTAs on desktop */}
            <div className="hidden lg:flex flex-wrap gap-4 pt-2">
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

          {/* 3D Coach — responsive height so the bot is actually visible on mobile */}
          <div className="h-[300px] sm:h-[360px] lg:h-[440px] w-full">
            <CoachScene isSpeaking={false} height="100%" mini />
          </div>

          {/* CTAs on mobile — appear below the 3D scene, not above it */}
          <div className="lg:hidden flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => launchDemo('raj')}
              className="flex-1 px-5 py-3.5 rounded-xl bg-[var(--accent-primary)] text-slate-950 hover:opacity-90 font-extrabold text-sm shadow-xl transition-all flex items-center justify-center gap-2"
            >
              Explore Demo <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => navigate('/register')}
              className="flex-1 px-5 py-3.5 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-color)] text-[var(--text-primary)] hover:border-[var(--accent-primary)] font-bold text-sm transition-all text-center"
            >
              Create Account
            </button>
          </div>
        </div>
      </section>

      {/* ── Feature pills ──────────────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-4 border-t border-[var(--border-color)]">
        <div className="grid grid-cols-3 gap-3">
          {FEATURES.map(({ icon: Icon, label, desc }) => (
            <div key={label} className="flex flex-col items-center text-center gap-1.5 p-3 sm:p-4 rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border-color)]">
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-[var(--accent-glow)] border border-[var(--border-color)] flex items-center justify-center">
                <Icon className="w-4 h-4 text-[var(--accent-primary)]" />
              </div>
              <p className="text-[10px] sm:text-xs font-bold text-[var(--text-primary)] leading-tight">{label}</p>
              <p className="text-[9px] sm:text-[10px] text-[var(--text-tertiary)] leading-snug hidden sm:block">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Demo Profiles ──────────────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-12 border-t border-[var(--border-color)] space-y-5 sm:space-y-6">
        <div className="text-center space-y-1.5 max-w-2xl mx-auto">
          <h2 className="text-xl sm:text-2xl font-extrabold text-[var(--text-primary)]">Select A Demo Scenario Profile</h2>
          <p className="text-xs text-[var(--text-secondary)]">Launch directly into pre-seeded clinical and adaptive scenarios — real accounts, real backend.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Raj */}
          <div className="p-4 sm:p-6 rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border-color)] hover:border-[var(--accent-primary)] transition-all space-y-3 sm:space-y-4 shadow-xl">
            <div className="flex items-center gap-3">
              <img src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=250&q=80" alt="Raj" className="w-10 h-10 sm:w-12 sm:h-12 rounded-full object-cover ring-2 ring-[var(--accent-primary)] shrink-0" />
              <div className="min-w-0">
                <h3 className="font-extrabold text-[var(--text-primary)] text-sm sm:text-base truncate">Raj Sharma</h3>
                <span className="text-[10px] sm:text-xs text-[var(--accent-primary)] font-semibold">Muscle Gain • Knee Strain</span>
              </div>
            </div>
            <p className="text-[11px] sm:text-xs text-[var(--text-secondary)] leading-relaxed line-clamp-2 sm:line-clamp-none">
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
          <div className="p-4 sm:p-6 rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border-color)] hover:border-purple-500/50 transition-all space-y-3 sm:space-y-4 shadow-xl">
            <div className="flex items-center gap-3">
              <img src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=250&q=80" alt="Priya" className="w-10 h-10 sm:w-12 sm:h-12 rounded-full object-cover ring-2 ring-purple-400 shrink-0" />
              <div className="min-w-0">
                <h3 className="font-extrabold text-[var(--text-primary)] text-sm sm:text-base truncate">Priya Patel</h3>
                <span className="text-[10px] sm:text-xs text-purple-400 font-semibold">Weight Loss • Hypertension</span>
              </div>
            </div>
            <p className="text-[11px] sm:text-xs text-[var(--text-secondary)] leading-relaxed line-clamp-2 sm:line-clamp-none">
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
          <div className="p-4 sm:p-6 rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border-color)] hover:border-emerald-500/50 transition-all space-y-3 sm:space-y-4 shadow-xl">
            <div className="flex items-center gap-3">
              <img src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=250&q=80" alt="Arjun" className="w-10 h-10 sm:w-12 sm:h-12 rounded-full object-cover ring-2 ring-emerald-400 shrink-0" />
              <div className="min-w-0">
                <h3 className="font-extrabold text-[var(--text-primary)] text-sm sm:text-base truncate">Arjun Mehta</h3>
                <span className="text-[10px] sm:text-xs text-emerald-400 font-semibold">Marathon Training • Outdoor</span>
              </div>
            </div>
            <p className="text-[11px] sm:text-xs text-[var(--text-secondary)] leading-relaxed line-clamp-2 sm:line-clamp-none">
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

      {/* ── Footer ─────────────────────────────────────────────────────── */}
      <footer className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8 border-t border-[var(--border-color)] text-center text-[10px] sm:text-xs text-[var(--text-tertiary)]">
        FitAI — AI-Powered Adaptive Fitness Intelligence Platform • Academic Internship Demo Build
      </footer>
    </div>
  );
}

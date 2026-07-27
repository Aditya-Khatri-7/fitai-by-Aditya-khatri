import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { loginUser, clearAuthError } from '../redux/slices/authSlice';
import { DEMO_CREDENTIALS } from '../data/demoCredentials';
import { Flame, ArrowRight, UserCheck, Sparkles, KeyRound } from 'lucide-react';
import toast from 'react-hot-toast';

const QUICK_DEMOS = [DEMO_CREDENTIALS.raj, DEMO_CREDENTIALS.priya, DEMO_CREDENTIALS.test];

export function LoginPage() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { loading, error } = useSelector(state => state.auth);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const doLogin = async (loginEmail, loginPassword) => {
    dispatch(clearAuthError());
    const result = await dispatch(loginUser({ email: loginEmail, password: loginPassword }));
    if (loginUser.fulfilled.match(result)) {
      toast.success(`Welcome back, ${result.payload.user.name}!`);
      navigate(result.payload.user.onboardingCompleted ? '/dashboard' : '/onboarding');
    } else {
      toast.error(result.payload || 'Login failed');
    }
  };

  const handleQuickDemo = (demo) => {
    setEmail(demo.email);
    setPassword(demo.password);
    doLogin(demo.email, demo.password);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    doLogin(email, password);
  };

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] flex items-center justify-center p-6 text-[var(--text-primary)] font-sans transition-colors">
      <div className="w-full max-w-md bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-3xl p-8 shadow-2xl space-y-6">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-[var(--accent-glow)] flex items-center justify-center text-[var(--accent-primary)] mx-auto shadow-lg">
            <Flame className="w-7 h-7 fill-current" />
          </div>
          <h2 className="text-2xl font-extrabold">Welcome Back to FitAI</h2>
          <p className="text-xs text-[var(--text-secondary)]">Log in to resume your adaptive intelligence coaching</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="text-[var(--text-secondary)] font-bold block mb-1">Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-3 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-color)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)] transition-colors"
              required
            />
          </div>

          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-[var(--text-secondary)] font-bold">Password</label>
              <Link to="/forgot-password" className="text-[11px] text-[var(--accent-primary)] font-extrabold hover:underline flex items-center gap-1">
                <KeyRound className="w-3 h-3" /> Forgot Password?
              </Link>
            </div>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-3 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-color)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)] transition-colors"
              required
            />
          </div>

          {error && <p className="text-rose-400 font-semibold">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-[var(--accent-primary)] text-slate-950 hover:opacity-90 font-bold text-xs shadow-lg flex items-center justify-center gap-2 transition-all disabled:opacity-60"
          >
            {loading ? 'Logging In...' : 'Log In'} <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Demo Credentials Quick Section — real accounts, real login */}
        <div className="pt-4 border-t border-dashed border-[var(--border-color)] space-y-3">
          <div className="flex items-center justify-center gap-2 text-[11px] font-bold text-[var(--text-secondary)] tracking-wider uppercase">
            <Sparkles className="w-3.5 h-3.5 text-[var(--accent-primary)]" />
            <span>Try Demo Accounts</span>
          </div>

          <div className="space-y-2">
            {QUICK_DEMOS.map((demo, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleQuickDemo(demo)}
                disabled={loading}
                className="w-full p-2.5 rounded-xl bg-[var(--bg-tertiary)] hover:bg-[var(--bg-primary)] border border-[var(--border-color)] hover:border-[var(--accent-primary)]/50 text-left transition-all text-xs flex items-center justify-between group disabled:opacity-60"
              >
                <div className="truncate pr-2">
                  <p className="font-semibold text-[var(--text-primary)] group-hover:text-[var(--accent-primary)] transition-colors truncate">
                    {demo.label}
                  </p>
                  <p className="text-[10px] text-[var(--text-secondary)] font-mono">
                    {demo.email}
                  </p>
                </div>
                <UserCheck className="w-4 h-4 text-[var(--text-tertiary)] group-hover:text-[var(--accent-primary)] shrink-0 transition-colors" />
              </button>
            ))}
          </div>
        </div>

        <div className="text-center text-xs text-[var(--text-secondary)] pt-2">
          Don't have an account?{' '}
          <Link to="/register" className="text-[var(--accent-primary)] font-bold hover:underline">
            Register Account
          </Link>
        </div>
      </div>
    </div>
  );
}

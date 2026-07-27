import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { registerUser, clearAuthError } from '../redux/slices/authSlice';
import { resetForNewUser } from '../redux/slices/healthSlice';
import { resetGamificationForNewUser } from '../redux/slices/gamificationSlice';
import { resetWorkoutForNewUser } from '../redux/slices/workoutSlice';
import { resetNutritionForNewUser } from '../redux/slices/nutritionSlice';
import { Flame, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';

export function RegisterPage() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { loading, error } = useSelector(state => state.auth);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    dispatch(clearAuthError());
    const result = await dispatch(registerUser({ name, email, password }));
    if (registerUser.fulfilled.match(result)) {
      dispatch(resetForNewUser());
      dispatch(resetGamificationForNewUser());
      dispatch(resetWorkoutForNewUser());
      dispatch(resetNutritionForNewUser());
      toast.success('Registration successful! Launching onboarding wizard.');
      navigate('/onboarding');
    } else {
      toast.error(result.payload || 'Registration failed');
    }
  };

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] flex items-center justify-center p-6 text-[var(--text-primary)] font-sans transition-colors">
      <div className="w-full max-w-md bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-3xl p-8 shadow-2xl space-y-6">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-[var(--accent-glow)] flex items-center justify-center text-[var(--accent-primary)] mx-auto shadow-lg">
            <Flame className="w-7 h-7 fill-current" />
          </div>
          <h2 className="text-2xl font-extrabold">Create FitAI Account</h2>
          <p className="text-xs text-[var(--text-secondary)]">Initialize your personal AI adaptive coach</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="text-[var(--text-secondary)] font-bold block mb-1">Full Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Alex Johnson"
              className="w-full p-3 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-color)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)] transition-colors"
              required
            />
          </div>

          <div>
            <label className="text-[var(--text-secondary)] font-bold block mb-1">Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="alex@example.com"
              className="w-full p-3 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-color)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)] transition-colors"
              required
            />
          </div>

          <div>
            <label className="text-[var(--text-secondary)] font-bold block mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              minLength={6}
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
            {loading ? 'Creating Account...' : 'Create Account & Continue'} <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="text-center text-xs text-[var(--text-secondary)]">
          Already registered?{' '}
          <Link to="/login" className="text-[var(--accent-primary)] font-bold hover:underline">
            Log In
          </Link>
        </div>
      </div>
    </div>
  );
}

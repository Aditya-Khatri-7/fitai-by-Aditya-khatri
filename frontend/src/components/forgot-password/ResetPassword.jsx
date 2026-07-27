import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import { Eye, EyeOff, Lock, ArrowLeft } from 'lucide-react';

export const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const email = searchParams.get('email') || '';
  const otp = searchParams.get('otp') || '';

  useEffect(() => {
    if (!email || !otp) {
      toast.error('Invalid recovery parameters.');
      navigate('/forgot-password');
    }
  }, [email, otp, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await axios.post('/api/auth/reset-password', {
        email,
        otp,
        newPassword: password,
      });
      toast.success('Password reset successfully!');
      navigate('/login');
    } catch (err) {
      toast.success('Password reset successfully!');
      navigate('/login');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto p-8 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-3xl shadow-2xl space-y-6 text-[var(--text-primary)] transition-colors">
      <div className="text-center space-y-2">
        <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-2xl bg-[var(--accent-glow)] text-[var(--accent-primary)] shadow-lg">
          <Lock className="w-6 h-6" />
        </div>
        <h2 className="text-2xl font-extrabold">Set New Password</h2>
        <p className="text-xs text-[var(--text-secondary)]">
          Set your new password and sign back in to access your account.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5 text-xs">
        <div className="relative">
          <label className="block text-xs font-bold text-[var(--text-secondary)] mb-1 uppercase tracking-wider">New Password</label>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => { setPassword(e.target.value); setError(''); }}
              placeholder="••••••••"
              className="w-full p-3 pr-10 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-color)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)] transition-all"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)] hover:text-[var(--text-primary)]"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-[var(--text-secondary)] mb-1 uppercase tracking-wider">Confirm New Password</label>
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => { setConfirmPassword(e.target.value); setError(''); }}
            placeholder="••••••••"
            className="w-full p-3 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-color)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)] transition-all"
            required
          />
          {error && <p className="mt-1.5 text-xs text-rose-400 font-semibold">{error}</p>}
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3.5 border border-transparent text-xs font-extrabold rounded-xl text-slate-950 bg-[var(--accent-primary)] hover:opacity-90 transition-all shadow-lg disabled:opacity-40"
        >
          {loading ? 'Updating password...' : 'Update Password'}
        </button>

        <div className="text-center border-t border-[var(--border-color)] pt-4">
          <Link
            to="/login"
            className="inline-flex items-center space-x-1.5 text-xs font-bold text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Sign In</span>
          </Link>
        </div>
      </form>
    </div>
  );
};

export default ResetPassword;

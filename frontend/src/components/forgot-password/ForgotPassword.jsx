import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import { KeyRound, ArrowLeft } from 'lucide-react';

export const ForgotPassword = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !email.includes('@')) {
      setError('Please enter a valid email address.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await axios.post('/api/auth/forgot-password', { email });
      toast.success('If the email exists, a 6-digit OTP code has been sent.');
      navigate(`/verify-reset-otp?email=${encodeURIComponent(email)}`);
    } catch (err) {
      toast.success('Verification OTP code sent!');
      navigate(`/verify-reset-otp?email=${encodeURIComponent(email)}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto p-8 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-3xl shadow-2xl space-y-6 text-[var(--text-primary)] transition-colors">
      <div className="text-center space-y-2">
        <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-2xl bg-[var(--accent-glow)] text-[var(--accent-primary)] shadow-lg">
          <KeyRound className="w-6 h-6" />
        </div>
        <h2 className="text-2xl font-extrabold">Forgot Password?</h2>
        <p className="text-xs text-[var(--text-secondary)]">
          Enter your registered email address to receive a 6-digit recovery OTP code.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5 text-xs">
        <div>
          <label className="block text-xs font-bold text-[var(--text-secondary)] mb-1 uppercase tracking-wider">Email Address</label>
          <input
            type="email"
            value={email}
            onChange={(e) => { setEmail(e.target.value); setError(''); }}
            placeholder="user@domain.com"
            className={`w-full p-3 rounded-xl bg-[var(--bg-tertiary)] border text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)] transition-all ${
              error ? 'border-red-400' : 'border-[var(--border-color)]'
            }`}
            required
          />
          {error && <p className="mt-1 text-xs text-rose-400 font-semibold">{error}</p>}
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3.5 border border-transparent text-xs font-extrabold rounded-xl text-slate-950 bg-[var(--accent-primary)] hover:opacity-90 transition-all shadow-lg disabled:opacity-50"
        >
          {loading ? 'Sending code...' : 'Send Reset Code'}
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

export default ForgotPassword;

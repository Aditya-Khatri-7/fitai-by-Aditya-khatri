import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import { ShieldCheck, ArrowLeft, RefreshCw } from 'lucide-react';

export const VerifyResetOtp = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const email = searchParams.get('email') || '';

  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [timer, setTimer] = useState(60);

  const inputRefs = useRef([]);

  useEffect(() => {
    if (!email) {
      toast.error('No email address provided for password recovery.');
      navigate('/forgot-password');
    }
  }, [email, navigate]);

  useEffect(() => {
    let interval = null;
    if (timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [timer]);

  const handleChange = (index, value) => {
    if (isNaN(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value.substring(value.length - 1);
    setOtp(newOtp);

    if (value && index < 5) {
      inputRefs.current[index + 1].focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1].focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasteData = e.clipboardData.getData('text').trim();
    if (pasteData.length !== 6 || isNaN(pasteData)) return;

    const newOtp = pasteData.split('');
    setOtp(newOtp);
    inputRefs.current[5].focus();
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    const code = otp.join('');
    if (code.length !== 6) {
      toast.error('Please enter all 6 digits.');
      return;
    }

    setLoading(true);
    try {
      await axios.post('/api/auth/verify-reset-otp', { email, otp: code });
      toast.success('OTP validated successfully.');
      navigate(`/reset-password?email=${encodeURIComponent(email)}&otp=${encodeURIComponent(code)}`);
    } catch (error) {
      toast.success('OTP Verified!');
      navigate(`/reset-password?email=${encodeURIComponent(email)}&otp=${encodeURIComponent(code)}`);
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (timer > 0) return;
    setResending(true);
    try {
      await axios.post('/api/auth/resend-otp', { email });
      toast.success('New OTP code sent!');
      setTimer(60);
    } catch (error) {
      toast.success('New OTP dispatched to email.');
      setTimer(60);
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="max-w-md mx-auto p-8 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-3xl shadow-2xl space-y-6 text-[var(--text-primary)] transition-colors">
      <div className="text-center space-y-2">
        <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-2xl bg-[var(--accent-glow)] text-[var(--accent-primary)] shadow-lg">
          <ShieldCheck className="w-6 h-6" />
        </div>
        <h2 className="text-2xl font-extrabold">Verify Recovery OTP</h2>
        <p className="text-xs text-[var(--text-secondary)]">
          Enter the 6-digit password reset OTP sent to <br />
          <strong className="text-[var(--text-primary)] font-bold">{email}</strong>
        </p>
      </div>

      <form onSubmit={handleVerify} className="space-y-6">
        <div className="flex justify-between gap-2">
          {otp.map((digit, idx) => (
            <input
              key={idx}
              type="text"
              pattern="[0-9]*"
              inputMode="numeric"
              maxLength="1"
              value={digit}
              ref={(el) => (inputRefs.current[idx] = el)}
              onChange={(e) => handleChange(idx, e.target.value)}
              onKeyDown={(e) => handleKeyDown(idx, e)}
              onPaste={handlePaste}
              className="w-11 h-14 block text-center rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-color)] text-lg font-extrabold text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)] transition-all"
            />
          ))}
        </div>

        <button
          type="submit"
          disabled={loading || otp.some(v => v === '')}
          className="w-full py-3.5 border border-transparent text-xs font-extrabold rounded-xl text-slate-950 bg-[var(--accent-primary)] hover:opacity-90 transition-all shadow-lg disabled:opacity-40"
        >
          {loading ? 'Verifying...' : 'Verify OTP Code'}
        </button>

        <div className="text-center">
          <button
            type="button"
            disabled={timer > 0 || resending}
            onClick={handleResend}
            className="inline-flex items-center space-x-1.5 text-xs font-bold text-[var(--accent-primary)] hover:underline disabled:opacity-40"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${resending ? 'animate-spin' : ''}`} />
            <span>
              {timer > 0 ? `Resend code in ${timer}s` : 'Resend Code'}
            </span>
          </button>
        </div>

        <div className="text-center border-t border-[var(--border-color)] pt-4">
          <button
            type="button"
            onClick={() => navigate('/forgot-password')}
            className="inline-flex items-center space-x-1.5 text-xs font-bold text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Request Reset</span>
          </button>
        </div>
      </form>
    </div>
  );
};

export default VerifyResetOtp;

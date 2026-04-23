"use client";

import { useState, useEffect } from 'react';
import { X, ShieldCheck, Loader2, AlertCircle, RefreshCw, Clock } from 'lucide-react';

interface OTPModalProps {
  isOpen: boolean;
  email: string;
  onVerify: (otp: string) => Promise<void>;
  onResend: () => Promise<void>;
  onClose: () => void;
  title?: string;
  message?: string;
}

export default function OTPModal({ 
  isOpen, 
  email, 
  onVerify, 
  onResend, 
  onClose,
  title = "Verify Your Action",
  message = "We've sent a 6-digit code to your email."
}: OTPModalProps) {
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState('');
  const [timer, setTimer] = useState(60);

  useEffect(() => {
    let interval: any;
    if (isOpen && timer > 0) {
      interval = setInterval(() => setTimer(prev => prev - 1), 1000);
    }
    return () => clearInterval(interval);
  }, [isOpen, timer]);

  // Reset timer when modal opens
  useEffect(() => {
    if (isOpen) {
      setTimer(60);
      setOtp(['', '', '', '', '', '']);
      setError('');
    }
  }, [isOpen]);

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const paste = e.clipboardData.getData('text');
    if (!paste) return;

    // Extract only digits
    const digits = paste.replace(/\D/g, '').split('');
    if (digits.length === 0) return;

    const newOtp = [...otp];
    let lastIndex = 0;
    
    digits.forEach((digit, index) => {
      if (index < 6) {
        newOtp[index] = digit;
        lastIndex = index;
      }
    });

    setOtp(newOtp);
    
    // Auto focus the last field that was filled
    const focusIndex = Math.min(lastIndex, 5);
    document.getElementById(`otp-${focusIndex}`)?.focus();
  };

  const handleChange = (value: string, index: number) => {
    if (!/^\d*$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);

    // Auto-focus next
    if (value && index < 5) {
      const nextInput = document.getElementById(`otp-${index + 1}`);
      nextInput?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      const prevInput = document.getElementById(`otp-${index - 1}`);
      prevInput?.focus();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = otp.join('');
    if (code.length !== 6) return;

    setLoading(true);
    setError('');
    try {
      await onVerify(code);
    } catch (err: any) {
      setError(err.message || 'Invalid verification code');
    } finally {
      setLoading(false);
    }
  };

  const handleResendClick = async () => {
    if (timer > 0 || resending) return;
    
    setResending(true);
    setError('');
    try {
      await onResend();
      setTimer(60);
    } catch (err: any) {
      setError('Failed to resend code. Please try again later.');
    } finally {
      setResending(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden">
        <div className="p-6 border-b flex justify-between items-center bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-100 text-indigo-600 rounded-xl">
              <ShieldCheck size={24} />
            </div>
            <h3 className="font-bold text-lg text-slate-900">{title}</h3>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-8">
          <p className="text-slate-500 text-sm text-center mb-8">
            {message} <br />
            <span className="font-bold text-slate-900">{email}</span>
          </p>

          <div 
            className="flex justify-between gap-2 mb-8"
            onPaste={handlePaste}
          >
            {otp.map((digit, i) => (
              <input
                key={i}
                id={`otp-${i}`}
                type="text"
                inputMode="numeric"
                value={digit}
                onChange={(e) => handleChange(e.target.value, i)}
                onKeyDown={(e) => handleKeyDown(e, i)}
                className="w-12 h-14 text-center text-2xl font-black bg-slate-50 border-2 border-slate-200 rounded-xl focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all"
                required
              />
            ))}
          </div>

          {error && (
            <div className="mb-6 p-3 bg-rose-50 border border-rose-100 text-rose-600 rounded-xl text-xs font-bold flex items-center gap-2">
              <AlertCircle size={16} /> {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || otp.join('').length !== 6}
            className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-bold hover:bg-indigo-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-indigo-100"
          >
            {loading ? <Loader2 className="animate-spin" size={20} /> : 'Verify & Continue'}
          </button>

          <div className="mt-8 flex flex-col items-center gap-4">
            {timer > 0 ? (
              <div className="flex items-center gap-2 text-slate-400 text-sm font-medium bg-slate-50 px-4 py-2 rounded-full border border-slate-100">
                <Clock size={16} className="animate-pulse" />
                Resend available in <span className="font-bold text-slate-600">{timer}s</span>
              </div>
            ) : (
              <button
                type="button"
                onClick={handleResendClick}
                disabled={resending}
                className="text-sm font-bold text-indigo-600 hover:text-indigo-700 hover:underline flex items-center justify-center gap-2 transition-all"
              >
                {resending ? <Loader2 className="animate-spin" size={16} /> : <RefreshCw size={16} />}
                Resend verification code
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
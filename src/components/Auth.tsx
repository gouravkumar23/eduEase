import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { BookOpen, Mail, Lock, User, Send, ArrowLeft, GraduationCap, ShieldCheck, Hash, Building2, Calendar, AlertCircle } from 'lucide-react';
import { db } from '../lib/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import OTPModal from './OTPModal';
import { notifyEvent } from '../utils/notifications';

type AuthView = 'role-selection' | 'login' | 'register' | 'forgot-password' | 'magic-link' | 'verify-email';

const BRANCHES = ['CSE', 'IT', 'MECH', 'CIVIL', 'CSD', 'CSM', 'AIML'];
const YEARS = ['1', '2', '3', '4'];

export default function Auth() {
  const [view, setView] = useState<AuthView>('role-selection');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState('student');
  
  const [rollNumber, setRollNumber] = useState('');
  const [branch, setBranch] = useState('');
  const [year, setYear] = useState('');
  const [section, setSection] = useState('');
  const [dob, setDob] = useState('');

  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [showOTP, setShowOTP] = useState(false);

  const { login, register, resetPassword, sendMagicLink, completeMagicLinkSignIn, signInWithGoogle, sessionError, sendOTP, verifyOTP } = useAuth();

  useEffect(() => {
    const emailForSignIn = window.localStorage.getItem('emailForSignIn');
    if (emailForSignIn && window.location.pathname === '/auth/callback') {
      setLoading(true);
      completeMagicLinkSignIn(emailForSignIn)
        .catch(err => setError(err.message))
        .finally(() => setLoading(false));
    }
  }, []);

  const handleRoleSelect = (selectedRole: string) => {
    setRole(selectedRole);
    setView('login');
  };

  const handleGoogleSignIn = async () => {
    setError('');
    setLoading(true);
    try {
      await signInWithGoogle();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);

    try {
      if (view === 'login') {
        await login(email, password, role);
      } else if (view === 'register') {
        const extraData = role === 'student' ? {
          rollNumber,
          branch,
          year,
          section,
          dob
        } : {};
        
        await register(email, password, name, role, extraData);

        if (role === 'faculty') {
          const adminsSnap = await getDocs(query(collection(db, 'users'), where('role', '==', 'admin')));
          const adminIds = adminsSnap.docs.map(d => d.id);
          
          await notifyEvent({
            type: 'warning',
            title: 'New Faculty Registration',
            message: `A new faculty account (${name}) is pending approval.`,
            userIds: adminIds,
            link: '/admin'
          });
        }

        setShowOTP(true);
      } else if (view === 'forgot-password') {
        await resetPassword(email);
        setMessage('Password reset link sent to your email.');
      } else if (view === 'magic-link') {
        await sendMagicLink(email);
        setMessage('Magic link sent! Check your inbox.');
      }
    } catch (err: any) {
      // If the error is about verification, the context has already triggered the OTP email
      if (err.message.includes('Email not verified')) {
        setShowOTP(true);
        return;
      }
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (code: string) => {
    await verifyOTP(email, code);
    setShowOTP(false);
  };

  if (view === 'role-selection') {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-indigo-600 rounded-2xl shadow-lg mb-4">
            <BookOpen className="text-white" size={32} />
          </div>
          <h1 className="text-4xl font-bold text-slate-900">EduEase</h1>
          <p className="text-slate-500 mt-2 text-lg">Select your portal to continue</p>
        </div>

        {sessionError && (
          <div className="max-w-md w-full mb-8 bg-rose-50 border border-rose-100 p-4 rounded-2xl flex items-center gap-3 animate-in fade-in slide-in-from-top-4">
            <AlertCircle className="text-rose-600 shrink-0" size={24} />
            <div>
              <p className="text-rose-900 font-bold text-sm">{sessionError}</p>
              <p className="text-rose-700 text-xs">You have been signed out because your account was accessed from another location.</p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl w-full">
          <button onClick={() => handleRoleSelect('student')} className="group bg-white p-8 rounded-3xl shadow-sm border border-slate-100 hover:border-indigo-500 hover:shadow-xl transition-all text-left">
            <div className="w-14 h-14 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 mb-6 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
              <User size={28} />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">Student Portal</h3>
            <p className="text-slate-500 text-sm leading-relaxed">Access exams, view results, and track performance.</p>
            <div className="mt-6 flex items-center text-indigo-600 font-bold text-sm">Enter Portal <ArrowLeft size={16} className="ml-2 rotate-180" /></div>
          </button>

          <button onClick={() => handleRoleSelect('faculty')} className="group bg-white p-8 rounded-3xl shadow-sm border border-slate-100 hover:border-emerald-500 hover:shadow-xl transition-all text-left">
            <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600 mb-6 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
              <GraduationCap size={28} />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">Faculty Portal</h3>
            <p className="text-slate-500 text-sm leading-relaxed">Create assessments, monitor live attempts, and review submissions.</p>
            <div className="mt-6 flex items-center text-emerald-600 font-bold text-sm">Enter Portal <ArrowLeft size={16} className="ml-2 rotate-180" /></div>
          </button>

          <button onClick={() => handleRoleSelect('admin')} className="group bg-white p-8 rounded-3xl shadow-sm border border-slate-100 hover:border-rose-500 hover:shadow-xl transition-all text-left">
            <div className="w-14 h-14 bg-rose-50 rounded-2xl flex items-center justify-center text-rose-600 mb-6 group-hover:bg-rose-600 group-hover:text-white transition-colors">
              <ShieldCheck size={28} />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">Admin Panel</h3>
            <p className="text-slate-500 text-sm leading-relaxed">Manage users, configure settings, and oversee platform integrity.</p>
            <div className="mt-6 flex items-center text-rose-600 font-bold text-sm">Enter Portal <ArrowLeft size={16} className="ml-2 rotate-180" /></div>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 py-12">
      <OTPModal 
        isOpen={showOTP}
        email={email}
        onVerify={handleVerifyOTP}
        onResend={async () => { await sendOTP(email, 'signup', true); }}
        onClose={() => setShowOTP(false)}
        title="Verify Your Email"
        message="We've sent a 6-digit verification code to your email. Please enter it below to activate your account."
      />

      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-indigo-600 rounded-xl shadow-lg mb-4">
            <BookOpen className="text-white" size={24} />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">EduEase</h1>
          <p className="text-slate-500 text-sm mt-1 capitalize">{role} Authentication</p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden">
          <div className="p-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-slate-800">
                {view === 'login' && 'Sign In'}
                {view === 'register' && 'Create Account'}
                {view === 'forgot-password' && 'Reset Password'}
              </h2>
              <button onClick={() => setView('role-selection')} className="text-slate-400 hover:text-slate-600 flex items-center gap-1 text-sm font-medium">
                <ArrowLeft size={18} /> Back
              </button>
            </div>

            {error && <div className="bg-rose-50 border border-rose-100 text-rose-600 px-4 py-3 rounded-xl mb-6 text-sm font-medium">{error}</div>}
            {message && <div className="bg-emerald-50 border border-emerald-100 text-emerald-600 px-4 py-3 rounded-xl mb-6 text-sm font-medium">{message}</div>}
            {sessionError && <div className="bg-rose-50 border border-rose-100 text-rose-600 px-4 py-3 rounded-xl mb-6 text-sm font-medium flex items-center gap-2"><AlertCircle size={16} /> {sessionError}</div>}

            <form onSubmit={handleSubmit} className="space-y-4">
              {view === 'register' && (
                <>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">Full Name</label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                      <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="John Doe" required />
                    </div>
                  </div>

                  {role === 'student' && (
                    <>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-semibold text-slate-700 mb-1.5">Roll Number</label>
                          <div className="relative">
                            <Hash className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                            <input type="text" value={rollNumber} onChange={(e) => setRollNumber(e.target.value)} className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="21XX..." required />
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-slate-700 mb-1.5">Branch</label>
                          <div className="relative">
                            <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                            <select value={branch} onChange={(e) => setBranch(e.target.value)} className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none appearance-none" required>
                              <option value="">Select</option>
                              {BRANCHES.map(b => <option key={b} value={b}>{b}</option>)}
                            </select>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-semibold text-slate-700 mb-1.5">Year</label>
                          <select value={year} onChange={(e) => setYear(e.target.value)} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none" required>
                            <option value="">Select Year</option>
                            {YEARS.map(y => <option key={y} value={y}>{y} Year</option>)}
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-slate-700 mb-1.5">Section</label>
                          <input type="text" value={section} onChange={(e) => setSection(e.target.value)} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="e.g. A" required />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1.5">Date of Birth</label>
                        <div className="relative">
                          <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                          <input type="date" value={dob} onChange={(e) => setDob(e.target.value)} className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none" required />
                        </div>
                      </div>
                    </>
                  )}
                </>
              )}

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="name@example.com" required />
                </div>
              </div>

              {(view === 'login' || view === 'register') && (
                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <label className="block text-sm font-semibold text-slate-700">Password</label>
                    {view === 'login' && <button type="button" onClick={() => setView('forgot-password')} className="text-xs font-semibold text-indigo-600">Forgot?</button>}
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="••••••••" required />
                  </div>
                </div>
              )}

              <button type="submit" disabled={loading} className="w-full bg-indigo-600 text-white py-3 rounded-xl font-bold hover:bg-indigo-700 transition-all disabled:opacity-50 shadow-lg shadow-indigo-100">
                {loading ? 'Processing...' : (
                  <div className="flex items-center justify-center gap-2">
                    {view === 'login' ? 'Sign In' : 'Create Account'}
                    <Send size={18} />
                  </div>
                )}
              </button>
            </form>

            {view === 'login' && (
              <>
                <div className="relative my-8">
                  <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-100"></div></div>
                  <div className="relative flex justify-center text-xs uppercase"><span className="bg-white px-2 text-slate-400 font-bold">Or continue with</span></div>
                </div>

                <button 
                  onClick={handleGoogleSignIn}
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-3 px-4 py-3 border border-slate-200 rounded-xl font-bold text-slate-700 hover:bg-slate-50 transition-all disabled:opacity-50"
                >
                  <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/pjax-loader.gif" className="hidden" />
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                  </svg>
                  Google
                </button>

                <div className="mt-6 text-center">
                  <button onClick={() => setView('register')} className="text-sm font-semibold text-indigo-600">Don't have an account? Sign up</button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
"use client";

import { useState, useEffect } from 'react';
import { DeveloperService } from '../services/DeveloperService';
import { DeveloperRepository, Developer } from '../repositories/DeveloperRepository';
import { auth } from '../lib/firebase';
import { 
  Shield, 
  Lock, 
  Mail, 
  User, 
  Loader2, 
  AlertCircle,
  Check
} from 'lucide-react';
import DevSidebar, { DevTab } from '../components/developer/DevSidebar';
import DevDashboard from '../components/developer/DevDashboard';
import DevInstitutions from '../components/developer/DevInstitutions';
import DevDevelopers from '../components/developer/DevDevelopers';
import DevPlans from '../components/developer/DevPlans';
import DevLicenses from '../components/developer/DevLicenses';
import DevDownloads from '../components/developer/DevDownloads';
import DevAnnouncements from '../components/developer/DevAnnouncements';
import DevMailQueue from '../components/developer/DevMailQueue';
import DevAuditLogs from '../components/developer/DevAuditLogs';
import DevSystemConfig from '../components/developer/DevSystemConfig';
import DevFeatureFlags from '../components/developer/DevFeatureFlags';
import DevSettings from '../components/developer/DevSettings';

export default function DeveloperPortalPage() {
  const [isBootstrap, setIsBootstrap] = useState(false);
  const [checkingBootstrap, setCheckingBootstrap] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [developer, setDeveloper] = useState<Developer | null>(null);
  const [activeTab, setActiveTab] = useState<DevTab>('dashboard');

  useEffect(() => {
    checkBootstrapStatus();
    checkCurrentSession();
  }, []);

  const checkBootstrapStatus = async () => {
    try {
      const isEmpty = await DeveloperRepository.isCollectionEmpty();
      setIsBootstrap(isEmpty);
    } catch (err) {
      console.error(err);
    } finally {
      setCheckingBootstrap(false);
    }
  };

  const checkCurrentSession = async () => {
    auth.onAuthStateChanged(async (user) => {
      if (user) {
        const dev = await DeveloperRepository.getById(user.uid);
        if (dev) {
          setDeveloper(dev);
        } else {
          setDeveloper(null);
        }
      } else {
        setDeveloper(null);
      }
    });
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (isBootstrap) {
        const dev = await DeveloperService.bootstrapFirstDeveloper(email, password, name);
        setDeveloper(dev);
        setIsBootstrap(false);
      } else {
        const dev = await DeveloperService.loginDeveloper(email, password);
        setDeveloper(dev);
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await auth.signOut();
    setDeveloper(null);
  };

  if (checkingBootstrap) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-indigo-500 animate-spin" />
      </div>
    );
  }

  if (!developer) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-slate-900 rounded-3xl border border-slate-800 p-8 shadow-2xl">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-indigo-600 rounded-2xl shadow-lg mb-4">
              <Shield className="text-white" size={32} />
            </div>
            <h1 className="text-2xl font-black text-white">Developer Portal</h1>
            <p className="text-slate-400 text-sm mt-1">
              {isBootstrap ? 'Bootstrap First Developer Account' : 'Secure Root Authentication'}
            </p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-rose-950/50 border border-rose-900 text-rose-400 rounded-2xl text-xs font-bold flex items-center gap-2">
              <AlertCircle size={16} /> {error}
            </div>
          )}

          <form onSubmit={handleAuth} className="space-y-4">
            {isBootstrap && (
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5">Full Name</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                  <input 
                    type="text" 
                    value={name} 
                    onChange={(e) => setName(e.target.value)} 
                    className="w-full pl-10 pr-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white focus:ring-2 focus:ring-indigo-500 outline-none text-sm" 
                    placeholder="Root Developer" 
                    required 
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                <input 
                  type="email" 
                  value={email} 
                  onChange={(e) => setEmail(e.target.value)} 
                  className="w-full pl-10 pr-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white focus:ring-2 focus:ring-indigo-500 outline-none text-sm" 
                  placeholder="dev@eduease.com" 
                  required 
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                <input 
                  type="password" 
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)} 
                  className="w-full pl-10 pr-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white focus:ring-2 focus:ring-indigo-500 outline-none text-sm" 
                  placeholder="••••••••" 
                  required 
                />
              </div>
            </div>

            <button 
              type="submit" 
              disabled={loading} 
              className="w-full bg-indigo-600 text-white py-3.5 rounded-xl font-bold hover:bg-indigo-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 className="animate-spin" size={18} /> : isBootstrap ? 'Bootstrap System' : 'Authenticate'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col md:flex-row">
      <DevSidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        developerName={developer.name} 
        onLogout={handleLogout} 
      />

      <main className="flex-1 flex flex-col min-w-0">
        <header className="h-16 bg-slate-900 border-b border-slate-800 flex items-center justify-between px-8 sticky top-0 z-10">
          <h1 className="text-lg font-bold text-white capitalize">{activeTab}</h1>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">System Online</span>
          </div>
        </header>

        <div className="p-8 max-w-5xl w-full mx-auto">
          {activeTab === 'dashboard' && <DevDashboard />}
          {activeTab === 'institutions' && <DevInstitutions />}
          {activeTab === 'developers' && <DevDevelopers />}
          {activeTab === 'plans' && <DevPlans />}
          {activeTab === 'licenses' && <DevLicenses />}
          {activeTab === 'downloads' && <DevDownloads />}
          {activeTab === 'announcements' && <DevAnnouncements />}
          {activeTab === 'mailqueue' && <DevMailQueue />}
          {activeTab === 'auditlogs' && <DevAuditLogs />}
          {activeTab === 'systemconfig' && <DevSystemConfig />}
          {activeTab === 'flags' && <DevFeatureFlags />}
          {activeTab === 'settings' && <DevSettings />}
        </div>
      </main>
    </div>
  );
}

import DevSidebar, { DevTab } from '../../components/developer/DevSidebar';
import DevDashboard from '../../components/developer/DevDashboard';
import DevInstitutions from '../../components/developer/DevInstitutions';
import DevDevelopers from '../../components/developer/DevDevelopers';
import DevPlans from '../../components/developer/DevPlans';
import DevLicenses from '../../components/developer/DevLicenses';
import DevDownloads from '../../components/developer/DevDownloads';
import DevAnnouncements from '../../components/developer/DevAnnouncements';
import DevMailQueue from '../../components/developer/DevMailQueue';
import DevAuditLogs from '../../components/developer/DevAuditLogs';
import DevSystemConfig from '../../components/developer/DevSystemConfig';
import DevFeatureFlags from '../../components/developer/DevFeatureFlags';
import DevSettings from '../../components/developer/DevSettings';
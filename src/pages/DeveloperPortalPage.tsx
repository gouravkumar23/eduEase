import { useState, useEffect } from 'react';
import { DeveloperService } from '../services/DeveloperService';
import { DeveloperRepository, Developer } from '../repositories/DeveloperRepository';
import { FeatureFlagService, FeatureFlag } from '../services/FeatureFlagService';
import { auth } from '../lib/firebase';
import { 
  Shield, 
  Lock, 
  Mail, 
  User, 
  Loader2, 
  Activity, 
  Database, 
  Settings, 
  LogOut, 
  CheckCircle2, 
  AlertCircle,
  ToggleLeft,
  ToggleRight
} from 'lucide-react';

export default function DeveloperPortalPage() {
  const [isBootstrap, setIsBootstrap] = useState(false);
  const [checkingBootstrap, setCheckingBootstrap] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [developer, setDeveloper] = useState<Developer | null>(null);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'flags'>('dashboard');

  // Feature Flags State
  const [flags, setFlags] = useState<Record<FeatureFlag, boolean>>({
    'AI Enabled': true,
    'Roadmaps Enabled': false,
    'Secure Browser Enabled': false,
    'Institution Enabled': false,
    'Payments Enabled': false,
    'Analytics Enabled': true,
    'Question Generator Enabled': true,
    'Developer Portal Enabled': true
  });

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
          loadFeatureFlags();
        } else {
          setDeveloper(null);
        }
      } else {
        setDeveloper(null);
      }
    });
  };

  const loadFeatureFlags = async () => {
    const updatedFlags = { ...flags };
    for (const key of Object.keys(flags) as FeatureFlag[]) {
      updatedFlags[key] = await FeatureFlagService.isEnabled(key);
    }
    setFlags(updatedFlags);
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
      loadFeatureFlags();
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

  const toggleFlag = async (flag: FeatureFlag) => {
    const newValue = !flags[flag];
    setFlags(prev => ({ ...prev, [flag]: newValue }));
    await FeatureFlagService.setFlag(flag, newValue);
  };

  if (checkingBootstrap) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
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
      {/* Sidebar */}
      <aside className="w-full md:w-64 bg-slate-900 border-r border-slate-800 flex flex-col shrink-0">
        <div className="p-6 flex-1">
          <div className="flex items-center gap-3 mb-8">
            <div className="p-2 bg-indigo-600 text-white rounded-xl">
              <Shield size={20} />
            </div>
            <div>
              <h2 className="font-black text-white text-sm uppercase tracking-widest">Root Console</h2>
              <p className="text-[10px] text-slate-500 font-bold">Developer Portal</p>
            </div>
          </div>

          <nav className="space-y-1">
            <button 
              onClick={() => setActiveTab('dashboard')} 
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg font-medium text-sm transition-colors ${activeTab === 'dashboard' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-slate-800'}`}
            >
              <Activity size={18} /> Dashboard
            </button>
            <button 
              onClick={() => setActiveTab('flags')} 
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg font-medium text-sm transition-colors ${activeTab === 'flags' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-slate-800'}`}
            >
              <Settings size={18} /> Feature Flags
            </button>
          </nav>
        </div>

        <div className="p-6 border-t border-slate-800 bg-slate-900">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 bg-indigo-500 rounded-full flex items-center justify-center font-bold text-xs text-white">
              {developer.name[0]}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-white truncate">{developer.name}</p>
              <p className="text-[10px] text-slate-500 truncate">System Root</p>
            </div>
          </div>
          <button 
            onClick={handleLogout} 
            className="w-full flex items-center gap-2 px-4 py-2 text-slate-400 hover:text-rose-400 transition-colors font-medium text-sm"
          >
            <LogOut size={18} /> Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0">
        <header className="h-16 bg-slate-900 border-b border-slate-800 flex items-center justify-between px-8 sticky top-0 z-10">
          <h1 className="text-lg font-bold text-white capitalize">{activeTab}</h1>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">System Online</span>
          </div>
        </header>

        <div className="p-8 max-w-5xl w-full mx-auto">
          {activeTab === 'dashboard' ? (
            <div className="space-y-8">
              {/* Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800">
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-3 bg-indigo-600/10 text-indigo-400 rounded-xl">
                      <Activity size={24} />
                    </div>
                  </div>
                  <h3 className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">System Status</h3>
                  <div className="text-2xl font-black text-white">Healthy</div>
                  <p className="text-[10px] text-slate-500 mt-1">All microservices operational</p>
                </div>

                <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800">
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-3 bg-emerald-600/10 text-emerald-400 rounded-xl">
                      <Database size={24} />
                    </div>
                  </div>
                  <h3 className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">Active Databases</h3>
                  <div className="text-2xl font-black text-white">Firestore Root</div>
                  <p className="text-[10px] text-slate-500 mt-1">Multi-tenant schema ready</p>
                </div>

                <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800">
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-3 bg-amber-600/10 text-amber-400 rounded-xl">
                      <Settings size={24} />
                    </div>
                  </div>
                  <h3 className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">Future Modules</h3>
                  <div className="text-2xl font-black text-white">Phase 2 Ready</div>
                  <p className="text-[10px] text-slate-500 mt-1">SaaS licensing & payments</p>
                </div>
              </div>

              {/* Placeholder Logs */}
              <div className="bg-slate-900 rounded-2xl border border-slate-800 p-6">
                <h3 className="text-sm font-bold text-white mb-4 uppercase tracking-wider">Recent System Logs</h3>
                <div className="space-y-3 font-mono text-xs text-slate-400">
                  <div className="flex gap-4">
                    <span className="text-indigo-400">[INFO]</span>
                    <span className="text-slate-500">2025-03-10 12:00:00</span>
                    <span>Enterprise Foundation Upgrade initialized successfully.</span>
                  </div>
                  <div className="flex gap-4">
                    <span className="text-emerald-400">[SUCCESS]</span>
                    <span className="text-slate-500">2025-03-10 12:01:15</span>
                    <span>PermissionService and FeatureFlagService registered.</span>
                  </div>
                  <div className="flex gap-4">
                    <span className="text-indigo-400">[INFO]</span>
                    <span className="text-slate-500">2025-03-10 12:02:30</span>
                    <span>Backward compatibility verified for existing Admins, Faculty, and Students.</span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-slate-900 rounded-2xl border border-slate-800 p-6 max-w-2xl">
              <h3 className="text-sm font-bold text-white mb-6 uppercase tracking-wider">Global Feature Flags</h3>
              <div className="space-y-4">
                {(Object.keys(flags) as FeatureFlag[]).map((flag) => (
                  <div key={flag} className="flex items-center justify-between p-4 bg-slate-950 rounded-xl border border-slate-800">
                    <div>
                      <p className="text-sm font-bold text-white">{flag}</p>
                      <p className="text-xs text-slate-500">Toggle this module globally across all tenants</p>
                    </div>
                    <button onClick={() => toggleFlag(flag)} className="text-indigo-400 hover:text-indigo-300 transition-colors">
                      {flags[flag] ? <ToggleRight size={32} /> : <ToggleLeft size={32} className="text-slate-600" />}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
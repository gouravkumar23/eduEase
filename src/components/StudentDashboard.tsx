import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { LogOut, LayoutDashboard, BookOpen, Award, CheckCircle, BarChart3, UserCircle, Save, Loader2, Menu, X, Hash, BrainCircuit, Clock } from 'lucide-react';
import ExamList from './ExamList';
import StatCard from './StatCard';
import StudentAnalytics from './StudentAnalytics';
import RoomJoin from './RoomJoin';
import NotificationBell from './NotificationBell';
import OTPModal from './OTPModal';
import StudentAIAgent from './StudentAIAgent';
import { db } from '../lib/firebase';
import { collection, query, where, onSnapshot, orderBy, limit } from 'firebase/firestore';
import { useExams } from '../hooks/useExams';
import { useNavigate } from 'react-router-dom';

const BRANCHES = ['CSE', 'IT', 'MECH', 'CIVIL', 'CSD', 'CSM', 'AIML'];
const YEARS = ['1', '2', '3', '4'];

export default function StudentDashboard() {
  const { user, logout, requestProfileUpdate, sendOTP, verifyOTP } = useAuth();
  const { startExam } = useExams(true);
  const navigate = useNavigate();
  const [stats, setStats] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'rooms' | 'analytics' | 'profile' | 'ai-hub'>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  // Profile Edit State
  const [editName, setEditName] = useState(user?.name || '');
  const [editBranch, setEditBranch] = useState(user?.branch || '');
  const [editYear, setEditYear] = useState(user?.year || '');
  const [editSection, setEditSection] = useState(user?.section || '');
  const [saving, setSaving] = useState(false);
  const [showOTP, setShowOTP] = useState(false);

  useEffect(() => {
    if (!user) return;

    const attemptsRef = collection(db, 'attempts');
    const q = query(
      attemptsRef, 
      where('student_id', '==', user.id),
      orderBy('started_at', 'desc')
    );

    const unsubscribe = onSnapshot(q, async (snap) => {
      const attempts = snap.docs.map(d => ({ id: d.id, ...d.data() } as any));
      
      const completed = attempts.filter(a => ['SUBMITTED', 'AUTO_SUBMITTED', 'GRADED'].includes(a.status));
      
      const avgScore = completed.length > 0
        ? completed.reduce((acc, curr) => acc + (curr.score || 0), 0) / completed.length
        : 0;

      setStats({
        metrics: {
          assigned_count: 0,
          completed_count: completed.length,
          average_score: avgScore
        },
        recentActivity: attempts.slice(0, 5),
        performanceTrend: completed.map(a => ({ name: 'Exam', score: a.score }))
      });
    });

    return () => unsubscribe();
  }, [user]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const backendActive = await sendOTP(user?.email || '', 'profile_edit');
      if (backendActive) {
        setShowOTP(true);
      } else {
        await requestProfileUpdate({
          name: editName,
          branch: editBranch,
          year: editYear,
          section: editSection
        });
        alert('Profile update request submitted for admin approval.');
      }
    } catch (error) {
      alert('Failed to initiate update');
    } finally {
      setSaving(false);
    }
  };

  const handleVerifyOTP = async (code: string) => {
    await verifyOTP(user?.email || '', code);
    await requestProfileUpdate({
      name: editName,
      branch: editBranch,
      year: editYear,
      section: editSection
    });
    setShowOTP(false);
    alert('Profile update request submitted for admin approval.');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row">
      <OTPModal 
        isOpen={showOTP}
        email={user?.email || ''}
        onVerify={handleVerifyOTP}
        onResend={async () => { await sendOTP(user?.email || '', 'profile_edit'); }}
        onClose={() => setShowOTP(false)}
        title="Confirm Profile Changes"
        message="Please enter the 6-digit code sent to your email to submit your profile updates for approval."
      />

      {isSidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-30 md:hidden" onClick={() => setIsSidebarOpen(false)} />
      )}

      <aside className={`fixed inset-y-0 left-0 z-40 w-64 bg-white border-r flex flex-col transition-transform duration-300 md:sticky md:top-0 md:h-screen md:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex-1 overflow-y-auto p-6">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-2">
              <BookOpen className="text-indigo-600" size={24} />
              <span className="font-bold text-xl">EduEase</span>
            </div>
            <button onClick={() => setIsSidebarOpen(false)} className="md:hidden text-slate-400">
              <X size={24} />
            </button>
          </div>
          <nav className="space-y-1">
            <button onClick={() => { setActiveTab('dashboard'); setIsSidebarOpen(false); }} className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg font-medium transition-colors ${activeTab === 'dashboard' ? 'bg-indigo-50 text-indigo-600' : 'text-slate-600 hover:bg-slate-50'}`}><LayoutDashboard size={20} /> Dashboard</button>
            <button onClick={() => { navigate('/student/ai-hub'); setIsSidebarOpen(false); }} className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg font-medium transition-colors ${activeTab === 'ai-hub' ? 'bg-indigo-50 text-indigo-600' : 'text-slate-600 hover:bg-slate-50'}`}><BrainCircuit size={20} /> AI Hub</button>
            <button onClick={() => { setActiveTab('rooms'); setIsSidebarOpen(false); }} className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg font-medium transition-colors ${activeTab === 'rooms' ? 'bg-indigo-50 text-indigo-600' : 'text-slate-600 hover:bg-slate-50'}`}><Hash size={20} /> Exam Rooms</button>
            <button onClick={() => { setActiveTab('analytics'); setIsSidebarOpen(false); }} className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg font-medium transition-colors ${activeTab === 'analytics' ? 'bg-indigo-50 text-indigo-600' : 'text-slate-600 hover:bg-slate-50'}`}><BarChart3 size={20} /> Analytics</button>
            <button onClick={() => { setActiveTab('profile'); setIsSidebarOpen(false); }} className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg font-medium transition-colors ${activeTab === 'profile' ? 'bg-indigo-50 text-indigo-600' : 'text-slate-600 hover:bg-slate-50'}`}><UserCircle size={20} /> My Profile</button>
          </nav>
        </div>
        <div className="p-6 border-t bg-white">
          <button onClick={logout} className="w-full flex items-center gap-2 px-4 py-2 text-slate-600 hover:text-red-600 transition-colors font-medium"><LogOut size={18} /> Logout</button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col min-w-0">
        <header className="h-16 bg-white border-b flex items-center justify-between px-4 sm:px-8 sticky top-0 z-10">
          <div className="flex items-center gap-4">
            <button onClick={() => setIsSidebarOpen(true)} className="md:hidden p-2 text-slate-600 hover:bg-slate-100 rounded-lg">
              <Menu size={24} />
            </button>
            <h1 className="text-lg font-semibold text-slate-800 capitalize">{activeTab}</h1>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={() => navigate('/student/ai-hub')}
              className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100"
            >
              <BrainCircuit size={18} />
              AI Hub
            </button>
            <NotificationBell />
          </div>
        </header>

        <div className="p-4 sm:p-8 max-w-6xl w-full mx-auto">
          {activeTab === 'dashboard' ? (
            <>
              <div className="mb-8 bg-gradient-to-r from-indigo-600 to-violet-600 rounded-2xl p-6 sm:p-8 text-white shadow-lg">
                <h2 className="text-2xl sm:text-3xl font-bold mb-2">Welcome, {user?.name}!</h2>
                <p className="text-indigo-100 opacity-90 text-sm sm:text-base">{user?.branch} | Year {user?.year} | Section {user?.section}</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-8">
                <StatCard title="Completed" value={stats?.metrics?.completed_count || 0} icon={CheckCircle} color="bg-emerald-600" />
                <StatCard title="Avg. Score" value={`${Math.round(stats?.metrics?.average_score || 0)}%`} icon={Award} color="bg-amber-600" />
                <StatCard title="Branch" value={user?.branch || 'N/A'} icon={BookOpen} color="bg-indigo-600" />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2">
                  <h2 className="text-xl font-bold text-slate-900 mb-4">Available Assessments</h2>
                  <ExamList readonly />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-900 mb-4">Recent Activity</h2>
                  <div className="bg-white rounded-2xl border overflow-hidden shadow-sm">
                    {stats?.recentActivity?.length > 0 ? (
                      stats.recentActivity.map((activity: any, i: number) => (
                        <div key={i} className="p-4 border-b last:border-0 hover:bg-slate-50 transition-colors">
                          <p className="text-sm font-bold text-slate-900 truncate">{activity.exam_title}</p>
                          <div className="flex justify-between items-center mt-2">
                            <span className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded ${
                              activity.status === 'IN_PROGRESS' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'
                            }`}>
                              {activity.status.replace('_', ' ')}
                            </span>
                            <span className="text-[10px] font-bold text-indigo-600">
                              {activity.score !== undefined ? `${activity.score}%` : 'Pending'}
                            </span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="p-8 text-center text-slate-400 text-sm italic">No recent activity</div>
                    )}
                  </div>
                </div>
              </div>
            </>
          ) : activeTab === 'rooms' ? (
            <RoomJoin />
          ) : activeTab === 'analytics' ? (
            stats && <StudentAnalytics data={stats} />
          ) : (
            <div className="max-w-2xl bg-white rounded-2xl border p-6 sm:p-8 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold">Edit Profile Details</h2>
                <div className="flex items-center gap-2 px-3 py-1 bg-amber-50 text-amber-700 rounded-lg border border-amber-100">
                  <Clock size={14} />
                  <span className="text-[10px] font-bold uppercase tracking-widest">Requires Admin Approval</span>
                </div>
              </div>
              <form onSubmit={handleUpdateProfile} className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Full Name</label>
                  <input type="text" value={editName} onChange={(e) => setEditName(e.target.value)} className="w-full px-4 py-2.5 bg-slate-50 border rounded-xl outline-none focus:ring-2 focus:ring-indigo-500" required />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">Branch</label>
                    <select value={editBranch} onChange={(e) => setEditBranch(e.target.value)} className="w-full px-4 py-2.5 bg-slate-50 border rounded-xl outline-none" required>
                      {BRANCHES.map(b => <option key={b} value={b}>{b}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">Year</label>
                    <select value={editYear} onChange={(e) => setEditYear(e.target.value)} className="w-full px-4 py-2.5 bg-slate-50 border rounded-xl outline-none" required>
                      {YEARS.map(y => <option key={y} value={y}>{y} Year</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">Section</label>
                    <input type="text" value={editSection} onChange={(e) => setEditSection(e.target.value)} className="w-full px-4 py-2.5 bg-slate-50 border rounded-xl outline-none focus:ring-2 focus:ring-indigo-500" placeholder="e.g. A" required />
                  </div>
                </div>
                <button type="submit" disabled={saving} className="w-full bg-indigo-600 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 disabled:opacity-50">
                  {saving ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
                  Submit for Approval
                </button>
              </form>
            </div>
          )}
        </div>
      </main>
      {user && <StudentAIAgent userId={user.id} />}
    </div>
  );
}
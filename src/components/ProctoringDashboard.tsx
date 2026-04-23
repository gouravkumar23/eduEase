"use client";

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ChevronLeft, 
  Activity, 
  ShieldAlert, 
  Camera, 
  Search, 
  Clock,
  User,
  ExternalLink,
  Power,
  RotateCcw,
  Ban,
  RefreshCcw
} from 'lucide-react';
import { db } from '../lib/firebase';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { useExams } from '../hooks/useExams';

interface Attempt {
  id: string;
  student_id: string;
  student_name: string;
  student_email: string;
  student_roll_number?: string;
  status: string;
  started_at: any;
  live_snapshot?: string;
  last_snapshot_at?: any;
  violation_count?: number;
  suspicion_score?: number;
  is_highly_suspicious?: boolean;
}

export default function ProctoringDashboard() {
  const { examId } = useParams();
  const navigate = useNavigate();
  const { forceSubmit, terminateAttempt, resetAttempt, restartAttempt } = useExams(false);
  
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'live' | 'suspicious'>('all');
  const [lastSync, setLastSync] = useState(new Date());
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    if (!examId) return;

    const q = query(
      collection(db, 'attempts'),
      where('exam_id', '==', examId),
      orderBy('started_at', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(d => ({ id: d.id, ...d.data() })) as Attempt[];
      setAttempts(data);
      setLastSync(new Date());
      setLoading(false);
    });

    return () => unsubscribe();
  }, [examId]);

  const handleTerminate = async (id: string) => {
    if (!confirm('TERMINATE EXAM: This will permanently end the exam for this student. Continue?')) return;
    setProcessingId(id);
    try {
      await terminateAttempt(id);
    } catch (error) {
      alert('Termination failed');
    } finally {
      setProcessingId(null);
    }
  };

  const handleReset = async (id: string) => {
    if (!confirm('RESET RESPONSES: This will clear all answers and move the student back to the first question. Continue?')) return;
    setProcessingId(id);
    try {
      await resetAttempt(id);
    } catch (error) {
      alert('Reset failed');
    } finally {
      setProcessingId(null);
    }
  };

  const filteredAttempts = attempts.filter(a => {
    const matchesSearch = a.student_name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         a.student_roll_number?.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (filterStatus === 'live') return matchesSearch && a.status === 'IN_PROGRESS';
    if (filterStatus === 'suspicious') return matchesSearch && (a.suspicion_score || 0) >= 4;
    return matchesSearch;
  }).sort((a, b) => (b.suspicion_score || 0) - (a.suspicion_score || 0));

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-500 font-bold animate-pulse">Connecting to Live Proctoring Feed...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-30 px-4 sm:px-8 h-20 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate('/faculty')}
            className="p-2 hover:bg-slate-100 rounded-xl text-slate-500 transition-colors"
          >
            <ChevronLeft size={24} />
          </button>
          <div>
            <h1 className="text-xl font-black text-slate-900 flex items-center gap-2">
              <Activity className="text-rose-500" size={24} />
              Live Proctoring
            </h1>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              Last Sync: {lastSync.toLocaleTimeString()}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden md:flex bg-slate-100 p-1 rounded-xl">
            <button 
              onClick={() => setFilterStatus('all')}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${filterStatus === 'all' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              All ({attempts.length})
            </button>
            <button 
              onClick={() => setFilterStatus('live')}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${filterStatus === 'live' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              Live ({attempts.filter(a => a.status === 'IN_PROGRESS').length})
            </button>
            <button 
              onClick={() => setFilterStatus('suspicious')}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${filterStatus === 'suspicious' ? 'bg-white text-rose-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              Suspicious ({attempts.filter(a => (a.suspicion_score || 0) >= 4).length})
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 p-4 sm:p-8 max-w-[1600px] mx-auto w-full">
        {/* Search Bar */}
        <div className="mb-8 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
          <input 
            type="text" 
            placeholder="Search student by name or roll number..." 
            className="w-full pl-12 pr-4 py-4 bg-white border border-slate-200 rounded-2xl shadow-sm outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-medium"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {filteredAttempts.length === 0 ? (
          <div className="bg-white rounded-3xl border border-dashed border-slate-300 p-20 text-center">
            <User className="mx-auto text-slate-200 mb-4" size={64} />
            <h3 className="text-xl font-bold text-slate-900">No students found</h3>
            <p className="text-slate-500">Try adjusting your search or filters.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredAttempts.map((attempt) => (
              <div 
                key={attempt.id} 
                className={`bg-white rounded-3xl border-2 overflow-hidden transition-all hover:shadow-xl group ${
                  attempt.is_highly_suspicious ? 'border-rose-500 ring-4 ring-rose-50' : 
                  (attempt.suspicion_score || 0) >= 4 ? 'border-amber-400' : 'border-slate-100'
                }`}
              >
                {/* Thumbnail Area */}
                <div className="aspect-video bg-slate-900 relative">
                  {attempt.live_snapshot ? (
                    <img 
                      src={attempt.live_snapshot} 
                      alt={attempt.student_name} 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-slate-600 gap-2">
                      <Camera size={32} className="opacity-20" />
                      <span className="text-[10px] font-bold uppercase tracking-widest">No Live Feed</span>
                    </div>
                  )}

                  {/* Status Overlay */}
                  <div className="absolute top-3 left-3 flex flex-col gap-2">
                    <div className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider backdrop-blur-md border ${
                      attempt.status === 'IN_PROGRESS' 
                        ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' 
                        : attempt.status === 'TERMINATED'
                        ? 'bg-rose-500/20 text-rose-400 border-rose-500/30'
                        : 'bg-slate-500/20 text-slate-300 border-slate-500/30'
                    }`}>
                      {attempt.status === 'IN_PROGRESS' ? '● Live' : attempt.status}
                    </div>
                  </div>

                  {/* Suspicion Badge */}
                  {(attempt.suspicion_score || 0) > 0 && (
                    <div className={`absolute top-3 right-3 px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider shadow-lg flex items-center gap-1.5 ${
                      attempt.is_highly_suspicious ? 'bg-rose-600 text-white' : 'bg-amber-500 text-white'
                    }`}>
                      <ShieldAlert size={12} />
                      Score: {attempt.suspicion_score}
                    </div>
                  )}

                  {/* Faculty Quick Actions */}
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    {attempt.status === 'IN_PROGRESS' && (
                      <>
                        <button 
                          onClick={() => handleTerminate(attempt.id)}
                          disabled={processingId === attempt.id}
                          className="p-3 bg-rose-600 text-white rounded-2xl hover:bg-rose-700 transition-all shadow-lg"
                          title="Terminate Exam"
                        >
                          <Ban size={20} />
                        </button>
                        <button 
                          onClick={() => handleReset(attempt.id)}
                          disabled={processingId === attempt.id}
                          className="p-3 bg-amber-500 text-white rounded-2xl hover:bg-amber-600 transition-all shadow-lg"
                          title="Reset Responses"
                        >
                          <RefreshCcw size={20} />
                        </button>
                        <button 
                          onClick={() => forceSubmit(attempt.id)}
                          disabled={processingId === attempt.id}
                          className="p-3 bg-indigo-600 text-white rounded-2xl hover:bg-indigo-700 transition-all shadow-lg"
                          title="Force Submit"
                        >
                          <Power size={20} />
                        </button>
                      </>
                    )}
                    <button 
                      onClick={() => restartAttempt(attempt.id)}
                      disabled={processingId === attempt.id}
                      className="p-3 bg-slate-700 text-white rounded-2xl hover:bg-slate-800 transition-all shadow-lg"
                      title="Restart Attempt"
                    >
                      <RotateCcw size={20} />
                    </button>
                  </div>
                </div>

                {/* Info Area */}
                <div className="p-5">
                  <div className="flex justify-between items-start mb-4">
                    <div className="min-w-0">
                      <h3 className="font-black text-slate-900 truncate leading-tight">{attempt.student_name}</h3>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                        {attempt.student_roll_number || 'No Roll No.'}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] font-black text-slate-400 uppercase">Violations</p>
                      <p className={`text-lg font-black ${attempt.violation_count ? 'text-rose-600' : 'text-slate-300'}`}>
                        {attempt.violation_count || 0}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-slate-50">
                    <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400">
                      <Clock size={12} />
                      Started {attempt.started_at?.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                    <button 
                      onClick={() => navigate(`/faculty/violations?student=${attempt.student_id}`)}
                      className="text-[10px] font-black text-indigo-600 uppercase tracking-widest hover:underline flex items-center gap-1"
                    >
                      View Logs <ExternalLink size={10} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
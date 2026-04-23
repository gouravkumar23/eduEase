import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, RefreshCw, Activity, Camera, Mic, AlertTriangle, Power, RotateCcw, ShieldAlert, Ban, RefreshCcw } from 'lucide-react';
import { db } from '../lib/firebase';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { useExams } from '../hooks/useExams';

interface Attempt {
  id: string;
  student_name: string;
  student_email: string;
  student_roll_number?: string;
  status: string;
  started_at: any;
  live_snapshot?: string;
  live_noise_level?: number;
  last_snapshot_at?: any;
  violation_count?: number;
}

export default function LiveMonitor() {
  const { examId } = useParams();
  const navigate = useNavigate();
  const { forceSubmit, terminateAttempt, resetAttempt, restartAttempt } = useExams(false);
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    if (!examId) return;

    const attemptsRef = collection(db, 'attempts');
    const q = query(attemptsRef, where('exam_id', '==', examId), orderBy('started_at', 'desc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const attemptsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Attempt[];
      
      setAttempts(attemptsData);
      setLastUpdated(new Date());
      setLoading(false);
    }, (error) => {
      console.error('Monitor error:', error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [examId]);

  const handleForceSubmit = async (id: string) => {
    if (!confirm('Are you sure you want to force-submit this exam?')) return;
    setProcessingId(id);
    try {
      await forceSubmit(id);
    } catch (error) {
      alert('Action failed');
    } finally {
      setProcessingId(null);
    }
  };

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

  const handleRestart = async (id: string) => {
    if (!confirm('This will delete the current attempt and clear all answers. Proctoring logs will be preserved. Continue?')) return;
    setProcessingId(id);
    try {
      await restartAttempt(id);
    } catch (error) {
      alert('Action failed');
    } finally {
      setProcessingId(null);
    }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-slate-500 font-medium">Connecting to live feed...</p>
      </div>
    </div>
  );

  const activeAttempts = attempts.filter(a => a.status === 'IN_PROGRESS');

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <button onClick={() => navigate('/faculty')} className="flex items-center gap-2 text-slate-500 hover:text-slate-900 transition-colors mb-2">
              <ChevronLeft size={20} /> Back to Dashboard
            </button>
            <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
              <Activity className="text-rose-500" />
              Live Proctoring Monitor
            </h1>
          </div>
          <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-xl border shadow-sm">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
              <RefreshCw size={14} className="animate-spin-slow" />
              Last Sync: {lastUpdated.toLocaleTimeString()}
            </div>
            <div className="w-px h-4 bg-slate-200"></div>
            <div className="text-xs font-bold text-emerald-600">
              {activeAttempts.length} Active Students
            </div>
          </div>
        </div>

        {attempts.length === 0 ? (
          <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-12 text-center">
            <Activity className="mx-auto text-slate-300 mb-4" size={48} />
            <h3 className="text-lg font-semibold text-slate-900">No attempts found</h3>
            <p className="text-slate-500">No students have started this examination yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {attempts.map(attempt => (
              <div key={attempt.id} className={`bg-white rounded-2xl border overflow-hidden shadow-sm transition-all ${attempt.status === 'IN_PROGRESS' ? 'border-blue-200 ring-2 ring-blue-50' : 'border-slate-200 opacity-75'}`}>
                <div className="p-4 border-b bg-slate-50/50 flex items-center justify-between">
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-slate-900 truncate">{attempt.student_name}</p>
                    <div className="flex items-center gap-1.5 text-[10px] text-slate-500 font-medium">
                      <span className="bg-slate-200 px-1.5 py-0.5 rounded text-slate-700">{attempt.student_roll_number || 'N/A'}</span>
                    </div>
                  </div>
                  <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded-full ${
                    attempt.status === 'IN_PROGRESS' ? 'bg-emerald-100 text-emerald-700 animate-pulse' : 
                    attempt.status === 'TERMINATED' ? 'bg-rose-100 text-rose-700' : 'bg-slate-100 text-slate-600'
                  }`}>
                    {attempt.status === 'IN_PROGRESS' ? '● Live' : attempt.status}
                  </span>
                </div>

                <div className="aspect-video bg-slate-900 relative group">
                  {attempt.live_snapshot ? (
                    <img 
                      src={`${attempt.live_snapshot}?t=${attempt.last_snapshot_at?.toMillis() || Date.now()}`} 
                      alt="Live Feed" 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-slate-500 gap-2">
                      <Camera size={32} className="opacity-20" />
                      <span className="text-[10px] font-medium">No Feed Available</span>
                    </div>
                  )}
                  
                  {attempt.status === 'IN_PROGRESS' && (
                    <div className="absolute bottom-2 left-2 right-2 flex justify-between items-center">
                      <div className="flex items-center gap-1.5 bg-black/60 backdrop-blur-md px-2 py-1 rounded-lg text-white">
                        <Mic size={10} className={attempt.live_noise_level && attempt.live_noise_level > 80 ? "text-rose-400" : "text-emerald-400"} />
                        <span className="text-[10px] font-bold">{attempt.live_noise_level || 0}dB</span>
                      </div>
                      
                      {(attempt.violation_count || 0) > 0 && (
                        <div className="flex items-center gap-1 bg-rose-600 px-2 py-1 rounded-lg text-white animate-bounce">
                          <ShieldAlert size={10} />
                          <span className="text-[10px] font-black">{attempt.violation_count}</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Faculty Controls Overlay */}
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    {attempt.status === 'IN_PROGRESS' && (
                      <>
                        <button 
                          onClick={() => handleTerminate(attempt.id)}
                          disabled={processingId === attempt.id}
                          className="p-2.5 bg-rose-600 text-white rounded-xl hover:bg-rose-700 transition-colors"
                          title="Terminate Exam"
                        >
                          <Ban size={18} />
                        </button>
                        <button 
                          onClick={() => handleReset(attempt.id)}
                          disabled={processingId === attempt.id}
                          className="p-2.5 bg-amber-500 text-white rounded-xl hover:bg-amber-600 transition-colors"
                          title="Reset Responses"
                        >
                          <RefreshCcw size={18} />
                        </button>
                        <button 
                          onClick={() => handleForceSubmit(attempt.id)}
                          disabled={processingId === attempt.id}
                          className="p-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors"
                          title="Force Submit"
                        >
                          <Power size={18} />
                        </button>
                      </>
                    )}
                    <button 
                      onClick={() => handleRestart(attempt.id)}
                      disabled={processingId === attempt.id}
                      className="p-2.5 bg-slate-700 text-white rounded-xl hover:bg-slate-800 transition-colors"
                      title="Restart Attempt"
                    >
                      <RotateCcw size={18} />
                    </button>
                  </div>
                </div>

                <div className="p-3 bg-white">
                  <div className="flex items-center justify-between text-[10px] text-slate-500">
                    <span className="flex items-center gap-1">
                      Started: {attempt.started_at?.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    {(attempt.violation_count || 0) >= 2 && (
                      <span className="flex items-center gap-1 text-rose-600 font-bold">
                        <AlertTriangle size={10} /> Critical Risk
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
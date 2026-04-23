import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ExamTimer from './ExamTimer';
import CameraProctor, { CameraProctorHandle } from './CameraProctor';
import { Wifi, WifiOff, Maximize, AlertCircle, ShieldAlert, Ban, RefreshCcw, ChevronLeft, ChevronRight, CheckCircle2, Loader2 } from 'lucide-react';
import { db } from '../lib/firebase';
import { doc, getDoc, collection, query, where, getDocs, updateDoc, serverTimestamp, onSnapshot } from 'firebase/firestore';
import { useProctoring } from '../hooks/useProctoring';
import { ExamWatermark } from './ExamWatermark';
import { ExamSummaryModal } from './ExamSummaryModal';
import { ExamNavigator } from './ExamNavigator';
import { useAuth } from '../contexts/AuthContext';
import { notifyEvent } from '../utils/notifications';
import { templates } from '../utils/emailTemplates';

export default function ExamInterface() {
  const { examId, attemptId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [exam, setExam] = useState<any>(null);
  const [attempt, setAttempt] = useState<any>(null);
  const [allocations, setAllocations] = useState<any[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showSummary, setShowSummary] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [isTerminated, setIsTerminated] = useState(false);
  const [showResetPopup, setShowResetPopup] = useState(false);
  
  const answersRef = useRef<Record<string, string>>({});
  const proctorRef = useRef<CameraProctorHandle>(null);
  const lastResetAtRef = useRef<any>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const { isFullscreen, fullscreenNotSupported, requestFullscreen, handleViolation } = useProctoring({
    attemptId: attemptId!,
    studentId: user?.id || '',
    studentName: attempt?.student_name || user?.name || 'Unknown Student',
    examId: examId || '',
    examName: exam?.title || 'Unknown Exam',
    facultyId: exam?.faculty_id || '',
    submitting: submitting || isTerminated,
    onAutoSubmit: () => handleSubmitExam(true),
    showToast,
    onCaptureSnapshot: async () => {
      if (proctorRef.current) {
        return await proctorRef.current.takeSnapshot();
      }
      return null;
    }
  });

  useEffect(() => {
    if (!attemptId) return;

    const unsubscribe = onSnapshot(doc(db, 'attempts', attemptId), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setAttempt({ id: docSnap.id, ...data });
        
        if (data.status === 'TERMINATED' && !isTerminated) {
          setIsTerminated(true);
          handleSubmitExam(true);
        }

        if (data.last_reset_at && (!lastResetAtRef.current || data.last_reset_at.toMillis() > lastResetAtRef.current.toMillis())) {
          lastResetAtRef.current = data.last_reset_at;
          handleResetEvent();
        }
      }
    });

    return () => unsubscribe();
  }, [attemptId, isTerminated]);

  const handleResetEvent = () => {
    setAnswers({});
    setCurrentIndex(0);
    localStorage.removeItem(`exam_answers_${attemptId}`);
    setShowResetPopup(true);
    setTimeout(() => setShowResetPopup(false), 5000);
  };

  useEffect(() => {
    if (!user || !attemptId) return;

    const unsubscribe = onSnapshot(doc(db, 'users', user.id), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        const localSid = localStorage.getItem('sessionId');
        
        if (data.activeSessionId && data.activeSessionId !== localSid && !submitting && !isTerminated) {
          handleSubmitExam(true);
        }
      }
    });

    return () => unsubscribe();
  }, [user, attemptId, submitting, isTerminated]);

  useEffect(() => {
    answersRef.current = answers;
    if (attemptId && Object.keys(answers).length > 0) {
      localStorage.setItem(`exam_answers_${attemptId}`, JSON.stringify(answers));
    }
  }, [answers, attemptId]);

  useEffect(() => {
    const currentAlloc = allocations[currentIndex];
    if (!currentAlloc || submitting || isTerminated) return;
    const answer = answers[currentAlloc.question_id];
    if (answer === undefined) return;
    const timer = setTimeout(async () => {
      try {
        await updateDoc(doc(db, 'allocations', currentAlloc.id), {
          student_answer: String(answer),
          last_updated_at: serverTimestamp(),
        });
      } catch (error) {}
    }, 500);
    return () => clearTimeout(timer);
  }, [answers, currentIndex, allocations, submitting, isTerminated]);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    if (attemptId && examId) fetchExamAndQuestions();
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [examId, attemptId]);

  const fetchExamAndQuestions = async () => {
    try {
      const [examDoc, attemptDoc] = await Promise.all([
        getDoc(doc(db, 'exams', examId!)),
        getDoc(doc(db, 'attempts', attemptId!))
      ]);
      if (!examDoc.exists() || !attemptDoc.exists()) return navigate('/student');
      setExam({ id: examDoc.id, ...examDoc.data() });
      setAttempt({ id: attemptDoc.id, ...attemptDoc.data() });
      const q = query(collection(db, 'allocations'), where('attempt_id', '==', attemptId));
      const snap = await getDocs(q);
      const allocData = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setAllocations(allocData);
      const saved = localStorage.getItem(`exam_answers_${attemptId}`);
      if (saved) setAnswers(JSON.parse(saved));
      else {
        const initial: Record<string, string> = {};
        allocData.forEach((a: any) => initial[a.question_id] = String(a.student_answer || ''));
        setAnswers(initial);
      }
    } catch (error) { navigate('/student'); }
    finally { setLoading(false); }
  };

  const cleanupHardwareAndFullscreen = async () => {
    // 1. Exit Fullscreen
    if (document.fullscreenElement || (document as any).webkitFullscreenElement) {
      try {
        if (document.exitFullscreen) await document.exitFullscreen();
        else if ((document as any).webkitExitFullscreen) await (document as any).webkitExitFullscreen();
      } catch (e) {
        console.warn("Failed to exit fullscreen:", e);
      }
    }
    // Note: Camera and Mic are automatically stopped by the CameraProctor component's 
    // useEffect cleanup when we navigate away from this page.
  };

  const handleSubmitExam = async (isForced = false) => {
    if (submitting) return;
    setSubmitting(true);
    
    try {
      const currentAnswers = answersRef.current;
      let obtained = 0;
      allocations.forEach((a) => {
        if (a.questions.question_type === 'mcq' && String(currentAnswers[a.question_id] || '').trim().toUpperCase() === String(a.questions.correct_option || '').trim().toUpperCase()) {
          obtained += (a.score_weight || 1);
        }
      });
      const score = attempt.total_exam_score > 0 ? Math.round((obtained / attempt.total_exam_score) * 100) : 0;
      
      const finalStatus = isTerminated ? 'TERMINATED' : (isForced ? 'AUTO_SUBMITTED' : 'SUBMITTED');
      
      await updateDoc(doc(db, 'attempts', attemptId!), {
        status: finalStatus,
        submitted_at: serverTimestamp(),
        score,
        obtained_score: obtained
      });

      if (attempt.violation_count > 0 && user) {
        await notifyEvent({
          type: 'warning',
          title: 'Integrity Report',
          message: `You had ${attempt.violation_count} proctoring violations during "${exam.title}".`,
          userIds: [user.id],
          emailPayload: {
            subject: 'Proctoring Integrity Summary',
            html: templates.violationSummary(user.name, exam.title, attempt.violation_count)
          }
        });
      }

      localStorage.removeItem(`exam_answers_${attemptId}`);
      
      // Cleanup before navigation
      await cleanupHardwareAndFullscreen();
      
      if (!isTerminated) navigate('/student');
    } catch (error) { 
      setSubmitting(false); 
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="w-10 h-10 text-indigo-600 animate-spin" />
        <p className="text-slate-500 font-bold">Loading Secure Interface...</p>
      </div>
    </div>
  );

  if (isTerminated) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6 text-center">
        <div className="max-w-md w-full bg-white rounded-3xl p-10 shadow-2xl animate-in zoom-in duration-300">
          <div className="w-20 h-20 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <Ban size={40} />
          </div>
          <h1 className="text-2xl font-black text-slate-900 mb-4">Exam Terminated</h1>
          <p className="text-slate-600 mb-8 leading-relaxed">
            Your examination session has been <span className="text-rose-600 font-bold">terminated by the faculty</span>. 
            Your current progress has been saved and submitted.
          </p>
          <button 
            onClick={() => navigate('/student')}
            className="w-full bg-slate-900 text-white py-4 rounded-2xl font-bold hover:bg-slate-800 transition-all"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const currentAlloc = allocations[currentIndex];
  const currentQ = currentAlloc.questions;
  const attempted = Object.keys(answers).filter(k => String(answers[k]).trim() !== '').length;

  return (
    <div className="min-h-screen bg-slate-50 select-none relative overflow-hidden flex flex-col" onContextMenu={e => e.preventDefault()}>
      {/* OCR-Friendly Watermark Layer */}
      <ExamWatermark 
        studentName={attempt.student_name} 
        studentId={user?.id || 'N/A'}
        examTitle={exam.title} 
        expiresAt={attempt.expires_at}
      />
      
      {toast && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[200] bg-slate-900 text-white px-6 py-3 rounded-2xl shadow-2xl font-bold flex items-center gap-3 animate-in fade-in slide-in-from-top-4">
          <AlertCircle className="text-amber-400" size={20} />
          {toast}
        </div>
      )}
      
      {showResetPopup && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[200] bg-amber-600 text-white px-8 py-4 rounded-2xl shadow-2xl font-bold flex items-center gap-3 animate-in slide-in-from-top-8 duration-500">
          <RefreshCcw className="animate-spin" size={24} />
          <div>
            <p className="text-lg">Responses Reset</p>
            <p className="text-xs opacity-90">Admin has reset your responses. Please start again.</p>
          </div>
        </div>
      )}

      <ExamSummaryModal 
        isOpen={showSummary} 
        total={allocations.length} 
        attempted={attempted} 
        unattempted={allocations.length - attempted} 
        onClose={() => setShowSummary(false)} 
        onConfirm={() => handleSubmitExam(false)} 
      />
      
      {!isFullscreen && !submitting && !fullscreenNotSupported && (
        <div className="fixed inset-0 z-[150] bg-slate-900 flex flex-col items-center justify-center p-6 text-center">
          <Maximize size={64} className="text-indigo-500 mb-6 animate-pulse" />
          <h2 className="text-3xl font-black text-white mb-4">Security Protocol Required</h2>
          <p className="text-slate-400 mb-8 max-w-md">This examination must be taken in fullscreen mode to ensure integrity. Exiting fullscreen records a violation.</p>
          <button 
            onClick={requestFullscreen} 
            className="bg-indigo-600 text-white px-10 py-4 rounded-2xl font-black text-lg hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-500/20"
          >
            Enter Secure Mode
          </button>
        </div>
      )}

      {/* Header */}
      <header className="bg-white border-b h-16 flex items-center justify-between px-4 sm:px-8 relative z-10 shrink-0">
        <div className="flex items-center gap-4">
          <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
            <ShieldAlert size={20} />
          </div>
          <div>
            <h1 className="font-black text-slate-900 truncate max-w-[200px] sm:max-w-md">{exam.title}</h1>
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-emerald-500' : 'bg-rose-500 animate-pulse'}`} />
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                {isOnline ? 'Secure Connection' : 'Offline - Reconnecting...'}
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="hidden sm:block text-right">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Student</p>
            <p className="text-xs font-bold text-slate-700">{attempt.student_name}</p>
          </div>
          <button 
            onClick={() => setShowSummary(true)}
            className="bg-rose-600 text-white px-4 py-2 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-rose-700 transition-all shadow-lg shadow-rose-500/20"
          >
            Finish Exam
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-hidden flex flex-col lg:flex-row relative z-10">
        {/* Question Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-8">
          <div className="max-w-3xl mx-auto">
            <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="p-6 sm:p-10">
                <div className="flex items-center justify-between mb-8">
                  <span className="px-3 py-1 bg-slate-100 text-slate-600 rounded-lg text-[10px] font-black uppercase tracking-widest">
                    Question {currentIndex + 1} of {allocations.length}
                  </span>
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    Weight: {currentAlloc.score_weight} Points
                  </span>
                </div>

                <h2 className="text-xl sm:text-2xl font-bold text-slate-900 leading-relaxed mb-8">
                  {currentQ.text}
                </h2>

                {currentQ.imageUrl && (
                  <div className="mb-8 rounded-2xl overflow-hidden border border-slate-100 bg-slate-50">
                    <img src={currentQ.imageUrl} className="max-w-full h-auto mx-auto" alt="Question Visual" />
                  </div>
                )}

                <div className="space-y-4">
                  {currentQ.question_type === 'mcq' ? (
                    <div className="grid grid-cols-1 gap-3">
                      {['A', 'B', 'C', 'D'].map(opt => (
                        <label 
                          key={opt} 
                          className={`flex items-center p-5 border-2 rounded-2xl cursor-pointer transition-all ${
                            answers[currentQ.id] === opt 
                              ? 'border-indigo-600 bg-indigo-50 ring-4 ring-indigo-500/5' 
                              : 'border-slate-100 hover:border-slate-200 hover:bg-slate-50'
                          }`}
                        >
                          <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${
                            answers[currentQ.id] === opt ? 'border-indigo-600 bg-indigo-600' : 'border-slate-300'
                          }`}>
                            {answers[currentQ.id] === opt && <div className="w-2 h-2 bg-white rounded-full" />}
                          </div>
                          <div className="ml-4">
                            <span className="text-xs font-black text-slate-400 uppercase mr-2">{opt}.</span>
                            <span className={`text-sm font-bold ${answers[currentQ.id] === opt ? 'text-indigo-900' : 'text-slate-700'}`}>
                              {currentQ[`option_${opt.toLowerCase()}`]}
                            </span>
                          </div>
                          <input 
                            type="radio" 
                            className="hidden"
                            checked={answers[currentQ.id] === opt} 
                            onChange={() => setAnswers(prev => ({ ...prev, [currentQ.id]: opt }))} 
                          />
                        </label>
                      ))}
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Your Response</label>
                      <textarea 
                        value={answers[currentQ.id] || ''} 
                        onChange={e => setAnswers(prev => ({ ...prev, [currentQ.id]: e.target.value }))} 
                        className="w-full border-2 border-slate-100 p-6 rounded-3xl h-64 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all text-slate-700 font-medium leading-relaxed" 
                        placeholder="Type your detailed answer here..." 
                      />
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-slate-50 p-6 flex justify-between items-center border-t border-slate-100">
                <button 
                  onClick={() => setCurrentIndex(Math.max(0, currentIndex - 1))} 
                  disabled={currentIndex === 0}
                  className="flex items-center gap-2 px-6 py-3 bg-white border border-slate-200 rounded-xl font-black text-xs uppercase tracking-widest text-slate-600 hover:bg-slate-100 disabled:opacity-30 transition-all"
                >
                  <ChevronLeft size={16} /> Previous
                </button>
                <div className="flex gap-3">
                  {currentIndex < allocations.length - 1 ? (
                    <button 
                      onClick={() => setCurrentIndex(currentIndex + 1)} 
                      className="flex items-center gap-2 px-8 py-3 bg-indigo-600 text-white rounded-xl font-black text-xs uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-500/20"
                    >
                      Next Question <ChevronRight size={16} />
                    </button>
                  ) : (
                    <button 
                      onClick={() => setShowSummary(true)}
                      className="flex items-center gap-2 px-8 py-3 bg-emerald-600 text-white rounded-xl font-black text-xs uppercase tracking-widest hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-500/20"
                    >
                      Review & Submit <CheckCircle2 size={16} />
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <aside className="w-full lg:w-80 bg-white border-l border-slate-200 p-4 sm:p-6 overflow-y-auto shrink-0">
          <div className="space-y-6">
            <ExamTimer 
              expiresAt={attempt.expires_at} 
              durationMinutes={exam.duration} 
              onTimeExpired={() => handleSubmitExam(true)} 
            />
            
            <CameraProctor ref={proctorRef} onViolation={handleViolation} />
            
            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                <RefreshCcw size={12} /> Question Navigator
              </h3>
              <ExamNavigator 
                allocations={allocations} 
                currentIndex={currentIndex} 
                answers={answers} 
                onSelect={setCurrentIndex} 
              />
            </div>

            <div className="p-4 bg-amber-50 border border-amber-100 rounded-2xl">
              <div className="flex items-center gap-2 text-amber-700 mb-2">
                <ShieldAlert size={16} />
                <span className="text-[10px] font-black uppercase tracking-widest">Security Notice</span>
              </div>
              <p className="text-[10px] text-amber-800 leading-relaxed font-medium">
                Your session is being monitored. All actions, including tab switches and window resizing, are logged with photographic evidence.
              </p>
            </div>
          </div>
        </aside>
      </main>
    </div>
  );
}
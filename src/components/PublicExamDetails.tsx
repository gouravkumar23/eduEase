"use client";

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { useExams } from '../hooks/useExams';
import { 
  Clock, 
  Calendar, 
  BookOpen, 
  FileText, 
  User, 
  ArrowLeft, 
  Play, 
  ShieldAlert,
  Info,
  HelpCircle
} from 'lucide-react';

export default function PublicExamDetails() {
  const { examId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { startExam, startingExamId } = useExams(true);
  const [exam, setExam] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchExam = async () => {
      if (!examId) return;
      try {
        const examDoc = await getDoc(doc(db, 'exams', examId));
        if (examDoc.exists()) {
          setExam({ id: examDoc.id, ...examDoc.data() });
        }
      } catch (error) {
        console.error("Error fetching exam details:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchExam();
  }, [examId]);

  const handleStart = async () => {
    if (!user) {
      // Save intent and redirect to login
      localStorage.setItem('pendingExamId', examId!);
      navigate('/auth');
      return;
    }

    if (user.role !== 'student') {
      alert("Only students can take examinations.");
      return;
    }

    try {
      await startExam(exam);
    } catch (error) {
      console.error("Failed to start exam:", error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!exam) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 text-center">
        <div className="w-20 h-20 bg-slate-200 rounded-full flex items-center justify-center mb-6">
          <FileText size={40} className="text-slate-400" />
        </div>
        <h1 className="text-2xl font-bold text-slate-900">Assessment Not Found</h1>
        <p className="text-slate-500 mt-2">The examination you are looking for does not exist or has been removed.</p>
        <button 
          onClick={() => navigate('/')}
          className="mt-8 flex items-center gap-2 text-indigo-600 font-bold hover:underline"
        >
          <ArrowLeft size={20} /> Back to Home
        </button>
      </div>
    );
  }

  const startTime = exam.start_time?.toDate?.();
  const endTime = exam.end_time?.toDate?.();

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden">
          {/* Header */}
          <div className="bg-indigo-600 p-8 text-white relative">
            <button 
              onClick={() => navigate(-1)}
              className="absolute top-4 left-4 p-2 bg-white/20 hover:bg-white/30 rounded-full text-white transition-all backdrop-blur-md"
            >
              <ArrowLeft size={20} />
            </button>
            
            <div className="mt-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="px-2 py-0.5 bg-white/20 rounded text-[10px] font-bold uppercase tracking-wider">
                  {exam.exam_mode} Assessment
                </span>
              </div>
              <h1 className="text-3xl font-bold mb-2">{exam.title}</h1>
              <p className="text-indigo-100 flex items-center gap-2">
                <BookOpen size={18} /> {exam.subject}
              </p>
            </div>
          </div>

          <div className="p-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
              <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <div className="p-2 bg-white rounded-lg text-indigo-600">
                  <Clock size={20} />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Duration</p>
                  <p className="text-sm font-bold text-slate-700">{exam.duration} Minutes</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <div className="p-2 bg-white rounded-lg text-emerald-600">
                  <HelpCircle size={20} />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Questions</p>
                  <p className="text-sm font-bold text-slate-700">{exam.questions_per_student || 'N/A'} Items</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <div className="p-2 bg-white rounded-lg text-amber-600">
                  <User size={20} />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Faculty</p>
                  <p className="text-sm font-bold text-slate-700">{exam.faculty_name}</p>
                </div>
              </div>
            </div>

            <div className="space-y-8">
              <section>
                <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
                  <Calendar size={18} className="text-indigo-600" />
                  Examination Schedule
                </h3>
                <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100">
                  <div className="flex flex-col sm:flex-row justify-between gap-4">
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Starts At</p>
                      <p className="text-sm font-bold text-slate-700">
                        {startTime ? startTime.toLocaleString() : 'Not Scheduled'}
                      </p>
                    </div>
                    <div className="hidden sm:block w-px bg-slate-200"></div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Ends At</p>
                      <p className="text-sm font-bold text-slate-700">
                        {endTime ? endTime.toLocaleString() : 'Not Scheduled'}
                      </p>
                    </div>
                  </div>
                </div>
              </section>

              {exam.instructions && (
                <section>
                  <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
                    <Info size={18} className="text-indigo-600" />
                    Instructions
                  </h3>
                  <div className="prose prose-slate max-w-none">
                    <p className="text-slate-600 leading-relaxed whitespace-pre-wrap">
                      {exam.instructions}
                    </p>
                  </div>
                </section>
              )}

              <div className="bg-amber-50 border border-amber-100 rounded-2xl p-6 flex items-start gap-4">
                <ShieldAlert className="text-amber-600 shrink-0" size={24} />
                <div>
                  <h4 className="text-sm font-bold text-amber-900 mb-1">Proctoring Enabled</h4>
                  <p className="text-xs text-amber-700 leading-relaxed">
                    This examination uses AI-driven proctoring. Your camera and microphone will be monitored throughout the session. Ensure you are in a quiet, well-lit environment.
                  </p>
                </div>
              </div>

              <div className="pt-8 border-t border-slate-100">
                <button 
                  onClick={handleStart}
                  disabled={startingExamId === exam.id}
                  className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 flex items-center justify-center gap-3"
                >
                  {startingExamId === exam.id ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <Play size={20} />
                  )}
                  {user ? 'Start Examination Now' : 'Login to Start Exam'}
                </button>
                {!user && (
                  <p className="text-center text-[10px] text-slate-400 mt-4 uppercase font-bold tracking-widest">
                    Authentication required to track progress and results
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
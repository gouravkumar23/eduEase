"use client";

import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, CheckCircle2, XCircle, Award, BookOpen, Target, AlertCircle, Lock, EyeOff, Share2, Loader2, BrainCircuit, ClipboardList, Key } from 'lucide-react';
import { db } from '../lib/firebase';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { toPng } from 'html-to-image';
import ResultShareCard from './ResultShareCard';
import ExamAIHelper from './ExamAIHelper';

interface Question {
  id: string;
  text: string;
  question_type: 'mcq' | 'descriptive';
  option_a?: string;
  option_b?: string;
  option_c?: string;
  option_d?: string;
  correct_option?: string;
}

interface Allocation {
  id: string;
  student_answer: string;
  score_weight: number;
  questions: Question;
}

export default function StudentResults() {
  const { attemptId } = useParams();
  const navigate = useNavigate();
  const [attempt, setAttempt] = useState<any>(null);
  const [exam, setExam] = useState<any>(null);
  const [allocations, setAllocations] = useState<Allocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [sharing, setSharing] = useState(false);
  const [percentile, setPercentile] = useState(0);
  const [activeTab, setActiveTab] = useState<'review' | 'ai-coach'>('review');
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchResults = async () => {
      if (!attemptId) return;
      try {
        const attemptDoc = await getDoc(doc(db, 'attempts', attemptId));
        if (!attemptDoc.exists()) {
          navigate('/student');
          return;
        }
        const attemptData = attemptDoc.data();
        setAttempt({ id: attemptDoc.id, ...attemptData });

        const examDoc = await getDoc(doc(db, 'exams', attemptData.exam_id));
        setExam({ id: examDoc.id, ...examDoc.data() });

        const q = query(collection(db, 'allocations'), where('attempt_id', '==', attemptId));
        const snap = await getDocs(q);
        setAllocations(snap.docs.map(d => ({ id: d.id, ...d.data() })) as Allocation[]);

        // Calculate Percentile
        const allAttemptsQ = query(
          collection(db, 'attempts'), 
          where('exam_id', '==', attemptData.exam_id),
          where('status', 'in', ['SUBMITTED', 'AUTO_SUBMITTED', 'GRADED'])
        );
        const allAttemptsSnap = await getDocs(allAttemptsQ);
        const allScores = allAttemptsSnap.docs.map(d => d.data().score || 0);
        const lowerScores = allScores.filter(s => s <= (attemptData.score || 0)).length;
        setPercentile((lowerScores / allScores.length) * 100);

      } catch (error) {
        console.error('Error fetching results:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchResults();
  }, [attemptId]);

  const handleShare = async () => {
    if (!cardRef.current) return;
    setSharing(true);
    try {
      const dataUrl = await toPng(cardRef.current, { cacheBust: true });
      const link = document.createElement('a');
      link.download = `Result_${exam.title.replace(/\s+/g, '_')}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('Failed to generate image:', err);
      alert('Failed to generate shareable card.');
    } finally {
      setSharing(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
    </div>
  );

  const resultsReleased = exam?.results_released === true;
  const answerKeyReleased = exam?.answer_key_released === true;

  if (!resultsReleased && !answerKeyReleased) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 text-center">
        <EyeOff size={64} className="text-slate-300 mb-4" />
        <h2 className="text-2xl font-bold text-slate-900">Results Not Released</h2>
        <p className="text-slate-500 mt-2">The faculty has not yet released the results or answer key for this examination.</p>
        <button onClick={() => navigate('/student')} className="mt-6 text-indigo-600 font-bold flex items-center gap-2">
          <ChevronLeft size={20} /> Back to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-4 sm:p-8">
      <ResultShareCard 
        studentName={attempt.student_name}
        examTitle={exam.title}
        score={attempt.score || 0}
        obtainedScore={attempt.obtained_score || 0}
        totalScore={attempt.total_exam_score || 0}
        percentile={percentile}
        cardRef={cardRef}
      />

      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <button onClick={() => navigate('/student')} className="flex items-center gap-2 text-slate-500 hover:text-slate-900 transition-colors">
            <ChevronLeft size={20} /> Back to Dashboard
          </button>
          {resultsReleased && (
            <button 
              onClick={handleShare}
              disabled={sharing}
              className="flex items-center gap-2 bg-white text-indigo-600 px-4 py-2 rounded-xl font-bold text-sm border border-indigo-100 shadow-sm hover:bg-indigo-50 transition-all disabled:opacity-50"
            >
              {sharing ? <Loader2 size={18} className="animate-spin" /> : <Share2 size={18} />}
              {sharing ? 'Generating...' : 'Share Result Card'}
            </button>
          )}
        </div>

        <div className="bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden mb-8">
          <div className="bg-indigo-600 p-8 text-white">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
              <div>
                <h1 className="text-3xl font-bold mb-2">{exam.title}</h1>
                <div className="flex flex-wrap gap-4 mt-4">
                  <p className="text-indigo-100 flex items-center gap-2 text-sm">
                    <BookOpen size={18} /> {exam.subject || 'General Assessment'}
                  </p>
                  {resultsReleased && (
                    <p className="text-indigo-100 flex items-center gap-2 text-sm">
                      <Target size={18} /> Total Marks: {attempt.total_exam_score || 0}
                    </p>
                  )}
                </div>
              </div>
              <div className="bg-white/10 backdrop-blur-md p-6 rounded-2xl border border-white/20 text-center min-w-[140px]">
                <Award className="mx-auto mb-2 text-amber-300" size={32} />
                {resultsReleased ? (
                  <div className="text-2xl font-black">
                    Score: {attempt.obtained_score || 0}/{attempt.total_exam_score || 0} ({attempt.score || 0}%)
                  </div>
                ) : (
                  <div className="text-xl font-bold flex items-center justify-center gap-2">
                    <Lock size={20} className="text-indigo-200" /> Score Hidden
                  </div>
                )}
                <div className="text-[10px] font-bold uppercase tracking-widest opacity-70 mt-2">Final Result</div>
              </div>
            </div>
          </div>

          <div className="flex border-b border-slate-100">
            <button 
              onClick={() => setActiveTab('review')}
              className={`flex-1 py-4 text-sm font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${activeTab === 'review' ? 'text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50/30' : 'text-slate-400 hover:text-slate-600'}`}
            >
              <ClipboardList size={18} />
              Performance Review
            </button>
            {answerKeyReleased && (
              <button 
                onClick={() => setActiveTab('ai-coach')}
                className={`flex-1 py-4 text-sm font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${activeTab === 'ai-coach' ? 'text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50/30' : 'text-slate-400 hover:text-slate-600'}`}
              >
                <BrainCircuit size={18} />
                AI Performance Coach
              </button>
            )}
          </div>

          <div className="p-8">
            {activeTab === 'review' ? (
              <div className="space-y-8">
                {allocations.map((alloc, index) => {
                  const q = alloc.questions;
                  const studentAnswer = String(alloc.student_answer || '').trim();
                  const correctAnswer = String(q.correct_option || '').trim();
                  const isAttempted = studentAnswer !== '';
                  const isCorrect = isAttempted && q.question_type === 'mcq' && studentAnswer.toUpperCase() === correctAnswer.toUpperCase();
                  const pointsEarned = isCorrect ? alloc.score_weight : 0;
                  
                  return (
                    <div key={alloc.id} className="border-b border-slate-100 last:border-0 pb-8 last:pb-0">
                      <div className="flex gap-4">
                        <div className="shrink-0 w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center font-bold text-slate-500 text-sm">
                          {index + 1}
                        </div>
                        <div className="flex-1">
                          <div className="flex justify-between items-start mb-4">
                            <p className="text-lg font-medium text-slate-800">{q.text}</p>
                            {resultsReleased && (
                              <div className="text-right">
                                <span className={`text-xs font-bold px-2 py-1 rounded ${!isAttempted ? 'bg-slate-100 text-slate-500' : isCorrect ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                                  {pointsEarned} / {alloc.score_weight} Points
                                </span>
                              </div>
                            )}
                          </div>
                          
                          {q.question_type === 'mcq' ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                              {['A', 'B', 'C', 'D'].map((opt) => {
                                const optionText = q[`option_${opt.toLowerCase()}` as keyof Question];
                                const isCorrectOption = correctAnswer.toUpperCase() === opt;
                                const isStudentChoice = studentAnswer.toUpperCase() === opt;

                                let borderClass = 'border-slate-100';
                                let bgClass = 'bg-white';
                                let textClass = 'text-slate-600';
                                let iconBg = 'bg-slate-200';
                                let iconText = 'text-slate-500';

                                // Logic for Student Choice (Only if results are released)
                                if (isStudentChoice && resultsReleased) {
                                  borderClass = 'border-indigo-500';
                                  bgClass = 'bg-indigo-50';
                                  textClass = 'text-indigo-900';
                                  iconBg = 'bg-indigo-500';
                                  iconText = 'text-white';
                                }

                                // Logic for Correct Answer (Only if key is released)
                                if (answerKeyReleased) {
                                  if (isCorrectOption) {
                                    borderClass = 'border-emerald-500';
                                    bgClass = 'bg-emerald-50';
                                    textClass = 'text-emerald-900';
                                    iconBg = 'bg-emerald-500';
                                    iconText = 'text-white';
                                  } else if (isStudentChoice && !isCorrectOption && resultsReleased) {
                                    borderClass = 'border-rose-500';
                                    bgClass = 'bg-rose-50';
                                    textClass = 'text-rose-900';
                                    iconBg = 'bg-rose-500';
                                    iconText = 'text-white';
                                  }
                                }

                                return (
                                  <div 
                                    key={opt}
                                    className={`p-4 rounded-xl border-2 transition-all ${bgClass} ${borderClass} ${textClass}`}
                                  >
                                    <div className="flex items-center gap-3">
                                      <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${iconBg} ${iconText}`}>
                                        {opt}
                                      </span>
                                      <span className="text-sm font-medium">{optionText}</span>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          ) : (
                            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 mb-4">
                              <p className="text-xs font-bold text-slate-400 uppercase mb-2">Your Answer</p>
                              <p className="text-sm text-slate-700 whitespace-pre-wrap">{resultsReleased ? (alloc.student_answer || 'No answer provided.') : 'Answer hidden until results release.'}</p>
                            </div>
                          )}

                          <div className="flex items-center gap-4">
                            {resultsReleased ? (
                              <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider ${
                                !isAttempted ? 'bg-slate-100 text-slate-500' : isCorrect ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                              }`}>
                                {!isAttempted ? <AlertCircle size={14} /> : isCorrect ? <CheckCircle2 size={14} /> : <XCircle size={14} />}
                                {!isAttempted ? 'Not Attempted' : isCorrect ? 'Correct' : 'Incorrect'}
                              </div>
                            ) : (
                              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider bg-slate-100 text-slate-500">
                                <Lock size={14} /> Performance Hidden
                              </div>
                            )}
                            
                            {answerKeyReleased ? (
                              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700">
                                <Key size={14} /> Key Released
                              </div>
                            ) : (
                              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider bg-slate-100 text-slate-500">
                                <Lock size={14} /> Key Hidden
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <ExamAIHelper exam={exam} attempt={attempt} allocations={allocations} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
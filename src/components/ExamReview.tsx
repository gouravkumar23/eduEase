import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, Download, Power, RotateCcw, PlayCircle, FileText, Key, CheckCircle2, ShieldCheck } from 'lucide-react';
import { db } from '../lib/firebase';
import { collection, query, where, getDocs, orderBy, doc, onSnapshot } from 'firebase/firestore';
import * as XLSX from 'xlsx';
import { useExams } from '../hooks/useExams';
import ReleaseConfirmationModal from './ReleaseConfirmationModal';

interface Attempt {
  id: string;
  student_id: string;
  student_name: string;
  student_email: string;
  student_roll_number?: string;
  student_branch?: string;
  student_section?: string;
  status: string;
  score: number;
  obtained_score?: number;
  total_exam_score?: number;
  started_at: any;
  submitted_at: any;
}

export default function ExamReview() {
  const { examId } = useParams();
  const navigate = useNavigate();
  const { forceSubmit, restartAttempt, resumeAttempt, toggleResults, toggleAnswerKey } = useExams(false);
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [exam, setExam] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [showReleaseModal, setShowReleaseModal] = useState<'results' | 'answer_key' | null>(null);

  useEffect(() => {
    if (!examId) return;

    // Listen to Exam Details for real-time status sync
    const unsubscribeExam = onSnapshot(doc(db, 'exams', examId), (docSnap) => {
      if (docSnap.exists()) {
        setExam({ id: docSnap.id, ...docSnap.data() });
      }
    });

    fetchAttempts();

    return () => unsubscribeExam();
  }, [examId]);

  const fetchAttempts = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, 'attempts'), where('exam_id', '==', examId), orderBy('started_at', 'desc'));
      const snap = await getDocs(q);
      setAttempts(snap.docs.map(d => ({ id: d.id, ...d.data() })) as Attempt[]);
    } catch (error) { console.error(error); }
    finally { setLoading(false); }
  };

  const handleAction = async (action: () => Promise<void>, id: string) => {
    setProcessingId(id);
    try {
      await action();
      await fetchAttempts();
    } catch (error) {
      alert('Action failed');
    } finally {
      setProcessingId(null);
    }
  };

  const handleExport = () => {
    const data = attempts
      .sort((a, b) => (b.score || 0) - (a.score || 0))
      .map(a => ({
        'Roll Number': a.student_roll_number || 'N/A',
        'Student Name': a.student_name,
        'Branch': a.student_branch || 'N/A',
        'Section': a.student_section || 'N/A',
        'Total Marks': a.total_exam_score || 100,
        'Obtained Marks': a.obtained_score || 0,
        'Percentage': `${a.score || 0}%`
      }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Results");
    XLSX.writeFile(wb, `Exam_Results_${examId}.csv`);
  };

  if (loading) return <div className="p-8 text-center">Loading...</div>;

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-8">
      <ReleaseConfirmationModal 
        isOpen={!!showReleaseModal}
        type={showReleaseModal || 'results'}
        examTitle={exam?.title || 'Assessment'}
        isProcessing={!!processingId}
        onConfirm={async () => {
          setProcessingId('global');
          if (showReleaseModal === 'results') await toggleResults(examId!, exam.results_released);
          else await toggleAnswerKey(examId!, exam.answer_key_released);
          setProcessingId(null);
          setShowReleaseModal(null);
        }}
        onCancel={() => setShowReleaseModal(null)}
      />

      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <button onClick={() => navigate('/faculty')} className="flex items-center gap-2 text-slate-500 hover:text-slate-900 transition-colors mb-2">
              <ChevronLeft size={20} /> Back to Dashboard
            </button>
            <h1 className="text-2xl font-black text-slate-900 flex items-center gap-3">
              <ShieldCheck className="text-indigo-600" />
              Submission Review
            </h1>
            <p className="text-sm text-slate-500 font-medium">{exam?.title}</p>
          </div>
          
          <div className="flex flex-wrap gap-2">
            <button 
              onClick={() => !exam?.results_released ? setShowReleaseModal('results') : toggleResults(examId!, true)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all border ${
                exam?.results_released 
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
              }`}
            >
              {exam?.results_released ? <CheckCircle2 size={16} /> : <FileText size={16} />}
              {exam?.results_released ? 'Results Released' : 'Release Results'}
            </button>
            <button 
              onClick={() => !exam?.answer_key_released ? setShowReleaseModal('answer_key') : toggleAnswerKey(examId!, true)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all border ${
                exam?.answer_key_released 
                  ? 'bg-amber-50 text-amber-700 border-amber-200' 
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
              }`}
            >
              {exam?.answer_key_released ? <CheckCircle2 size={16} /> : <Key size={16} />}
              {exam?.answer_key_released ? 'Key Released' : 'Release Key'}
            </button>
            <button onClick={handleExport} className="flex items-center gap-2 bg-slate-900 text-white px-4 py-2 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-slate-800 transition-all shadow-lg shadow-slate-200">
              <Download size={16} /> Export CSV
            </button>
          </div>
        </div>

        <div className="bg-white rounded-[32px] border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50/50 border-b border-slate-100">
                <tr>
                  <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Student</th>
                  <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Status</th>
                  <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Score</th>
                  <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {attempts.map(a => (
                  <tr key={a.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center font-black text-sm">
                          {a.student_name[0]}
                        </div>
                        <div>
                          <div className="font-bold text-slate-900">{a.student_name}</div>
                          <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{a.student_roll_number || 'No Roll No.'}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-lg ${
                        a.status === 'IN_PROGRESS' ? 'bg-emerald-100 text-emerald-700' : 
                        a.status === 'TERMINATED' ? 'bg-rose-100 text-rose-700' :
                        'bg-slate-100 text-slate-600'
                      }`}>{a.status.replace('_', ' ')}</span>
                    </td>
                    <td className="px-6 py-5">
                      <div className="inline-flex flex-col">
                        <span className="text-sm font-black text-indigo-600">{a.score || 0}%</span>
                        <span className="text-[10px] font-bold text-slate-400">{a.obtained_score || 0}/{a.total_exam_score || 0}</span>
                      </div>
                    </td>
                    <td className="px-6 py-5 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {a.status === 'IN_PROGRESS' && (
                          <button 
                            onClick={() => handleAction(() => forceSubmit(a.id), a.id)}
                            disabled={processingId === a.id}
                            className="p-2 text-rose-600 hover:bg-rose-50 rounded-xl transition-all"
                            title="Force Submit"
                          >
                            <Power size={18} />
                          </button>
                        )}
                        {a.status === 'AUTO_SUBMITTED' && (
                          <button 
                            onClick={() => handleAction(() => resumeAttempt(a.id), a.id)}
                            disabled={processingId === a.id}
                            className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all"
                            title="Resume Exam"
                          >
                            <PlayCircle size={18} />
                          </button>
                        )}
                        <button 
                          onClick={() => handleAction(() => restartAttempt(a.id), a.id)}
                          disabled={processingId === a.id}
                          className="p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-all"
                          title="Restart Attempt"
                        >
                          <RotateCcw size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
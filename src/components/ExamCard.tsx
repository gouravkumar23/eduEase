import { useState } from 'react';
import { Clock, Calendar, Users, ChevronRight, Loader2, Share2, Lock, Unlock, Eye, EyeOff, Activity, ClipboardCheck, Award, Trash2, Settings, FileText, Key, CheckCircle2, Send, ShieldAlert, Flag, Megaphone, BrainCircuit } from 'lucide-react';
import { Exam } from '../hooks/useExams';
import { ExamStatusBadge } from './ExamStatusBadge';
import ConfirmationModal from './ConfirmationModal';
import ReleaseConfirmationModal from './ReleaseConfirmationModal';
import { useNavigate } from 'react-router-dom';

interface ExamCardProps {
  exam: Exam;
  status: string;
  readonly: boolean;
  attempt?: any;
  distributingId: string | null;
  startingExamId: string | null;
  completingId?: string | null;
  notifyingId?: string | null;
  isSelected: boolean;
  onSelect: () => void;
  onToggleActive: () => void;
  onTogglePublish: () => void;
  onToggleResults: () => void;
  onToggleAnswerKey: () => void;
  onDistribute: () => void;
  onMonitor: () => void;
  onReview: () => void;
  onStart: () => void;
  onSubmitForApproval?: () => void;
  onComplete?: () => void;
  onDelete?: () => void;
  onEdit?: () => void;
  onNotifyStudents?: () => void;
}

export const ExamCard = ({
  exam, status, readonly, attempt, distributingId, startingExamId, completingId, notifyingId, isSelected,
  onSelect, onToggleActive, onTogglePublish, onToggleResults, onToggleAnswerKey, onDistribute, onMonitor, onReview, onStart, onSubmitForApproval, onComplete, onDelete, onEdit, onNotifyStudents
}: ExamCardProps) => {
  const navigate = useNavigate();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showCompleteConfirm, setShowCompleteConfirm] = useState(false);
  const [showReleaseModal, setShowReleaseModal] = useState<'results' | 'answer_key' | null>(null);
  
  const isCompleted = attempt && ['SUBMITTED', 'AUTO_SUBMITTED', 'GRADED'].includes(attempt.status);
  const isInProgress = attempt && attempt.status === 'IN_PROGRESS';
  const canViewResults = isCompleted && (exam.is_published || exam.answer_key_released);

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all overflow-hidden group">
      <ConfirmationModal 
        isOpen={showDeleteConfirm}
        title="Delete Assessment"
        message={`Are you sure you want to delete "${exam.title}"? This action cannot be undone.`}
        confirmText="Delete"
        variant="danger"
        onConfirm={() => {
          onDelete?.();
          setShowDeleteConfirm(false);
        }}
        onCancel={() => setShowDeleteConfirm(false)}
      />

      <ConfirmationModal 
        isOpen={showCompleteConfirm}
        title="Finalize Assessment"
        message={`Mark "${exam.title}" as completed? This will lock the exam and send a violation summary report to you and administrators.`}
        confirmText="Complete & Report"
        onConfirm={() => {
          onComplete?.();
          setShowCompleteConfirm(false);
        }}
        onCancel={() => setShowCompleteConfirm(false)}
      />

      <ReleaseConfirmationModal 
        isOpen={!!showReleaseModal}
        type={showReleaseModal || 'results'}
        examTitle={exam.title}
        isProcessing={false}
        onConfirm={() => {
          if (showReleaseModal === 'results') onToggleResults();
          else onToggleAnswerKey();
          setShowReleaseModal(null);
        }}
        onCancel={() => setShowReleaseModal(null)}
      />

      <div className="p-4 sm:p-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <h3 className="text-base sm:text-lg font-bold text-slate-900 group-hover:text-indigo-600 transition-colors truncate">{exam.title}</h3>
              <div className="flex flex-wrap gap-1.5">
                <ExamStatusBadge status={status} />
                {!readonly && (
                  <>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-bold uppercase tracking-wider ${exam.is_active ? 'bg-indigo-50 text-indigo-600' : 'bg-rose-50 text-rose-600'}`}>
                      {exam.is_active ? 'Unlocked' : 'Locked'}
                    </span>
                    {exam.results_released && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded-md font-bold uppercase tracking-wider bg-emerald-50 text-emerald-600">
                        Results Released
                      </span>
                    )}
                  </>
                )}
              </div>
            </div>
            
            <div className="flex flex-wrap items-center gap-y-1.5 gap-x-4 text-xs sm:text-sm text-slate-500">
              <div className="flex items-center gap-1.5">
                <Users size={14} className="text-indigo-500" /> 
                <span className="font-medium">By {exam.faculty_name}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Clock size={14} className="text-amber-500" /> 
                <span>{exam.duration} Minutes</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Calendar size={14} className="text-emerald-500" /> 
                <span>{exam.start_time?.toDate?.().toLocaleDateString()}</span>
              </div>
            </div>

            {!readonly && (exam.status === 'approved' || exam.status === 'completed') && (
              <div className="mt-4 flex flex-wrap gap-2">
                <button 
                  onClick={() => !exam.results_released ? setShowReleaseModal('results') : onToggleResults()}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-all border ${
                    exam.results_released 
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                      : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {exam.results_released ? <CheckCircle2 size={14} /> : <FileText size={14} />}
                  {exam.results_released ? 'Results Released' : 'Release Results'}
                </button>
                <button 
                  onClick={() => !exam.answer_key_released ? setShowReleaseModal('answer_key') : onToggleAnswerKey()}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-all border ${
                    exam.answer_key_released 
                      ? 'bg-amber-50 text-amber-700 border-amber-200' 
                      : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {exam.answer_key_released ? <CheckCircle2 size={14} /> : <Key size={14} />}
                  {exam.answer_key_released ? 'Key Released' : 'Release Answer Key'}
                </button>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            {!readonly ? (
              <div className="flex items-center bg-slate-50 rounded-xl p-1.5 border border-slate-200 shadow-sm">
                <div className="flex items-center gap-1 pr-2 border-r border-slate-200 mr-1">
                  <button onClick={onEdit} className="p-2 text-slate-600 hover:bg-white hover:shadow-sm rounded-lg transition-all" title="Edit Details">
                    <Settings size={18} />
                  </button>
                  
                  {exam.status === 'draft' && (
                    <button 
                      onClick={onSubmitForApproval}
                      className="p-2 text-emerald-600 hover:bg-white hover:shadow-sm rounded-lg transition-all"
                      title="Submit for Admin Approval"
                    >
                      <Send size={18} />
                    </button>
                  )}

                  {(exam.status === 'approved' || exam.status === 'completed') && (
                    <>
                      <button 
                        onClick={onNotifyStudents}
                        disabled={notifyingId === exam.id}
                        className="p-2 text-amber-600 hover:bg-white hover:shadow-sm rounded-lg transition-all"
                        title="Notify Targeted Students"
                      >
                        {notifyingId === exam.id ? <Loader2 size={18} className="animate-spin" /> : <Megaphone size={18} />}
                      </button>
                      {exam.status !== 'completed' && (
                        <button 
                          onClick={() => setShowCompleteConfirm(true)}
                          disabled={completingId === exam.id}
                          className="p-2 text-emerald-600 hover:bg-white hover:shadow-sm rounded-lg transition-all"
                          title="Complete & Send Report"
                        >
                          {completingId === exam.id ? <Loader2 size={18} className="animate-spin" /> : <Flag size={18} />}
                        </button>
                      )}
                    </>
                  )}

                  <button onClick={onDistribute} disabled={distributingId === exam.id} className="p-2 text-indigo-600 hover:bg-white hover:shadow-sm rounded-lg transition-all" title="Distribute Questions">
                    {distributingId === exam.id ? <Loader2 size={18} className="animate-spin" /> : <Share2 size={18} />}
                  </button>

                  {(exam.status === 'approved' || exam.status === 'completed') && (
                    <>
                      <button onClick={onToggleActive} className={`p-2 rounded-lg transition-all ${exam.is_active ? 'text-rose-600 hover:bg-white hover:shadow-sm' : 'text-indigo-600 hover:bg-white hover:shadow-sm'}`} title={exam.is_active ? 'Lock Exam' : 'Unlock Exam'}>
                        {exam.is_active ? <Lock size={18} /> : <Unlock size={18} />}
                      </button>
                      <button onClick={onTogglePublish} className={`p-2 rounded-lg transition-all ${exam.is_published ? 'text-amber-600 hover:bg-white hover:shadow-sm' : 'text-emerald-600 hover:bg-white hover:shadow-sm'}`} title={exam.is_published ? 'Unpublish Results' : 'Publish Results'}>
                        {exam.is_published ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </>
                  )}
                </div>
                
                <div className="flex items-center gap-1">
                  {(exam.status === 'approved' || exam.status === 'completed') && (
                    <>
                      <button 
                        onClick={() => navigate(`/faculty/proctoring/${exam.id}`)} 
                        className="p-2 text-rose-600 hover:bg-white hover:shadow-sm rounded-lg transition-all" 
                        title="Live Proctoring Dashboard"
                      >
                        <ShieldAlert size={18} />
                      </button>
                      <button onClick={onMonitor} className="p-2 text-indigo-600 hover:bg-white hover:shadow-sm rounded-lg transition-all" title="Live Monitor"><Activity size={18} /></button>
                      <button onClick={onReview} className="p-2 text-slate-600 hover:bg-white hover:shadow-sm rounded-lg transition-all" title="Review Submissions"><ClipboardCheck size={18} /></button>
                    </>
                  )}
                  <button onClick={() => setShowDeleteConfirm(true)} className="p-2 text-rose-600 hover:bg-white hover:shadow-sm rounded-lg transition-all" title="Delete Assessment"><Trash2 size={18} /></button>
                  <button onClick={onSelect} className={`p-2 rounded-lg transition-all ${isSelected ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:bg-white hover:shadow-sm'}`}>
                    <ChevronRight size={18} className={`transition-transform ${isSelected ? 'rotate-90' : ''}`} />
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                {canViewResults && (
                  <button 
                    onClick={() => navigate(`/student/ai-hub?examId=${exam.id}`)}
                    className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl hover:bg-indigo-100 transition-all shadow-sm"
                    title="Learn with AI Coach"
                  >
                    <BrainCircuit size={18} />
                  </button>
                )}
                <button
                  onClick={onStart}
                  disabled={startingExamId === exam.id || (isCompleted && !exam.is_published && !exam.answer_key_released) || status === 'PENDING'}
                  className={`px-6 py-2.5 rounded-xl font-bold transition-all text-sm shadow-sm ${
                    canViewResults ? 'bg-emerald-600 text-white hover:bg-emerald-700' : 
                    isCompleted ? 'bg-slate-100 text-slate-400' : 
                    status === 'PENDING' ? 'bg-amber-50 text-amber-400' : 'bg-indigo-600 text-white hover:bg-indigo-700'
                  }`}
                >
                  {canViewResults ? <><Award size={14} className="inline mr-1" /> View Results</> : 
                   isInProgress ? 'Continue Exam' : isCompleted ? 'Submitted' : status === 'PENDING' ? 'Upcoming' : 'Start Exam'}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
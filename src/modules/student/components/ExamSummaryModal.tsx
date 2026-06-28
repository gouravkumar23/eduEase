import { ClipboardList } from 'lucide-react';

interface Props {
  isOpen: boolean;
  total: number;
  attempted: number;
  unattempted: number;
  onClose: () => void;
  onConfirm: () => void;
}

export const ExamSummaryModal = ({ isOpen, total, attempted, unattempted, onClose, onConfirm }: Props) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8">
        <div className="flex items-center gap-3 mb-6">
          <ClipboardList className="text-indigo-600" size={32} />
          <h2 className="text-2xl font-bold">Exam Summary</h2>
        </div>
        <div className="space-y-4 mb-8">
          <div className="flex justify-between p-3 bg-slate-50 rounded-lg">
            <span className="text-slate-600">Total Questions</span>
            <span className="font-bold">{total}</span>
          </div>
          <div className="flex justify-between p-3 bg-emerald-50 rounded-lg">
            <span className="text-emerald-700">Attempted</span>
            <span className="font-bold text-emerald-700">{attempted}</span>
          </div>
          <div className="flex justify-between p-3 bg-rose-50 rounded-lg">
            <span className="text-rose-700">Unattempted</span>
            <span className="font-bold text-rose-700">{unattempted}</span>
          </div>
        </div>
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 py-3 border rounded-xl font-bold">Back</button>
          <button onClick={onConfirm} className="flex-1 py-3 bg-indigo-600 text-white rounded-xl font-bold">Submit</button>
        </div>
      </div>
    </div>
  );
};
"use client";

import { Check, XCircle, Loader2, CheckCircle } from 'lucide-react';

interface Exam {
  id: string;
  title: string;
  faculty_id: string;
  faculty_name: string;
  created_at: any;
}

interface AdminExamApprovalsProps {
  exams: Exam[];
  onApprove: (id: string, facultyId: string, title: string) => Promise<void>;
  onReject: (id: string, facultyId: string, title: string) => Promise<void>;
  processingId: string | null;
}

export default function AdminExamApprovals({ exams, onApprove, onReject, processingId }: AdminExamApprovalsProps) {
  if (exams.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-12 text-center">
        <CheckCircle className="mx-auto text-slate-300 mb-4" size={48} />
        <h3 className="text-lg font-semibold text-slate-900">No pending approvals</h3>
        <p className="text-slate-500">All assessment requests have been processed.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border shadow-sm overflow-x-auto">
      <table className="w-full text-left min-w-[600px]">
        <thead className="bg-slate-50 border-b">
          <tr>
            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Assessment</th>
            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Faculty</th>
            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {exams.map(e => (
            <tr key={e.id} className="hover:bg-slate-50">
              <td className="px-6 py-4">
                <div className="font-bold text-sm">{e.title}</div>
                <div className="text-[10px] text-slate-500">Created {e.created_at?.toDate?.().toLocaleDateString()}</div>
              </td>
              <td className="px-6 py-4 text-xs text-slate-600">{e.faculty_name}</td>
              <td className="px-6 py-4">
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => onApprove(e.id, e.faculty_id, e.title)} 
                    disabled={processingId === e.id} 
                    className="flex items-center gap-1.5 bg-emerald-50 text-emerald-600 px-3 py-1.5 rounded-lg text-[10px] font-bold hover:bg-emerald-100 transition-colors"
                  >
                    {processingId === e.id ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />} Approve
                  </button>
                  <button 
                    onClick={() => onReject(e.id, e.faculty_id, e.title)} 
                    disabled={processingId === e.id} 
                    className="flex items-center gap-1.5 bg-rose-50 text-rose-600 px-3 py-1.5 rounded-lg text-[10px] font-bold hover:bg-rose-100 transition-colors"
                  >
                    <XCircle size={14} /> Reject
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
"use client";

import { Trash2, Users, Hash, BookOpen } from 'lucide-react';

interface Exam {
  id: string;
  title: string;
  faculty_name: string;
  created_at: any;
  status: string;
  target_type: 'section' | 'room';
  target_branch?: string;
  target_year?: string;
  target_section?: string;
  target_room_id?: string;
  subject?: string;
}

interface AdminAssessmentListProps {
  exams: Exam[];
  onDelete: (exam: Exam) => void;
}

export default function AdminAssessmentList({ exams, onDelete }: AdminAssessmentListProps) {
  return (
    <div className="bg-white rounded-2xl border shadow-sm overflow-x-auto">
      <table className="w-full text-left min-w-[800px]">
        <thead className="bg-slate-50 border-b">
          <tr>
            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Assessment & Subject</th>
            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Faculty</th>
            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Target Audience</th>
            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Status</th>
            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {exams.map(e => (
            <tr key={e.id} className="hover:bg-slate-50">
              <td className="px-6 py-4">
                <div className="font-bold text-sm text-slate-900">{e.title}</div>
                <div className="text-[10px] text-indigo-600 font-bold flex items-center gap-1 uppercase">
                  <BookOpen size={10} /> {e.subject || 'General'}
                </div>
              </td>
              <td className="px-6 py-4">
                <div className="text-sm font-medium text-slate-700">{e.faculty_name}</div>
                <div className="text-[10px] text-slate-400">
                  {e.created_at?.toDate ? e.created_at.toDate().toLocaleDateString() : 'N/A'}
                </div>
              </td>
              <td className="px-6 py-4">
                {e.target_type === 'room' ? (
                  <div className="flex items-center gap-1.5 text-xs text-slate-600 font-medium">
                    <Hash size={14} className="text-slate-400" /> Private Room
                  </div>
                ) : (
                  <div className="flex flex-col gap-0.5">
                    <div className="flex items-center gap-1.5 text-xs text-slate-700 font-bold">
                      <Users size={14} className="text-slate-400" /> {e.target_branch === 'ALL' ? 'All Branches' : e.target_branch}
                    </div>
                    <div className="text-[10px] text-slate-500 font-medium">
                      Year {e.target_year} • Section {e.target_section}
                    </div>
                  </div>
                )}
              </td>
              <td className="px-6 py-4">
                <span className={`text-[10px] font-bold uppercase px-2 py-1 rounded ${
                  e.status === 'approved' ? 'bg-emerald-100 text-emerald-700' : 
                  e.status === 'rejected' ? 'bg-rose-100 text-rose-700' : 'bg-slate-100 text-slate-600'
                }`}>
                  {e.status}
                </span>
              </td>
              <td className="px-6 py-4">
                <button 
                  onClick={() => onDelete(e)} 
                  className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                  title="Delete Assessment"
                >
                  <Trash2 size={18} />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
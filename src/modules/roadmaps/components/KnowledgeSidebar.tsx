"use client";

import { BrainCircuit, Plus, BookOpen, X, CheckCircle2, FileText } from 'lucide-react';

export interface KnowledgeSource {
  id: string;
  type: 'exam' | 'file';
  title: string;
  content: string;
  performance?: string;
}

interface KnowledgeSidebarProps {
  sources: KnowledgeSource[];
  onAddClick: () => void;
  onRemoveSource: (id: string) => void;
  userName?: string;
}

export default function KnowledgeSidebar({ sources, onAddClick, onRemoveSource, userName }: KnowledgeSidebarProps) {
  return (
    <aside className="w-full lg:w-80 bg-white border-r border-slate-200 flex flex-col shrink-0">
      <div className="p-6 border-b border-slate-100">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-indigo-600 text-white rounded-xl shadow-lg shadow-indigo-100">
            <BrainCircuit size={24} />
          </div>
          <div>
            <h2 className="font-black text-slate-900 leading-tight">Learning Hub</h2>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">AI Knowledge Base</p>
          </div>
        </div>

        <button 
          onClick={onAddClick}
          className="w-full flex items-center justify-center gap-2 bg-indigo-50 text-indigo-600 py-3 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-indigo-600 hover:text-white transition-all border-2 border-indigo-100 border-dashed"
        >
          <Plus size={18} />
          Add Knowledge
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {sources.length === 0 ? (
          <div className="py-12 text-center px-6">
            <div className="w-16 h-16 bg-slate-50 rounded-3xl flex items-center justify-center mx-auto mb-4">
              <BookOpen size={32} className="text-slate-200" />
            </div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">No sources added</p>
            <p className="text-[10px] text-slate-400 mt-2">Add past exams or documents to start learning with AI.</p>
          </div>
        ) : (
          sources.map(source => (
            <div key={source.id} className="group bg-slate-50 p-4 rounded-2xl border border-slate-100 hover:border-indigo-200 transition-all relative">
              <button 
                onClick={() => onRemoveSource(source.id)}
                className="absolute -top-2 -right-2 w-6 h-6 bg-white border border-slate-200 rounded-full flex items-center justify-center text-slate-400 hover:text-rose-600 hover:border-rose-100 shadow-sm opacity-0 group-hover:opacity-100 transition-all"
              >
                <X size={12} />
              </button>
              <div className="flex items-start gap-3">
                <div className={`p-2 rounded-lg ${source.type === 'exam' ? 'bg-amber-100 text-amber-600' : 'bg-blue-100 text-blue-600'}`}>
                  {source.type === 'exam' ? <CheckCircle2 size={16} /> : <FileText size={16} />}
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-black text-slate-900 truncate">{source.title}</p>
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter mt-0.5">
                    {source.type === 'exam' ? 'Assessment Data' : 'Local Document'}
                  </p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="p-6 border-t border-slate-100 bg-slate-50/50">
        <div className="flex items-center gap-3 p-3 bg-white rounded-2xl border border-slate-200">
          <div className="w-8 h-8 bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center font-black text-xs">
            {userName?.[0]}
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-black text-slate-900 truncate">{userName}</p>
            <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Student Learner</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
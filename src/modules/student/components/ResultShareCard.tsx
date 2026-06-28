"use client";

import React from 'react';
import { Trophy, Star, BookOpen, ShieldCheck } from 'lucide-react';

interface ResultShareCardProps {
  studentName: string;
  examTitle: string;
  score: number;
  obtainedScore: number;
  totalScore: number;
  percentile: number;
  cardRef: React.RefObject<HTMLDivElement>;
}

export default function ResultShareCard({ 
  studentName, 
  examTitle, 
  score, 
  obtainedScore, 
  totalScore, 
  percentile,
  cardRef 
}: ResultShareCardProps) {
  return (
    <div className="absolute -left-[9999px] top-0">
      <div 
        ref={cardRef}
        className="w-[600px] h-[400px] bg-white p-10 flex flex-col relative overflow-hidden border-[12px] border-indigo-600"
        style={{ fontFamily: 'system-ui, sans-serif' }}
      >
        {/* Background Decorations */}
        <div className="absolute -top-20 -right-20 w-64 h-64 bg-indigo-50 rounded-full opacity-50" />
        <div className="absolute -bottom-20 -left-20 w-48 h-48 bg-indigo-50 rounded-full opacity-50" />
        
        {/* Header */}
        <div className="flex justify-between items-start relative z-10 mb-8">
          <div>
            <div className="flex items-center gap-2 text-indigo-600 font-black text-xl uppercase tracking-tighter mb-1">
              <ShieldCheck size={24} />
              EduEase
            </div>
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">
              Official Performance Certificate
            </div>
          </div>
          <div className="bg-indigo-600 text-white p-3 rounded-2xl shadow-lg">
            <Trophy size={32} />
          </div>
        </div>

        {/* Content */}
        <div className="relative z-10 flex-1">
          <div className="mb-6">
            <h2 className="text-3xl font-black text-slate-900 leading-tight mb-1">{studentName}</h2>
            <div className="flex items-center gap-2 text-indigo-600 font-bold">
              <BookOpen size={16} />
              <span className="text-sm">{examTitle}</span>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-6">
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
              <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Final Score</p>
              <div className="text-2xl font-black text-indigo-600">{score}%</div>
            </div>
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
              <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Marks</p>
              <div className="text-2xl font-black text-slate-700">{obtainedScore}/{totalScore}</div>
            </div>
            <div className="bg-indigo-600 p-4 rounded-2xl shadow-md">
              <p className="text-[10px] font-black text-indigo-100 uppercase mb-1">Percentile</p>
              <div className="text-2xl font-black text-white">{percentile.toFixed(1)}th</div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="relative z-10 mt-auto flex justify-between items-end">
          <div className="flex items-center gap-1 text-amber-500">
            <Star size={14} fill="currentColor" />
            <Star size={14} fill="currentColor" />
            <Star size={14} fill="currentColor" />
            <Star size={14} fill="currentColor" />
            <Star size={14} fill="currentColor" />
          </div>
          <div className="text-right">
            <div className="text-[10px] font-bold text-slate-400 uppercase">Verified by</div>
            <div className="text-xs font-black text-slate-900">EduEase Integrity Engine</div>
          </div>
        </div>
      </div>
    </div>
  );
}
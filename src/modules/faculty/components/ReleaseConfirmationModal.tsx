"use client";

import React from 'react';
import { CheckCircle2, Key, AlertCircle, X, Send, ShieldCheck } from 'lucide-react';

interface ReleaseConfirmationModalProps {
  isOpen: boolean;
  type: 'results' | 'answer_key';
  examTitle: string;
  onConfirm: () => void;
  onCancel: () => void;
  isProcessing: boolean;
}

const ReleaseConfirmationModal = ({
  isOpen,
  type,
  examTitle,
  onConfirm,
  onCancel,
  isProcessing
}: ReleaseConfirmationModalProps) => {
  if (!isOpen) return null;

  const isResults = type === 'results';

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-[32px] shadow-2xl max-w-md w-full overflow-hidden border border-slate-100">
        {/* Header Decoration */}
        <div className={`h-2 w-full ${isResults ? 'bg-emerald-500' : 'bg-amber-500'}`} />
        
        <div className="p-8">
          <div className="flex justify-between items-start mb-6">
            <div className={`p-4 rounded-2xl ${isResults ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
              {isResults ? <CheckCircle2 size={32} /> : <Key size={32} />}
            </div>
            <button onClick={onCancel} className="p-2 text-slate-400 hover:bg-slate-50 rounded-full transition-colors">
              <X size={20} />
            </button>
          </div>

          <h3 className="text-2xl font-black text-slate-900 leading-tight mb-2">
            {isResults ? 'Release Final Scores?' : 'Publish Answer Key?'}
          </h3>
          <p className="text-slate-500 text-sm leading-relaxed mb-6">
            You are about to make the {isResults ? 'results' : 'correct answers'} for <span className="font-bold text-slate-800">"{examTitle}"</span> visible to all participating students.
          </p>

          <div className="space-y-3 mb-8">
            <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-2xl border border-slate-100">
              <div className="mt-0.5 text-indigo-600"><Send size={16} /></div>
              <p className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                {isResults ? 'Students will receive a push notification' : 'Students can now review their mistakes'}
              </p>
            </div>
            <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-2xl border border-slate-100">
              <div className="mt-0.5 text-indigo-600"><ShieldCheck size={16} /></div>
              <p className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                This action is logged for integrity audit
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <button
              onClick={onConfirm}
              disabled={isProcessing}
              className={`w-full py-4 rounded-2xl font-black text-xs uppercase tracking-[0.2em] text-white transition-all shadow-lg flex items-center justify-center gap-2 ${
                isResults 
                  ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-200' 
                  : 'bg-amber-600 hover:bg-amber-700 shadow-amber-200'
              } disabled:opacity-50`}
            >
              {isProcessing ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>Confirm & Release Now</>
              )}
            </button>
            <button
              onClick={onCancel}
              disabled={isProcessing}
              className="w-full py-4 rounded-2xl font-black text-xs uppercase tracking-[0.2em] text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-all"
            >
              Maybe Later
            </button>
          </div>
        </div>

        <div className="bg-slate-50 p-4 text-center border-t border-slate-100">
          <div className="flex items-center justify-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            <AlertCircle size={12} />
            Action cannot be undone instantly
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReleaseConfirmationModal;
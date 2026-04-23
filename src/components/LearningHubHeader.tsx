"use client";

import { Sparkles, VolumeX, Globe, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface LearningHubHeaderProps {
  isSpeaking: boolean;
  onStopSpeaking: () => void;
  isChatActive: boolean;
  language: string;
  onLanguageChange: (lang: string) => void;
}

const LANGUAGES = [
  { code: 'en-US', label: 'English', native: 'English' },
  { code: 'hi-IN', label: 'Hindi', native: 'हिन्दी' },
  { code: 'te-IN', label: 'Telugu', native: 'తెలుగు' }
];

export default function LearningHubHeader({ isSpeaking, onStopSpeaking, isChatActive, language, onLanguageChange }: LearningHubHeaderProps) {
  const navigate = useNavigate();

  return (
    <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 sm:px-8 shrink-0 sticky top-0 z-20">
      <div className="flex items-center gap-4">
        <button 
          onClick={() => navigate('/student')}
          className="p-2 hover:bg-slate-100 rounded-xl text-slate-500 transition-colors"
        >
          <ArrowLeft size={20} />
        </button>
        <div className="flex items-center gap-2">
          <Sparkles className="text-indigo-600" size={20} />
          <h1 className="font-black text-slate-900 uppercase tracking-widest text-xs sm:text-sm">AI Learning Coach</h1>
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-4">
        <div className="relative group">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 rounded-xl border border-slate-200 cursor-pointer hover:bg-slate-200 transition-all">
            <Globe size={14} className="text-slate-500" />
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-700">
              {LANGUAGES.find(l => l.code === language)?.native}
            </span>
          </div>
          <div className="absolute right-0 mt-2 w-32 bg-white rounded-2xl shadow-xl border border-slate-100 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 overflow-hidden">
            {LANGUAGES.map(lang => (
              <button
                key={lang.code}
                onClick={() => onLanguageChange(lang.code)}
                className={`w-full px-4 py-2.5 text-left text-[10px] font-bold uppercase tracking-widest hover:bg-indigo-50 transition-colors ${language === lang.code ? 'text-indigo-600 bg-indigo-50/50' : 'text-slate-600'}`}
              >
                {lang.native}
              </button>
            ))}
          </div>
        </div>

        {isSpeaking && (
          <button 
            onClick={onStopSpeaking} 
            className="flex items-center gap-2 px-3 py-1.5 bg-rose-50 text-rose-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-rose-100 transition-all"
          >
            <VolumeX size={14} /> <span className="hidden sm:inline">Stop Voice</span>
          </button>
        )}
        
        <div className="hidden sm:flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${isChatActive ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`} />
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
            {isChatActive ? 'Coach Online' : 'Awaiting Context'}
          </span>
        </div>
      </div>
    </header>
  );
}
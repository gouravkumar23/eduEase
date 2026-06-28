"use client";

import { useRef, useEffect } from 'react';
import { BrainCircuit, History, FileText, Loader2, MicOff, Mic, Send } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface Message {
  role: 'user' | 'model';
  parts: { text: string }[];
}

interface LearningChatProps {
  messages: Message[];
  loading: boolean;
  input: string;
  setInput: (val: string) => void;
  onSend: (text?: string) => void;
  isListening: boolean;
  onListen: () => void;
  isChatActive: boolean;
}

export default function LearningChat({ 
  messages, 
  loading, 
  input, 
  setInput, 
  onSend, 
  isListening, 
  onListen,
  isChatActive 
}: LearningChatProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden">
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 sm:p-10 space-y-8 bg-slate-50/50 scroll-smooth">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center max-w-md mx-auto">
            <div className="w-24 h-24 bg-white rounded-[40px] shadow-xl flex items-center justify-center mb-8 animate-bounce-slow">
              <BrainCircuit size={48} className="text-indigo-600" />
            </div>
            <h2 className="text-2xl font-black text-slate-900 mb-4">Ready to Level Up?</h2>
            <p className="text-slate-500 text-sm leading-relaxed mb-8">
              Add your past exams or study materials to the knowledge base. I'll analyze your performance and teach you exactly what you need to know.
            </p>
            <div className="grid grid-cols-1 gap-3 w-full">
              <div className="flex items-center gap-3 p-4 bg-white rounded-2xl border border-slate-200 text-left">
                <div className="p-2 bg-amber-50 text-amber-600 rounded-lg"><History size={18} /></div>
                <p className="text-xs font-bold text-slate-600">Analyze past exam mistakes</p>
              </div>
              <div className="flex items-center gap-3 p-4 bg-white rounded-2xl border border-slate-200 text-left">
                <div className="p-2 bg-blue-50 text-blue-600 rounded-lg"><FileText size={18} /></div>
                <p className="text-xs font-bold text-slate-600">Explain complex PDF documents</p>
              </div>
            </div>
          </div>
        ) : (
          messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-4 duration-500`}>
              <div className={`max-w-[85%] p-5 rounded-3xl shadow-sm relative ${
                m.role === 'user' 
                  ? 'bg-indigo-600 text-white rounded-tr-none' 
                  : 'bg-white border border-slate-100 text-slate-700 rounded-tl-none'
              }`}>
                <div className="prose prose-sm max-w-none prose-slate">
                  <ReactMarkdown>{m.parts[0].text}</ReactMarkdown>
                </div>
                <div className={`text-[8px] mt-3 font-black uppercase tracking-widest opacity-40 ${m.role === 'user' ? 'text-right' : 'text-left'}`}>
                  {m.role === 'user' ? 'Student' : 'AI Coach'}
                </div>
              </div>
            </div>
          ))
        )}
        {loading && !messages[messages.length - 1]?.parts[0].text && (
          <div className="flex justify-start">
            <div className="bg-white border p-5 rounded-3xl rounded-tl-none shadow-sm flex items-center gap-3">
              <Loader2 size={20} className="animate-spin text-indigo-600" />
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest animate-pulse">Coach is thinking...</span>
            </div>
          </div>
        )}
      </div>

      <div className="p-6 bg-white border-t border-slate-200 shrink-0">
        <div className="max-w-4xl mx-auto flex gap-3">
          <button 
            onClick={onListen}
            className={`p-4 rounded-2xl transition-all shadow-lg ${isListening ? 'bg-rose-600 text-white animate-pulse' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
            title="Voice Input"
          >
            {isListening ? <MicOff size={24} /> : <Mic size={24} />}
          </button>
          <div className="flex-1 relative">
            <input 
              type="text" 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && onSend()}
              placeholder={isChatActive ? "Ask your coach anything..." : "Add knowledge to start chatting..."}
              className="w-full bg-slate-100 border-none rounded-2xl px-6 py-4 text-sm font-medium focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all"
              disabled={!isChatActive || loading}
            />
            <button 
              onClick={() => onSend()}
              disabled={loading || !input.trim() || !isChatActive}
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-indigo-600 text-white p-2.5 rounded-xl hover:bg-indigo-700 disabled:opacity-50 transition-all shadow-lg shadow-indigo-500/20"
            >
              <Send size={20} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
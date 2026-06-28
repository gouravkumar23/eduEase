"use client";

import React from 'react';
import { Volume2, Check, Play, X } from 'lucide-react';

interface VoiceSelectorProps {
  voices: SpeechSynthesisVoice[];
  selectedURI: string | null;
  onSelect: (uri: string) => void;
  onClose?: () => void;
  isSetup?: boolean;
}

export default function VoiceSelector({ voices, selectedURI, onSelect, onClose, isSetup = false }: VoiceSelectorProps) {
  const handleTest = (voice: SpeechSynthesisVoice) => {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance("Hello! This is how I will sound as your learning coach.");
    utterance.voice = voice;
    window.speechSynthesis.speak(utterance);
  };

  return (
    <div className={`flex flex-col h-full ${isSetup ? 'p-8' : 'p-4'}`}>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h3 className="font-black text-slate-900 uppercase tracking-widest text-sm">Choose AI Voice</h3>
          <p className="text-[10px] text-slate-500 font-bold uppercase mt-1">Select a personality for your coach</p>
        </div>
        {onClose && (
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
            <X size={20} />
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
        {voices.length === 0 ? (
          <div className="py-12 text-center text-slate-400 text-xs italic">
            Loading system voices...
          </div>
        ) : (
          voices.map((voice) => (
            <div 
              key={voice.voiceURI}
              className={`group flex items-center justify-between p-3 rounded-2xl border-2 transition-all ${
                selectedURI === voice.voiceURI 
                  ? 'border-indigo-600 bg-indigo-50' 
                  : 'border-slate-100 hover:border-slate-200 bg-white'
              }`}
            >
              <button 
                onClick={() => onSelect(voice.voiceURI)}
                className="flex-1 text-left min-w-0"
              >
                <p className={`text-xs font-bold truncate ${selectedURI === voice.voiceURI ? 'text-indigo-900' : 'text-slate-700'}`}>
                  {voice.name.replace('Google ', '').replace('Microsoft ', '')}
                </p>
                <p className="text-[9px] text-slate-400 uppercase font-black tracking-tighter">{voice.lang}</p>
              </button>
              
              <div className="flex items-center gap-1">
                <button 
                  onClick={() => handleTest(voice)}
                  className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-white rounded-xl transition-all"
                  title="Test Voice"
                >
                  <Play size={14} fill="currentColor" />
                </button>
                {selectedURI === voice.voiceURI && (
                  <div className="p-2 text-indigo-600">
                    <Check size={16} />
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {isSetup && (
        <button 
          onClick={onClose}
          disabled={!selectedURI}
          className="mt-8 w-full bg-indigo-600 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 disabled:opacity-50"
        >
          Start Learning Session
        </button>
      )}
    </div>
  );
}
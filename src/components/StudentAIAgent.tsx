"use client";

import { useState, useRef, useEffect } from 'react';
import { Bot, Send, X, Minimize2, Maximize2, Loader2, Sparkles, Mic, MicOff, Volume2, VolumeX, BookOpen, FileText, Link as LinkIcon, Plus, Settings, BrainCircuit } from 'lucide-react';
import { getAIConfiguration, runWithAIFallback, isRetryableAIError, getSettings } from '../utils/ai';
import { useSpeech } from '../hooks/useSpeech';
import { db } from '../lib/firebase';
import { collection, query, where, getDocs, limit, orderBy, doc, getDoc } from 'firebase/firestore';
import ReactMarkdown from 'react-markdown';
import VoiceSelector from './VoiceSelector';
import KnowledgeSourceModal from './KnowledgeSourceModal';

interface Message {
  role: 'user' | 'model';
  parts: { text: string }[];
}

export default function StudentAIAgent({ userId }: { userId: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [view, setView] = useState<'chat' | 'voice-setup' | 'settings'>('chat');
  const [showSourceModal, setShowSourceModal] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [chatSession, setChatSession] = useState<any>(null);
  const { isListening, isSpeaking, voices, selectedVoiceURI, setVoice, speak, listen, stopSpeaking } = useSpeech();
  const scrollRef = useRef<HTMLDivElement>(null);
  const messagesRef = useRef<Message[]>([]);

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const fetchFullExamContext = async () => {
    const attemptsSnap = await getDocs(query(
      collection(db, 'attempts'), 
      where('student_id', '==', userId), 
      orderBy('submitted_at', 'desc'), 
      limit(3)
    ));

    let fullContext = "";
    for (const attemptDoc of attemptsSnap.docs) {
      const attempt = attemptDoc.data();
      const allocsSnap = await getDocs(query(collection(db, 'allocations'), where('attempt_id', '==', attemptDoc.id)));
      
      const examContent = allocsSnap.docs.map((d, i) => {
        const a = d.data();
        return `Q${i+1}: ${a.questions.text}. Correct: ${a.questions.correct_option}. Student Answer: ${a.student_answer || 'None'}.`;
      }).join('\n');

      fullContext += `\nEXAM TITLE: ${attempt.exam_title}\nSCORE: ${attempt.score}%\nCONTENT:\n${examContent}\n---`;
    }
    return fullContext;
  };

  const initAgent = async (additionalContext?: string, isReconnect = false) => {
    setLoading(true);
    try {
      const examContext = await fetchFullExamContext();

      const session = await runWithAIFallback(async (model) => {
        const history: Message[] = [
          {
            role: 'user',
            parts: [{ text: `You are the EduEase Student Assistant. 
              You have access to the student's recent exam history including full questions and their answers.
              
              RECENT EXAM DATA:
              ${examContext}
              
              ${additionalContext ? `ADDITIONAL KNOWLEDGE SOURCE:\n${additionalContext}` : ''}
              
              INSTRUCTIONS:
              1. If the student asks about a specific exam (e.g., "dancces"), look through the RECENT EXAM DATA provided above.
              2. If you cannot find information about a specific term or exam they mention, DO NOT GUESS. Instead, politely ask them to click the "+" button to attach the relevant document or select the exam from their history.
              3. Be helpful, academic, and friendly. Use markdown for formatting.
              4. Keep responses concise and suitable for voice playback.
              
              Start by greeting the student and mentioning that you've analyzed their recent performance.` }]
          }
        ];

        if (isReconnect && messagesRef.current.length > 0) {
          history.push(...messagesRef.current);
        }

        return model.startChat({ history });
      });

      setChatSession(session);
      
      if (!isReconnect) {
        const result = await session.sendMessageStream("Hello! I'm ready to help you with your studies.");
        let fullText = "";
        setMessages([{ role: 'model', parts: [{ text: "" }] }]);
        for await (const chunk of result.stream) {
          const chunkText = chunk.text();
          fullText += chunkText;
          setMessages(prev => {
            const last = prev[prev.length - 1];
            return [...prev.slice(0, -1), { ...last, parts: [{ text: fullText }] }];
          });
        }
      }
    } catch (error) {
      console.error("Agent Init Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async (textOverride?: string, retryCount = 0) => {
    const text = textOverride || input;
    if (!text.trim() || loading || !chatSession) return;

    if (isSpeaking) stopSpeaking();

    const userMsg = text.trim();
    if (retryCount === 0) {
      setInput('');
      setMessages(prev => [...prev, { role: 'user', parts: [{ text: userMsg }] }]);
    }
    setLoading(true);

    try {
      const result = await chatSession.sendMessageStream(userMsg);
      let fullText = "";
      setMessages(prev => [...prev, { role: 'model', parts: [{ text: "" }] }]);

      for await (const chunk of result.stream) {
        const chunkText = chunk.text();
        fullText += chunkText;
        setMessages(prev => {
          const last = prev[prev.length - 1];
          return [...prev.slice(0, -1), { ...last, parts: [{ text: fullText }] }];
        });
      }
      speak(fullText);
    } catch (error: any) {
      const { keys } = await getSettings();
      const maxRetries = keys.length + 2;

      if (isRetryableAIError(error) && retryCount < maxRetries) {
        await initAgent(undefined, true);
        return handleSend(userMsg, retryCount + 1);
      }
      setMessages(prev => [...prev, { role: 'model', parts: [{ text: "I'm having trouble connecting. All available keys are currently busy." }] }]);
    } finally {
      setLoading(false);
    }
  };

  const handleAddKnowledge = async (source: any) => {
    let context = "";
    if (source.type === 'exam') {
      const q = query(collection(db, 'allocations'), where('attempt_id', '==', source.id));
      const snap = await getDocs(q);
      context = snap.docs.map((d, i) => {
        const a = d.data();
        return `Q${i+1}: ${a.questions.text}. Correct: ${a.questions.correct_option}. Student: ${a.student_answer || 'None'}.`;
      }).join('\n');
    } else {
      context = source.content;
    }

    setShowSourceModal(false);
    setMessages([]);
    initAgent(`NEW SOURCE ATTACHED: ${source.title}\nCONTENT:\n${context}`);
  };

  const toggleOpen = () => {
    if (!isOpen) {
      const hasVoice = localStorage.getItem('preferred_voice_uri');
      if (!hasVoice) setView('voice-setup');
      else {
        setView('chat');
        initAgent();
      }
    }
    setIsOpen(!isOpen);
  };

  if (!isOpen) {
    return (
      <button 
        onClick={toggleOpen}
        className="fixed bottom-6 right-6 w-16 h-16 bg-indigo-600 text-white rounded-full shadow-2xl flex items-center justify-center hover:scale-110 transition-all z-50 group"
      >
        <Bot size={32} />
        <span className="absolute -top-2 -right-2 bg-rose-50 text-white text-[10px] font-black px-2 py-1 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity">AI HELP</span>
      </button>
    );
  }

  return (
    <div className={`fixed bottom-6 right-6 w-80 sm:w-[400px] bg-white rounded-3xl shadow-2xl border border-slate-200 flex flex-col z-50 transition-all ${isMinimized ? 'h-16' : 'h-[550px]'}`}>
      <div className="p-4 bg-indigo-600 text-white rounded-t-3xl flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-white/20 rounded-xl">
            <Sparkles size={18} />
          </div>
          <div>
            <span className="font-bold text-sm">Learning Assistant</span>
            <div className="flex items-center gap-1">
              <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
              <span className="text-[8px] font-black uppercase tracking-widest opacity-80">Context Aware</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1">
          {view === 'chat' && (
            <button onClick={() => setView('settings')} className="hover:bg-white/20 p-1.5 rounded-lg transition-colors">
              <Settings size={16} />
            </button>
          )}
          {isSpeaking && (
            <button onClick={stopSpeaking} className="hover:bg-white/20 p-1.5 rounded-lg transition-colors">
              <VolumeX size={16} />
            </button>
          )}
          <button onClick={() => setIsMinimized(!isMinimized)} className="hover:bg-white/20 p-1.5 rounded-lg transition-colors">
            {isMinimized ? <Maximize2 size={16} /> : <Minimize2 size={16} />}
          </button>
          <button onClick={() => setIsOpen(false)} className="hover:bg-white/20 p-1.5 rounded-lg transition-colors"><X size={16} /></button>
        </div>
      </div>

      {!isMinimized && (
        <>
          {view === 'voice-setup' || view === 'settings' ? (
            <VoiceSelector 
              voices={voices} 
              selectedURI={selectedVoiceURI} 
              onSelect={setVoice} 
              onClose={() => {
                if (view === 'voice-setup') initAgent();
                setView('chat');
              }}
              isSetup={view === 'voice-setup'}
            />
          ) : (
            <>
              <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
                {messages.map((m, i) => (
                  <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[85%] p-3.5 rounded-2xl text-sm shadow-sm ${
                      m.role === 'user' ? 'bg-indigo-600 text-white rounded-tr-none' : 'bg-white border border-slate-100 text-slate-700 rounded-tl-none'
                    }`}>
                      <div className="prose prose-sm max-w-none prose-slate">
                        <ReactMarkdown>{m.parts[0].text}</ReactMarkdown>
                      </div>
                    </div>
                  </div>
                ))}
                {loading && !messages[messages.length - 1]?.parts[0].text && (
                  <div className="flex justify-start">
                    <div className="bg-white border p-3 rounded-2xl rounded-tl-none shadow-sm">
                      <Loader2 size={16} className="animate-spin text-indigo-600" />
                    </div>
                  </div>
                )}
              </div>

              <div className="p-4 border-t bg-white rounded-b-3xl">
                <div className="flex gap-2">
                  <button 
                    onClick={() => setShowSourceModal(true)}
                    className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl hover:bg-indigo-100 transition-all"
                    title="Add Knowledge Source"
                  >
                    <Plus size={18} />
                  </button>
                  <button 
                    onClick={() => listen((text) => handleSend(text))}
                    className={`p-2.5 rounded-xl transition-all ${isListening ? 'bg-rose-100 text-rose-600 animate-pulse' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                  >
                    {isListening ? <MicOff size={18} /> : <Mic size={18} />}
                  </button>
                  <input 
                    type="text" 
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                    placeholder="Ask about your exams..."
                    className="flex-1 bg-slate-100 border-none rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                  <button 
                    onClick={() => handleSend()}
                    disabled={loading || !input.trim()}
                    className="bg-indigo-600 text-white p-2.5 rounded-xl hover:bg-indigo-700 disabled:opacity-50 transition-colors shadow-lg shadow-indigo-100"
                  >
                    <Send size={18} />
                  </button>
                </div>
              </div>
            </>
          )}
        </>
      )}

      {showSourceModal && (
        <KnowledgeSourceModal 
          availableExams={[]} 
          onAddExam={handleAddKnowledge}
          onAddFile={(title, content) => handleAddKnowledge({ type: 'file', title, content })}
          onClose={() => setShowSourceModal(false)}
        />
      )}
    </div>
  );
}
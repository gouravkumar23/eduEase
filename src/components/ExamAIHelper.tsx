"use client";

import { useState, useRef, useEffect } from 'react';
import { BrainCircuit, Send, Mic, MicOff, VolumeX, Loader2 } from 'lucide-react';
import { runWithAIFallback, isRetryableAIError } from '../utils/ai';
import { useSpeech } from '../hooks/useSpeech';
import ReactMarkdown from 'react-markdown';

interface Message {
  role: 'user' | 'model';
  parts: { text: string }[];
}

interface ExamAIHelperProps {
  exam: any;
  attempt: any;
  allocations: any[];
}

export default function ExamAIHelper({ exam, attempt, allocations }: ExamAIHelperProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [chatSession, setChatSession] = useState<any>(null);
  const { isListening, isSpeaking, speak, listen, stopSpeaking } = useSpeech();
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

  const initChat = async (isReconnect = false) => {
    setLoading(true);
    try {
      const performanceSummary = allocations.map((a, i) => {
        const isCorrect = a.questions.question_type === 'mcq' && 
          a.student_answer?.toUpperCase() === a.questions.correct_option?.toUpperCase();
        return `Q${i+1}: ${a.questions.text}. Student Answer: ${a.student_answer || 'None'}. Correct: ${a.questions.correct_option}. Status: ${isCorrect ? 'Correct' : 'Incorrect'}`;
      }).join('\n');

      const session = await runWithAIFallback(async (model) => {
        const history: Message[] = [
          {
            role: 'user',
            parts: [{ text: `You are an AI Performance Coach for the exam "${exam.title}". 
              The student scored ${attempt.score}% (${attempt.obtained_score}/${attempt.total_exam_score}).
              Here is their performance data:
              ${performanceSummary}
              Analyze their weak areas and help them understand the concepts they missed.` }]
          }
        ];

        if (isReconnect && messagesRef.current.length > 0) {
          history.push(...messagesRef.current);
        }

        return model.startChat({ history });
      });

      setChatSession(session);
      
      if (!isReconnect) {
        const result = await session.sendMessageStream("Hello Coach, please give me my initial analysis.");
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
        speak(fullText);
      }
    } catch (error) {
      console.error("AI Init Error:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    initChat();
  }, [exam.id]);

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
      if (isRetryableAIError(error) && retryCount < 3) {
        await initChat(true);
        return handleSend(userMsg, retryCount + 1);
      }
      setMessages(prev => [...prev, { role: 'model', parts: [{ text: "I'm sorry, I encountered an error. Please try again." }] }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[600px] bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
      <div className="p-4 bg-indigo-600 text-white flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-white/20 rounded-xl">
            <BrainCircuit size={20} />
          </div>
          <div>
            <h3 className="font-bold text-sm">AI Performance Coach</h3>
            <p className="text-[10px] text-indigo-100 uppercase font-bold tracking-widest">Continuous Learning Session</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isSpeaking && (
            <button onClick={stopSpeaking} className="p-2 bg-white/20 rounded-lg hover:bg-white/30 transition-all">
              <VolumeX size={16} />
            </button>
          )}
          <div className="px-2 py-1 bg-emerald-500 text-[10px] font-black rounded-lg animate-pulse">LIVE</div>
        </div>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50">
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] p-4 rounded-2xl text-sm shadow-sm ${
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
            <div className="bg-white border p-4 rounded-2xl rounded-tl-none shadow-sm">
              <Loader2 size={20} className="animate-spin text-indigo-600" />
            </div>
          </div>
        )}
      </div>

      <div className="p-4 border-t bg-white">
        <div className="flex gap-2">
          <button 
            onClick={() => listen((text) => handleSend(text))}
            className={`p-3 rounded-2xl transition-all ${isListening ? 'bg-rose-100 text-rose-600 animate-pulse' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
          >
            {isListening ? <MicOff size={20} /> : <Mic size={20} />}
          </button>
          <input 
            type="text" 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Ask about a specific question..."
            className="flex-1 bg-slate-100 border-none rounded-2xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
          />
          <button 
            onClick={() => handleSend()}
            disabled={loading || !input.trim()}
            className="bg-indigo-600 text-white p-3 rounded-2xl hover:bg-indigo-700 disabled:opacity-50 transition-all shadow-lg shadow-indigo-100"
          >
            <Send size={20} />
          </button>
        </div>
      </div>
    </div>
  );
}
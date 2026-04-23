"use client";

import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../lib/firebase';
import { collection, query, where, getDocs, doc, getDoc, addDoc, serverTimestamp, orderBy, limit } from 'firebase/firestore';
import { runWithAIFallback, isRetryableAIError, getSettings } from '../utils/ai';
import { useSpeech } from '../hooks/useSpeech';
import { useSearchParams } from 'react-router-dom';
import KnowledgeSidebar, { KnowledgeSource } from './KnowledgeSidebar';
import KnowledgeSourceModal from './KnowledgeSourceModal';
import LearningChat from './LearningChat';
import LearningHubHeader from './LearningHubHeader';

interface Message {
  role: 'user' | 'model';
  parts: { text: string }[];
}

export default function AILearningHub() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const [sources, setSources] = useState<KnowledgeSource[]>([]);
  const [availableExams, setAvailableExams] = useState<any[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [chatSession, setChatSession] = useState<any>(null);
  const [showSourceModal, setShowSourceModal] = useState(false);
  const [language, setLanguage] = useState(localStorage.getItem('ai_hub_lang') || 'en-US');
  
  const { isListening, isSpeaking, speak, listen, stopSpeaking } = useSpeech();
  const messagesRef = useRef<Message[]>([]);

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  const getSystemPrompt = useCallback((currentSources: KnowledgeSource[], currentLang: string) => {
    const contextString = currentSources.length > 0 
      ? currentSources.map(s => `SOURCE: ${s.title} (${s.type})\nCONTENT: ${s.content}\n${s.performance ? `STUDENT PERFORMANCE: ${s.performance}` : ''}`).join('\n\n')
      : "No specific documents provided yet. Help the student with general academic queries.";

    const langName = currentLang === 'hi-IN' ? 'Hindi' : currentLang === 'te-IN' ? 'Telugu' : 'English';

    return `You are the EduEase AI Learning Coach. 
      
      KNOWLEDGE BASE:
      ${contextString}
      
      STRICT LANGUAGE RULE:
      You MUST respond in ${langName} ONLY. This is a hard requirement. 
      Even if the user greets you in English, you must reply in ${langName}.
      
      Your goal is to:
      1. Explain concepts from the provided documents.
      2. Identify weak areas from performance data and teach those topics.
      3. Be interactive, encouraging, and professional.
      4. Use markdown for formatting.
      5. Keep responses concise for voice playback.`;
  }, []);

  const initChat = async (initialSources: KnowledgeSource[], currentLang: string, isNewSession = true) => {
    setLoading(true);
    try {
      const systemPrompt = getSystemPrompt(initialSources, currentLang);
      const langName = currentLang === 'hi-IN' ? 'Hindi' : currentLang === 'te-IN' ? 'Telugu' : 'English';

      const session = await runWithAIFallback(async (model) => {
        const history: Message[] = [
          {
            role: 'user',
            parts: [{ text: systemPrompt }]
          },
          {
            role: 'model',
            parts: [{ text: `Understood. I am now your EduEase AI Learning Coach. I will communicate with you exclusively in ${langName} and use your provided knowledge base to assist you.` }]
          }
        ];

        // If we are reconnecting due to a rate limit, preserve the actual conversation history
        if (!isNewSession && messagesRef.current.length > 0) {
          history.push(...messagesRef.current);
        }

        return model.startChat({ history });
      });

      setChatSession(session);
      
      if (isNewSession) {
        const result = await session.sendMessageStream(`Hello Coach, I've updated my settings. Please greet me and summarize what you can help me with in ${langName}.`);
        
        let fullText = "";
        const aiMsg: Message = { role: 'model', parts: [{ text: "" }] };
        setMessages(prev => [...prev, aiMsg]);

        for await (const chunk of result.stream) {
          const chunkText = chunk.text();
          fullText += chunkText;
          setMessages(prev => {
            const last = prev[prev.length - 1];
            return [...prev.slice(0, -1), { ...last, parts: [{ text: fullText }] }];
          });
        }
        
        const finalAiMsg = { role: 'model' as const, parts: [{ text: fullText }] };
        await saveMessage(finalAiMsg);
        speak(fullText, currentLang);
      }
    } catch (error) {
      console.error("AI Init Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadChatHistory = async () => {
    if (!user) return;
    const q = query(
      collection(db, 'ai_learning_history'),
      where('userId', '==', user.id),
      orderBy('timestamp', 'desc'),
      limit(20)
    );
    const snap = await getDocs(q);
    const history = snap.docs.map(d => d.data().message).reverse();
    if (history.length > 0) {
      setMessages(history);
    }
  };

  useEffect(() => {
    if (!user) return;
    
    const init = async () => {
      await fetchAvailableExams();
      await loadChatHistory();
      
      const examId = searchParams.get('examId');
      if (examId) {
        const attemptQ = query(
          collection(db, 'attempts'), 
          where('student_id', '==', user.id),
          where('exam_id', '==', examId)
        );
        const snap = await getDocs(attemptQ);
        if (!snap.empty) {
          const attempt = { id: snap.docs[0].id, ...snap.docs[0].data() };
          const examDoc = await getDoc(doc(db, 'exams', examId));
          if (examDoc.exists()) {
            handleAddExamSource({ ...attempt, examData: examDoc.data() });
          }
        }
      } else {
        initChat([], language, messages.length === 0);
      }
    };
    
    init();
  }, [user]);

  const saveMessage = async (msg: Message) => {
    if (!user) return;
    await addDoc(collection(db, 'ai_learning_history'), {
      userId: user.id,
      message: msg,
      timestamp: serverTimestamp()
    });
  };

  const fetchAvailableExams = async () => {
    if (!user) return;
    const q = query(
      collection(db, 'attempts'), 
      where('student_id', '==', user.id),
      where('status', 'in', ['SUBMITTED', 'AUTO_SUBMITTED', 'GRADED'])
    );
    const snap = await getDocs(q);
    const attempts = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    
    const examsWithKeys: any[] = [];
    for (const attempt of attempts) {
      const examDoc = await getDoc(doc(db, 'exams', attempt.exam_id));
      if (examDoc.exists()) {
        const examData = examDoc.data();
        if (examData.answer_key_released || examData.results_released) {
          examsWithKeys.push({ ...attempt, examData });
        }
      }
    }
    setAvailableExams(examsWithKeys);
  };

  const handleAddExamSource = async (attempt: any) => {
    const q = query(collection(db, 'allocations'), where('attempt_id', '==', attempt.id));
    const snap = await getDocs(q);
    const allocs = snap.docs.map(d => d.data());

    const content = allocs.map((a, i) => {
      const qText = a.questions.text;
      const correct = a.questions.correct_option;
      const student = a.student_answer;
      return `Q${i+1}: ${qText}. Correct Answer: ${correct}. Student Answer: ${student || 'None'}.`;
    }).join('\n');

    const performance = attempt.examData.results_released 
      ? `Score: ${attempt.score}%. Obtained ${attempt.obtained_score} out of ${attempt.total_exam_score}.`
      : "Results not released, but answer key is available for review.";

    const newSource: KnowledgeSource = {
      id: attempt.id,
      type: 'exam',
      title: attempt.exam_title,
      content,
      performance
    };

    const updatedSources = [...sources, newSource];
    setSources(updatedSources);
    setShowSourceModal(false);
    initChat(updatedSources, language);
  };

  const handleAddFileSource = (title: string, content: string) => {
    const newSource: KnowledgeSource = {
      id: Math.random().toString(36).substr(2, 9),
      type: 'file',
      title,
      content
    };

    const updatedSources = [...sources, newSource];
    setSources(updatedSources);
    initChat(updatedSources, language);
  };

  const handleSend = async (textOverride?: string, retryCount = 0) => {
    const text = textOverride || input;
    if (!text.trim() || loading || !chatSession) return;

    if (isSpeaking) stopSpeaking();

    const userMsg = text.trim();
    const userMsgObj: Message = { role: 'user', parts: [{ text: userMsg }] };
    
    if (retryCount === 0) {
      setInput('');
      setMessages(prev => [...prev, userMsgObj]);
      await saveMessage(userMsgObj);
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

      const finalAiMsg = { role: 'model' as const, parts: [{ text: fullText }] };
      await saveMessage(finalAiMsg);
      speak(fullText, language);
    } catch (error: any) {
      console.error("Send Error:", error);
      
      const { keys } = await getSettings();
      const maxRetries = keys.length * 2; 

      if (isRetryableAIError(error) && retryCount < maxRetries) {
        console.log(`[AI_RETRY] Rate limit hit. Reconnecting session and retrying... (Attempt ${retryCount + 1}/${maxRetries})`);
        // Re-initialize chat which will cycle to the next key via runWithAIFallback
        await initChat(sources, language, false); 
        return handleSend(userMsg, retryCount + 1); 
      }

      setMessages(prev => [...prev, { role: 'model', parts: [{ text: "I'm sorry, I've exhausted all available AI keys. Please try again in a few minutes." }] }]);
    } finally {
      setLoading(false);
    }
  };

  const removeSource = (id: string) => {
    const updated = sources.filter(s => s.id !== id);
    setSources(updated);
    initChat(updated, language);
  };

  const handleLanguageChange = (lang: string) => {
    setLanguage(lang);
    localStorage.setItem('ai_hub_lang', lang);
    initChat(sources, lang);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col lg:flex-row">
      <KnowledgeSidebar 
        sources={sources} 
        onAddClick={() => setShowSourceModal(true)} 
        onRemoveSource={removeSource}
        userName={user?.name}
      />

      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        <LearningHubHeader 
          isSpeaking={isSpeaking} 
          onStopSpeaking={stopSpeaking} 
          isChatActive={!!chatSession} 
          language={language}
          onLanguageChange={handleLanguageChange}
        />

        <LearningChat 
          messages={messages}
          loading={loading}
          input={input}
          setInput={setInput}
          onSend={handleSend}
          isListening={isListening}
          onListen={() => listen((text) => handleSend(text), language)}
          isChatActive={!!chatSession}
        />
      </main>

      {showSourceModal && (
        <KnowledgeSourceModal 
          availableExams={availableExams}
          onAddExam={handleAddExamSource}
          onAddFile={handleAddFileSource}
          onClose={() => setShowSourceModal(false)}
        />
      )}
    </div>
  );
}